import { NextRequest, NextResponse } from "next/server";

const RAG_API = process.env.RAG_API_URL || "http://localhost:8099";

/* ─── GET /api/rag  →  status + ingest-progress ─── */
export async function GET() {
  try {
    const [statusRes, progressRes] = await Promise.all([
      fetch(`${RAG_API}/status`, { next: { revalidate: 0 } }),
      fetch(`${RAG_API}/ingest-progress`, { next: { revalidate: 0 } }),
    ]);

    const status = await statusRes.json();
    const progress = await progressRes.json();

    return NextResponse.json({
      processed: status.processed ?? 0,
      failed: status.failed ?? 0,
      totalChunks: status.total_chunks ?? 0,
      ingest: {
        running: progress.running ?? false,
        total: progress.total ?? 0,
        done: progress.done ?? 0,
        failed: progress.failed ?? 0,
        currentFile: progress.current_file ?? "",
        skipped: progress.skipped ?? 0,
      },
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch RAG status" },
      { status: 500 }
    );
  }
}

/* ─── POST /api/rag  →  proxy retrieve / agent / tags ─── */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, ...params } = body;

    /* --- tags --------------------------------------------------------- */
    if (action === "tags") {
      const res = await fetch(`${RAG_API}/tags`, {
        next: { revalidate: 0 },
      });
      const data = await res.json();
      // normalise → always return { tags: string[] }
      const tags: string[] = Array.isArray(data)
        ? data
        : Array.isArray(data.tags)
        ? data.tags
        : [];
      return NextResponse.json({ tags });
    }

    /* --- retrieve (semantic search) ----------------------------------- */
    if (action === "retrieve") {
      const res = await fetch(`${RAG_API}/retrieve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: params.question,
          top_k: params.top_k ?? 8,
          tags: params.tags,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: err || "RAG retrieve failed" },
          { status: res.status }
        );
      }

      const data = await res.json();

      // RAG API returns { chunks: [...] } — map to frontend's expected shape
      const chunks = data.chunks ?? data.results ?? (Array.isArray(data) ? data : []);
      const results = chunks.map((c: Record<string, unknown>) => ({
        title: c.title ?? "",
        text: c.text ?? "",
        source: c.source_path ?? c.source ?? "",
        page: c.page ?? null,
        score: c.rerank_score != null
          ? Math.min((c.rerank_score as number) / 10, 1)   // normalise rerank_score ≈0-10 → 0-1
          : c.score ?? null,
        tags: c.tags ?? [],
      }));

      return NextResponse.json(results);
    }

    /* --- agent --------------------------------------------------------- */
    if (action === "agent") {
      const res = await fetch(`${RAG_API}/agent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: params.question,
          max_steps: params.max_steps ?? 5,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        return NextResponse.json(
          { error: err || "RAG agent failed" },
          { status: res.status }
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    }

    return NextResponse.json(
      { error: `Unknown action: ${action}` },
      { status: 400 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
