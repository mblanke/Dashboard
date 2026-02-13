# ATLAS Operations Log

---

## February 11, 2026

### RAG Pipeline — Bulk Ingestion Complete

- **RAG v3.0 API** running at `http://localhost:8099` (container: `rag-api`)
- Ingested **9,016 files** from `/mnt/media/References` into Qdrant vector DB
- **229 failed** (mostly transient timeouts — retryable via `/retry-failed`)
- **27,255 chunks** indexed in Qdrant collection `references`
- Hybrid search enabled: dense (bge-m3 1024-dim) + sparse (BM25) + reranking
- 2 Whisper GPU nodes for audio transcription (medium model, Blackwell SM_120)
- Docling for PDF/HTML/DOCX extraction

### CISA KEV Full Catalog Ingestion

- Ingested all **1,513 CISA Known Exploited Vulnerabilities** from the federal catalog
- Source: `https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json`
- Each CVE saved as structured text with vendor, product, description, remediation dates
- Stored in `/mnt/media/References/feeds/cisa_kev/`
- Completed in ~4 minutes (lightweight plaintext path, no Whisper/Docling needed)

### Feed Ingestion System

- Rewrote `ingest_feeds_v2.py` to work with RAG v3.0 API (old script called dead Phase 3 scripts)
- Configured feeds in `/opt/rag/docs/feeds.json`:
  - **CISA KEV** (JSON) — 1,513 items
  - **Docker Blog** (RSS) — 10 items
  - **Ubuntu Security Notices** (RSS) — 10 items
  - **GitHub Blog** (RSS) — 10 items
  - **Traefik Blog** (RSS) — configured, 0 items fetched
- State tracked in `/opt/rag/state/feeds_state_v2.json` to avoid re-ingesting
- Host/container path translation: `/mnt/media/References` ↔ `/mnt/references`

### OpenWebUI RAG Filter

- Filter `rag_context_filter` already installed and active in OpenWebUI
- Calls `POST /retrieve` on every chat message
- Score threshold: 0.3, max context: 8,000 chars, top-k: 8
- Users at `https://ai.guapo613.beer` get automatic RAG context injection

### Grafana RAG Dashboard

- Prometheus scraping `rag-api` at `192.168.1.21:8099/metrics`
- Dashboard provisioned at `https://grafana.guapo613.beer`
- Panels: ingest rate, duration histograms, file counts by status, query latency

### Dashboard Deployment

- Next.js dashboard built and deployed as container `dashboard`
- Accessible at `https://dashboard.guapo613.beer` via Traefik (HTTPS confirmed 200)
- Monitors: Docker containers, UniFi network, Synology NAS, Grafana links
- Source: `/opt/dashboard/`

### Dead Code Cleanup

- Archived 11 obsolete Phase 3 scripts to `/opt/rag/scripts/_archived/`:
  - `explain_api.py`, `scan_books.py`, `ingest_file.py`, `ingest.py`
  - `extract_text.py`, `safe_fetch.py`, `transcribe.py`, `qdrant_init.py`
  - `bootstrap.sh`, `requirements.txt`, `ingest_feeds.py`

### n8n Morning Ops Digest (ATLAS-01)

- Imported `ATLAS-01-morning-ops-digest.json` into n8n via CLI
- Workflow activated — triggers daily at 7:00 AM ET
- Flow: Cron → Prometheus service status + Docker container list → Summary → LLM digest
- Set up n8n owner account: `mblanke@gmail.com` / `Powers4w!`
- n8n UI: `https://n8n.guapo613.beer`
- 4 total workflows in n8n (3 existing RAG-related + ATLAS-01)

### Infrastructure State

| Service | Container | Status | URL |
|---------|-----------|--------|-----|
| RAG API | `rag-api` | Running (8099) | `http://localhost:8099` |
| Qdrant | `qdrant` | Running (6333) | — |
| OpenWebUI | `openwebui` | Healthy | `https://ai.guapo613.beer` |
| LiteLLM | `llm-router` | Running (4000) | `https://llm.guapo613.beer` |
| Traefik | `traefik` | Running (80/443) | — |
| Grafana | `grafana` | Running | `https://grafana.guapo613.beer` |
| n8n | `n8n` | Running (5678) | `https://n8n.guapo613.beer` |
| Dashboard | `dashboard` | Running (3000) | `https://dashboard.guapo613.beer` |
| Docling | `docling` | Running (5001) | — |
| Whisper Node 1 | — | Running | `100.110.190.11:8200` |
| Whisper Node 2 | — | Running | `100.110.190.12:8200` |

### Key Paths

| Path | Purpose |
|------|---------|
| `/opt/rag/app/main.py` | RAG v3.0 API (719 lines) |
| `/opt/rag/app/config.py` | Settings & env vars |
| `/opt/rag/scripts/ingest_feeds_v2.py` | Feed ingestion script |
| `/opt/rag/docs/feeds.json` | Feed source configuration |
| `/opt/rag/data/state.db` | SQLite ingestion state |
| `/opt/rag/openwebui-rag-filter.py` | OpenWebUI filter source |
| `/opt/ai-stack/` | AI stack compose & data |
| `/opt/dashboard/` | Next.js dashboard source |
| `/mnt/media/References/` | Document library (host mount) |
| `/mnt/media/References/feeds/` | Ingested feed articles |

---
