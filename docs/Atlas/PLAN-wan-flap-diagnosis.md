# PLAN — WAN1 Flap Diagnosis

**Status:** PROPOSED — NOT APPLIED
**Author:** drafted by Claude (hosted lane) for human execution
**Execution surface:** Claude Code on `kronos`, SSH out to `atlas` and the UCG-Fiber
**Target nodes:** UCG-Fiber (192.168.1.1), `atlas` (100.110.190.10), Rogers modem (192.168.100.1)
**Date:** 2026-08-03

---

## Constraints (read before executing)

- Claude Code runs on `kronos` only. Do **not** install or invoke Claude Code on `atlas` — it is sovereign-candidate and installing Claude Code reclassifies it off the sovereign lane.
- All interaction with `atlas` and the UCG is via plain SSH from `kronos`. Claude Code may draft scripts locally on `kronos`; the human copies them across and executes.
- Read-only diagnostics in Phase 0 and Phase 1. The only configuration change in this plan is Phase 3, Step 1 (WAN port speed pin), which is human-executed via the UniFi UI and explicitly reversible.
- No packet captures, no traffic content, no logs from this exercise are to be sent to a hosted model. Paste **summaries and counters only** (e.g. "14 carrier transitions, 3 CRC errors") — not raw log bodies, not client IP lists, not device inventories.
- Nothing here writes to a Gitea repo. If findings are worth keeping, the human commits them by hand.

---

## Purpose

Determine whether the repeated WAN1 outages are:

- **(A)** a physical-layer flap on the UCG-Fiber WAN port (2.5GbE autonegotiation / cabling), or
- **(B)** an upstream DOCSIS or bridge-mode failure at the Rogers modem, or
- **(C)** health-probe failures only, with no actual link loss (bufferbloat / upstream saturation).

These have different owners. (A) and (C) are fixable locally. (B) is a Rogers truck roll and requires evidence to get one scheduled.

---

## Evidence to date

| Observation | Source | Implication |
|---|---|---|
| Down + restore within the same minute (Aug 02 23:07) | UniFi System Logs | Discrete flap, not sustained degradation |
| Flaps at 03:15 and 06:56 — zero-load hours | UniFi System Logs | Weakens saturation and thermal hypotheses |
| Separate "High Latency" (21:27) and "Packet Loss" (10:24) events | UniFi System Logs | Distinct from the down/restore pairs; likely a second, concurrent problem |
| UL 44.98 GB vs DL 6.65 GB / 24h; live 3.61↑ / 0.32↓ Mbps | UniFi dashboard | Sustained upstream near-saturation; explains latency events, not flaps |
| ISP Health bar near-solid red | UniFi dashboard | Ambiguous — real instability or starved probes look identical |
| Onset correlates with modem swap + move to 2.5GbE | User report | Strongest single signal. Plant did not degrade the same week. |

**Working hypothesis:** (A) primary, (C) concurrent and masking. (B) still live and must be ruled out with data.

---

## Prerequisites

- [ ] SSH enabled on the UCG: Settings → Control Plane → Console → SSH, set a password
- [ ] SSH reachable from `kronos` to `atlas` over Tailscale
- [ ] Modem management page reachable at `192.168.100.1` (usually still responds in bridge mode)
- [ ] `mtr`, `curl`, `ethtool` present on `atlas` (`apt` only — no snap; snap has broken DNS on this fleet before)

---

## Phase 0 — One-shot UCG interrogation (10 minutes)

This is the decisive test. It separates (A)/(B) from (C) immediately.

SSH to the UCG from `kronos`:

```bash
ssh root@192.168.1.1
```

Identify the WAN interface — port 5 per the logs, but confirm rather than assume:

```bash
ip -br link
ip -br addr | grep -v ' lo '
```

Then:

