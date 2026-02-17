import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

const SYNOLOGY_HOST = process.env.SYNOLOGY_HOST;
const SYNOLOGY_PORT = process.env.SYNOLOGY_PORT || "5001";
const SYNOLOGY_USERNAME = process.env.SYNOLOGY_USERNAME;
const SYNOLOGY_PASSWORD = process.env.SYNOLOGY_PASSWORD;

// Port 5000 = HTTP, 5001+ = HTTPS (Synology convention)
const protocol = SYNOLOGY_PORT === "5000" ? "http" : "https";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!SYNOLOGY_HOST || !SYNOLOGY_USERNAME || !SYNOLOGY_PASSWORD) {
    return NextResponse.json(
      { error: "Synology credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const baseUrl = `${protocol}://${SYNOLOGY_HOST}:${SYNOLOGY_PORT}`;
    const httpsConfig =
      protocol === "https"
        ? { httpsAgent: new https.Agent({ rejectUnauthorized: false }) }
        : {};

    // Login
    const loginResponse = await axios.get(`${baseUrl}/webapi/auth.cgi`, {
      params: {
        api: "SYNO.API.Auth",
        version: 3,
        method: "login",
        account: SYNOLOGY_USERNAME,
        passwd: SYNOLOGY_PASSWORD,
        session: "FileStation",
        format: "sid",
      },
      ...httpsConfig,
    });

    const sid = loginResponse.data.data.sid;

    // Fetch storage + utilization in parallel
    const [storageResponse, utilizationResponse] = await Promise.all([
      axios.get(`${baseUrl}/webapi/entry.cgi`, {
        params: {
          api: "SYNO.Storage.CGI.Storage",
          version: 1,
          method: "load_info",
          _sid: sid,
        },
        ...httpsConfig,
      }),
      axios.get(`${baseUrl}/webapi/entry.cgi`, {
        params: {
          api: "SYNO.Core.System.Utilization",
          version: 1,
          method: "get",
          _sid: sid,
        },
        ...httpsConfig,
      }).catch(() => null),
    ]);

    const storageData = storageResponse.data.data;

    // Parse volumes — size info is nested: vol.size.total, vol.size.used
    const rawVolumes = storageData.volumes || [];
    const volumes = rawVolumes.map((vol: any) => {
      const sizeObj = vol.size || {};
      const total = parseInt(sizeObj.total, 10) || 0;
      const used = parseInt(sizeObj.used, 10) || 0;
      const available = total - used;
      const pct = total > 0 ? ((used / total) * 100).toFixed(2) : "0";
      return {
        volume: vol.vol_path || vol.volume_path || "",
        id: vol.id || "",
        size: total,
        used: used,
        available: available,
        percentUsed: pct,
        status: vol.status || "unknown",
        fsType: vol.fs_type || "",
      };
    });

    // Parse disks
    const rawDisks = storageData.disks || [];
    const disks = rawDisks.map((d: any) => ({
      name: d.name || d.longName || "Unknown",
      model: d.model || "",
      status: d.smart_status || d.status || "unknown",
      isSsd: d.isSsd ?? false,
      temp: typeof d.temp === "number" ? d.temp : null,
    }));

    // Parse utilization
    let utilization: { cpu: number | null; memory: number | null } | null = null;
    if (utilizationResponse?.data?.data) {
      const util = utilizationResponse.data.data;
      const cpu = util.cpu
        ? (util.cpu.user_load || 0) + (util.cpu.system_load || 0)
        : null;
      const memory = util.memory?.real_usage ?? null;
      utilization = { cpu, memory };
    }

    return NextResponse.json({ volumes, disks, utilization });
  } catch (error) {
    console.error(
      "Synology API error:",
      error instanceof Error ? error.message : error
    );
    return NextResponse.json(
      { error: "Failed to fetch Synology storage" },
      { status: 500 }
    );
  }
}
