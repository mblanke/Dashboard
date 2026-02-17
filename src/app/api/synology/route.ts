import { NextResponse } from "next/server";
import axios from "axios";
import https from "https";

const SYNOLOGY_HOST = process.env.SYNOLOGY_HOST;
const SYNOLOGY_PORT = process.env.SYNOLOGY_PORT || "5001";
const SYNOLOGY_USERNAME = process.env.SYNOLOGY_USERNAME;
const SYNOLOGY_PASSWORD = process.env.SYNOLOGY_PASSWORD;

// Port 5000 = HTTP, 5001+ = HTTPS (Synology convention)
const protocol = SYNOLOGY_PORT === "5000" ? "http" : "https";

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
        ? {
            httpsAgent: new https.Agent({ rejectUnauthorized: false }),
          }
        : {};

    // Login to Synology
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

    // Get storage info
    const storageResponse = await axios.get(`${baseUrl}/webapi/entry.cgi`, {
      params: {
        api: "SYNO.Storage.CGI.Storage",
        version: 1,
        method: "load_info",
        _sid: sid,
      },
      ...httpsConfig,
    });

    const volumes = storageResponse.data.data.volumes.map((vol: any) => ({
      volume: vol.volume_path,
      size: vol.size_total_byte,
      used: vol.size_used_byte,
      available: vol.size_free_byte,
      percentUsed: ((vol.size_used_byte / vol.size_total_byte) * 100).toFixed(
        2
      ),
    }));

    return NextResponse.json(volumes);
  } catch (error) {
    console.error("Synology API error:", error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: "Failed to fetch Synology storage" },
      { status: 500 }
    );
  }
}