```bash
# Negotiated speed and duplex — is it actually at 2500Mb/s?
ethtool <wan_iface>

# Error and carrier counters
ethtool -S <wan_iface> | grep -iE 'err|drop|crc|carrier|fail'

# Carrier transitions with timestamps
dmesg -T | grep -iE 'link|carrier|phy|autoneg|<wan_iface>'

# Uptime of the interface itself
cat /sys/class/net/<wan_iface>/carrier_up_count 2>/dev/null
cat /sys/class/net/<wan_iface>/carrier_down_count 2>/dev/null
```

**If `ethtool` is missing.** UniFi OS builds are trimmed and `ethtool` is not always present. Fall back to sysfs, which is always there:

```bash
cat /sys/class/net/<wan_iface>/speed     # 2500 or 1000
cat /sys/class/net/<wan_iface>/duplex    # full
cat /sys/class/net/<wan_iface>/statistics/rx_crc_errors 2>/dev/null
cat /sys/class/net/<wan_iface>/statistics/rx_errors
cat /sys/class/net/<wan_iface>/statistics/tx_errors
```

The `carrier_up_count` / `carrier_down_count` pair is the single most valuable reading in this phase — it is a cumulative counter that does not roll off the way `dmesg` does. **Record both numbers with a timestamp before you change anything**, so a later re-read can be differenced against this baseline.

**Expected result — three possible readings:**

| Reading | Interpretation | Go to |
|---|---|---|
| `dmesg` shows carrier down/up at 23:07 and 03:15; `carrier_down_count` > 0 | **(A) confirmed** — real PHY flap | Phase 3 |
| `dmesg` silent across those timestamps; carrier counts static | **(C) or (B)** — link never dropped, probes failed | Phase 1 |
| Rising CRC / carrier errors in `ethtool -S` | **(A) strongly indicated** — marginal 2.5GbE link | Phase 3 |

**If it fails:** if `dmesg -T` is empty or ring-buffer-rolled, fall back to `cat /var/log/messages | grep -i wan` and note that absence of evidence here is not evidence of absence — proceed to Phase 1 regardless.

---

## Phase 1 — 24h continuous logging from `atlas`

Retrospective app screenshots cannot correlate events. This produces a timeline that can.

Create `/opt/wan-diag/` on `atlas`. Three loggers.

Create the directory so that the invoking user can write the scripts into it, rather than
`sudo mkdir` followed by unprivileged heredocs (which fails with permission denied):

```bash
sudo install -d -o "$USER" -g "$USER" /opt/wan-diag
mkdir -p /opt/wan-diag/modem
cd /opt/wan-diag
```

### 1.1 Public IP change detector

The single highest-value signal. If the public IP changes at an outage timestamp, the modem re-registered with the CMTS — that is (B), and it is Rogers' problem.

Because this signal is the one that decides whether a Rogers service call is justified, it has
to be correct in exactly the case that matters: an outage, followed by the connection coming
back. The naive version — comparing against the last line of the log — reports a spurious
`CHANGED` immediately after *every* outage, because the last line at that moment is
`UNREACHABLE` rather than an address. It also fires on the very first run, when there is no
previous line at all. Both false positives point at (B) and would send you to Rogers with
nothing real behind it.

The version below compares against the last *known address*, skipping `UNREACHABLE` lines,
and validates that what came back actually looks like an IPv4 address (so an error page or a
captive-portal response is recorded as unreachable rather than as a changed address):

```bash
cat > ip-watch.sh <<'EOF'
#!/usr/bin/env bash
LOG=/opt/wan-diag/ip-history.log
IP=$(curl -s --max-time 8 https://api.ipify.org)
TS=$(date -Iseconds)

# Anything that is not a bare IPv4 address counts as unreachable — this includes
# the empty string, HTML error pages, and captive-portal interception.
if ! printf '%s' "$IP" | grep -qE '^[0-9]{1,3}(\.[0-9]{1,3}){3}$'; then
  echo "$TS UNREACHABLE" >> "$LOG"
  exit 0
fi

# Compare against the last KNOWN address, not the last line. Skipping UNREACHABLE
# lines is what prevents a spurious CHANGED on the first poll after every outage.
LAST=$(awk '$2 != "UNREACHABLE" { last = $2 } END { print last }' "$LOG" 2>/dev/null)

if [ -n "$LAST" ] && [ "$IP" != "$LAST" ]; then
  echo "$TS $IP CHANGED" >> "$LOG"
else
  echo "$TS $IP" >> "$LOG"
fi
EOF
chmod +x ip-watch.sh
```

