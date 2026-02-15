import { NextResponse } from "next/server";

const RAG_API = process.env.RAG_API_URL || "http://localhost:8099";

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
