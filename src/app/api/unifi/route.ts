import { NextResponse } from "next/server";
import https from "https";

const UNIFI_HOST = process.env.UNIFI_HOST || "192.168.1.1";
const UNIFI_PORT = process.env.UNIFI_PORT || "443";
const UNIFI_USERNAME = process.env.UNIFI_USERNAME;
const UNIFI_PASSWORD = process.env.UNIFI_PASSWORD;

export const dynamic = "force-dynamic";

function httpsRequest(
  url: string,
  opts: { method?: string; headers?: Record<string, string>; body?: string } = {}
): Promise<{ status: number; headers: Record<string, string[]>; body: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const agent = new https.Agent({ rejectUnauthorized: false });
    const reqOpts: https.RequestOptions = {
      hostname: parsed.hostname,
      port: parseInt(parsed.port || "443", 10),
      path: parsed.pathname + parsed.search,
      method: opts.method || "GET",
      headers: opts.headers || {},
      agent,
    };
    const req = https.request(reqOpts, (res) => {
      let data = "";
      res.on("data", (chunk: Buffer) => (data += chunk.toString()));
      res.on("end", () => {
        const hdrs: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(res.headers)) {
          hdrs[k.toLowerCase()] = Array.isArray(v) ? v : v ? [v] : [];
        }
        resolve({ status: res.statusCode || 0, headers: hdrs, body: data });
      });
    });
    req.on("error", reject);
    if (opts.body) req.write(opts.body);
    req.end();
  });
}

export async function GET() {
  if (!UNIFI_USERNAME || !UNIFI_PASSWORD) {
    return NextResponse.json({ error: "UniFi credentials not configured" }, { status: 500 });
  }

  try {
    const baseUrl = `https://${UNIFI_HOST}:${UNIFI_PORT}`;

    // Login
    const loginResp = await httpsRequest(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: UNIFI_USERNAME, password: UNIFI_PASSWORD }),
    });

    if (loginResp.status !== 200) {
      return NextResponse.json({ error: `UniFi login failed: ${loginResp.status}` }, { status: 401 });
    }

    const setCookies = loginResp.headers["set-cookie"] || [];
    const cookieStr = setCookies.map((c) => c.split(";")[0]).join("; ");
    const csrfToken = (loginResp.headers["x-csrf-token"] || [])[0] || "";
    const reqHeaders: Record<string, string> = { Cookie: cookieStr };
    if (csrfToken) reqHeaders["x-csrf-token"] = csrfToken;

    // Fetch devices + health in parallel
    const [devicesResp, healthResp] = await Promise.all([
      httpsRequest(`${baseUrl}/proxy/network/api/s/default/stat/device`, { headers: reqHeaders }),
      httpsRequest(`${baseUrl}/proxy/network/api/s/default/stat/health`, { headers: reqHeaders }),
    ]);

    // Parse devices
    const rawDevices = devicesResp.status === 200 ? (JSON.parse(devicesResp.body)?.data || []) : [];
    const devices = rawDevices.map((d: any) => ({
      name: d.name || d.model || "Unknown",
      mac: d.mac || "",
      ip: d.ip || "",
      model: d.model || "",
      type: d.type || "",
      state: d.state ?? 0,
      uptime: d.uptime || 0,
      clients: d.num_sta || 0,
    }));

    // Parse health subsystems
    const rawHealth = healthResp.status === 200 ? (JSON.parse(healthResp.body)?.data || []) : [];
    const health: Record<string, any> = {};
    for (const h of rawHealth) {
      const sub = h.subsystem;
      if (sub === "wan") {
        health.wan = {
          status: h.status,
          wanIp: h.wan_ip || "",
          isp: h.isp_name || "",
          txRate: h["tx_bytes-r"] || 0,
          rxRate: h["rx_bytes-r"] || 0,
          gateways: h.num_gw || 0,
          clients: h.num_sta || 0,
        };
      } else if (sub === "www") {
        health.www = {
          status: h.status,
          latency: h.latency || 0,
          uptime: h.uptime || 0,
          downSpeed: h.xput_down || 0,
          upSpeed: h.xput_up || 0,
        };
      } else if (sub === "wlan") {
        health.wlan = {
          status: h.status,
          adopted: h.num_adopted || 0,
          clients: h.num_user || 0,
          aps: h.num_ap || 0,
          txRate: h["tx_bytes-r"] || 0,
          rxRate: h["rx_bytes-r"] || 0,
        };
      } else if (sub === "lan") {
        health.lan = {
          status: h.status,
          adopted: h.num_adopted || 0,
          clients: h.num_user || 0,
          switches: h.num_sw || 0,
          txRate: h["tx_bytes-r"] || 0,
          rxRate: h["rx_bytes-r"] || 0,
        };
      } else if (sub === "vpn") {
        health.vpn = { status: h.status };
      }
    }

    const totalClients = devices.reduce((s: number, d: any) => s + d.clients, 0);

    return NextResponse.json({ devices, health, totalClients });
  } catch (error: any) {
    console.error("UniFi API error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch UniFi data" }, { status: 500 });
  }
}