### 1.2 Modem DOCSIS scrape

Captures signal levels and the T3/T4 event log. This is the artifact Rogers support will actually respond to.

Note the `--fail` flag: without it `curl -s` exits 0 on an HTTP 404 or 500 and `-o` writes the
error page to disk anyway, so the unreachable branch would almost never fire and you would
accumulate hundreds of junk files that look like real captures. Writing to a temporary path
and only keeping non-empty successful responses keeps the capture directory meaningful.

```bash
cat > modem-scrape.sh <<'EOF'
#!/usr/bin/env bash
TS=$(date +%Y%m%d-%H%M%S)
OUT=/opt/wan-diag/modem/modem-$TS.html
TMP=$(mktemp)

if curl -sf --max-time 10 http://192.168.100.1/ -o "$TMP" && [ -s "$TMP" ]; then
  mv "$TMP" "$OUT"
else
  rm -f "$TMP"
  echo "$(date -Iseconds) MODEM_UNREACHABLE" >> /opt/wan-diag/modem-errors.log
fi
EOF
chmod +x modem-scrape.sh
```

> If `192.168.100.1` does not respond, the modem's management interface is fully suppressed in bridge mode. Note this and skip 1.2 — you will need Rogers to pull the signal levels from their side instead.

### 1.3 Path latency and loss

Run the rolling `mtr` from a named script with a recorded PID. The inline
`nohup sh -c 'while true; ...' &` form cannot be cleaned up reliably: killing the `mtr`
process leaves the `while` loop alive, and it immediately spawns a replacement.

```bash
cat > mtr-watch.sh <<'EOF'
#!/usr/bin/env bash
while true; do
  echo "=== $(date -Iseconds) ===" >> /opt/wan-diag/mtr.log
  mtr -r -n -c 60 -i 1 1.1.1.1 >> /opt/wan-diag/mtr.log
done
EOF
chmod +x mtr-watch.sh

nohup /opt/wan-diag/mtr-watch.sh >/dev/null 2>&1 &
echo $! > /opt/wan-diag/mtr-watch.pid
```

Hop 1 is the CMTS. Loss appearing at hop 1 and persisting downstream is a plant problem. Loss appearing only at later hops is transit and irrelevant.

### 1.4 Schedule

```bash
sudo crontab -e
```

```
* * * * * /opt/wan-diag/ip-watch.sh
*/2 * * * * /opt/wan-diag/modem-scrape.sh
```

Run for a **full 24 hours minimum** — the flaps cluster overnight, so a daytime-only sample will miss the pattern.

Confirm the loggers are actually producing data before walking away — a silent cron failure
discovered 24h later costs a full day:

```bash
sleep 150
tail -n3 /opt/wan-diag/ip-history.log
tail -n5 /opt/wan-diag/mtr.log
ls /opt/wan-diag/modem/ | wc -l
```

---

## Phase 2 — Correlation

After 24h, from `kronos`:

```bash
ssh atlas 'grep CHANGED /opt/wan-diag/ip-history.log; \
           grep -c UNREACHABLE /opt/wan-diag/ip-history.log'
```

Cross-reference each UniFi outage timestamp against:

| Check | If yes | If no |
|---|---|---|
| Public IP changed at outage time? | **(B)** — modem re-registration. Escalate to Rogers. | Continue |
| `dmesg` carrier transition at outage time? | **(A)** — PHY flap. Go to Phase 3. | Continue |
| mtr shows hop-1 loss at outage time? | **(B)** — plant/CMTS. Escalate to Rogers. | Continue |
| None of the above, but latency spikes present? | **(C)** — probe starvation from upstream saturation. Go to Phase 4. | Re-examine; ambiguous |

