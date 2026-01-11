import { NextResponse } from "next/server";
import axios from "axios";

const SYNOLOGY_HOST = process.env.SYNOLOGY_HOST;
const SYNOLOGY_PORT = process.env.SYNOLOGY_PORT || "5001";
const SYNOLOGY_USERNAME = process.env.SYNOLOGY_USERNAME;
const SYNOLOGY_PASSWORD = process.env.SYNOLOGY_PASSWORD;

export async function GET() {
  if (!SYNOLOGY_HOST || !SYNOLOGY_USERNAME || !SYNOLOGY_PASSWORD) {
    return NextResponse.json(
      { error: "Synology credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const baseUrl = `https://${SYNOLOGY_HOST}:${SYNOLOGY_PORT}`;

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
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
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
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
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
    console.error("Synology API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch Synology storage" },
      { status: 500 }
    );
  }
}
