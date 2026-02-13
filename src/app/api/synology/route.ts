import { NextResponse } from "next/server";

const SYNOLOGY_HOST = process.env.SYNOLOGY_HOST;
const SYNOLOGY_PORT = process.env.SYNOLOGY_PORT || "5000";
const SYNOLOGY_USERNAME = process.env.SYNOLOGY_USERNAME;
const SYNOLOGY_PASSWORD = process.env.SYNOLOGY_PASSWORD;

export const dynamic = "force-dynamic";

export async function GET() {
  if (!SYNOLOGY_HOST || !SYNOLOGY_USERNAME || !SYNOLOGY_PASSWORD) {
    return NextResponse.json(
      { error: "Synology credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const protocol = SYNOLOGY_PORT === "5001" ? "https" : "http";
    const baseUrl = `${protocol}://${SYNOLOGY_HOST}:${SYNOLOGY_PORT}/webapi`;

    // Login
    const loginUrl = `${baseUrl}/auth.cgi?api=SYNO.API.Auth&version=3&method=login&account=${encodeURIComponent(
      SYNOLOGY_USERNAME
    )}&passwd=${encodeURIComponent(SYNOLOGY_PASSWORD)}&session=FileStation&format=sid`;

    const loginResp = await fetch(loginUrl, { cache: "no-store" });
    const loginData = await loginResp.json();

    if (!loginData.success) {
      console.error("Synology login failed:", JSON.stringify(loginData));
      return NextResponse.json(
        { error: "Synology login failed" },
        { status: 401 }
      );
    }

    const sid = loginData.data.sid;

    // Get storage info
    const storageResp = await fetch(
      `${baseUrl}/entry.cgi?api=SYNO.Storage.CGI.Storage&version=1&method=load_info&_sid=${sid}`,
      { cache: "no-store" }
    );
    const storageData = await storageResp.json();

    // Get system utilization
    let utilization = null;
    try {
      const utilResp = await fetch(
        `${baseUrl}/entry.cgi?api=SYNO.Core.System.Utilization&version=1&method=get&_sid=${sid}`,
        { cache: "no-store" }
      );
      const utilData = await utilResp.json();
      if (utilData.success) {
        utilization = {
          cpu: utilData.data?.cpu?.user_load ?? null,
          memory: utilData.data?.memory?.real_usage ?? null,
        };
      }
    } catch (e) {
      console.error("Synology utilization error:", e);
    }

    // Parse volumes - Synology returns size.total / size.used as string byte counts
    const volumes = (storageData.data?.volumes || []).map((vol: any) => {
      const total = parseInt(vol.size?.total || "0", 10);
      const used = parseInt(vol.size?.used || "0", 10);
      const free = total - used;
      return {
        volume: vol.vol_path || vol.id || "unknown",
        id: vol.id || vol.vol_path || "unknown",
        size: total,
        used: used,
        available: free,
        percentUsed: total > 0 ? ((used / total) * 100).toFixed(1) : "0",
        status: vol.status || "unknown",
        fsType: vol.fs_type || "unknown",
      };
    });

    // Parse disks
    const disks = (storageData.data?.disks || []).map((disk: any) => ({
      name: disk.longName || disk.name || disk.id || "Unknown",
      model: disk.model || "Unknown",
      serial: disk.serial || "",
      sizeBytes: parseInt(disk.size_total || "0", 10),
      status: disk.smart_status || disk.overview_status || "unknown",
      isSsd: disk.isSsd || false,
      temp: disk.temp || null,
    }));

    // Logout (non-blocking)
    fetch(
      `${baseUrl}/auth.cgi?api=SYNO.API.Auth&version=3&method=logout&session=FileStation&_sid=${sid}`,
      { cache: "no-store" }
    ).catch(() => {});

    return NextResponse.json({ volumes, disks, utilization });
  } catch (error: any) {
    console.error("Synology API error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch Synology storage" },
      { status: 500 }
    );
  }
}