Also re-read the carrier counters and difference them against the Phase 0 baseline. This is
independent of whether `dmesg` still holds the relevant window:

```bash
ssh root@192.168.1.1 'cat /sys/class/net/<wan_iface>/carrier_down_count'
```

A count that advanced by roughly the number of observed outages is (A). A count that did not
move at all, across outages that definitely occurred, rules out (A) and leaves (B) or (C).

Modem signal thresholds, if 1.2 produced data:

- Downstream power: roughly −7 to +7 dBmV
- Downstream SNR: > 33 dB
- Upstream power: 35–50 dBmV. Above ~52 dBmV means the modem is straining against a lossy plant — that alone justifies a service call.
- Any volume of **T3** or **T4** timeouts in the event log: plant problem, not local.

---

## Phase 3 — Remediation for (A): PHY flap

**Step 1 — Pin the WAN port to gigabit.** UniFi UI → Internet → WAN → port configuration → set 1000 Mbps full duplex (disable autonegotiation to 2.5GbE).

This costs nothing operationally: current upstream utilisation peaks near 3.61 Mbps and the Rogers upstream is the binding constraint regardless. Leave it 24h.

**Expected result:** flaps cease. That result is itself the diagnosis — confirmed NBASE-T negotiation instability.

**Rollback:** revert the port to auto in the same UI panel. No persistent state changed.

**Step 2 — Fix the physical layer, then restore 2.5GbE:**

- Short factory-terminated Cat6a, modem direct to UCG
- No keystones, no couplers, no punch-down segments in the WAN path
- Re-seat both ends
- Then re-enable auto and re-run Phase 0 to confirm carrier counts stay flat

---

## Phase 4 — Remediation for (C): upstream saturation

Independent of the flap cause, 44.98 GB up against 6.65 GB down in a day needs an owner identified. It will not cause a link to drop, but it will make every drop look worse and will obscure whether a Phase 3 fix worked.

1. UniFi → Traffic Stats → sort by upload, 24h window. Identify the top talker.
2. Likely candidates given the fleet: an offsite backup job, a Tailscale relay path, or a container on `atlas` syncing outward.
3. Enable Smart Queues on the UCG, cap upload at ~85% of measured Rogers upstream.

If enabling Smart Queues alone eliminates the latency and packet-loss events (but not the down/restore pairs), that cleanly separates (C) from (A)/(B) and confirms two independent problems.

---

## Exit criteria

- [ ] Cause classified as (A), (B), or (C) with a timestamp-correlated artifact backing it
- [ ] If (A): 48h clean at pinned gigabit, then physical remediation applied, then 2.5GbE restored and verified clean
- [ ] If (B): modem event log and signal levels captured; Rogers service call opened with the artifact attached
- [ ] If (C): top upstream talker identified; Smart Queues configured; latency/loss events cease
- [ ] `/opt/wan-diag` cron entries removed and loggers stopped once resolved

---

## Escalation

| Situation | Contact | Evidence to supply |
|---|---|---|
| T3/T4 timeouts present, or upstream power > 52 dBmV | Rogers technical support | Modem event log excerpt, signal levels, outage timestamps |
| Public IP changes at each outage | Rogers technical support | `ip-history.log` CHANGED lines correlated to UniFi timestamps |
| Flaps persist at pinned gigabit with clean modem signal | Ubiquiti support | `ethtool -S` counters, `dmesg` carrier transitions, UCG firmware version |

---

## Cleanup

```bash
sudo crontab -e     # remove the two wan-diag entries

# Kill the mtr loop by its recorded PID — killing mtr alone only makes the
# surrounding while-loop spawn a replacement.
sudo kill "$(cat /opt/wan-diag/mtr-watch.pid)" 2>/dev/null
sudo pkill -f mtr-watch.sh
sudo pkill -f 'mtr -r -n'

sudo rm -rf /opt/wan-diag   # only after findings are recorded elsewhere
```

Disable SSH on the UCG again once Phase 0 is complete if it was off beforehand.
