import { NextResponse } from "next/server";
import axios from "axios";

const UNIFI_HOST = process.env.UNIFI_HOST;
const UNIFI_PORT = process.env.UNIFI_PORT || "8443";
const UNIFI_USERNAME = process.env.UNIFI_USERNAME;
const UNIFI_PASSWORD = process.env.UNIFI_PASSWORD;

export async function GET() {
  if (!UNIFI_HOST || !UNIFI_USERNAME || !UNIFI_PASSWORD) {
    return NextResponse.json(
      { error: "UniFi credentials not configured" },
      { status: 500 }
    );
  }

  try {
    // Login to UniFi Controller
    const loginUrl = `https://${UNIFI_HOST}:${UNIFI_PORT}/api/login`;
    await axios.post(
      loginUrl,
      {
        username: UNIFI_USERNAME,
        password: UNIFI_PASSWORD,
      },
      {
        httpsAgent: new (require("https").Agent)({
          rejectUnauthorized: false,
        }),
      }
    );

    // Get device list
    const devicesUrl = `https://${UNIFI_HOST}:${UNIFI_PORT}/api/s/default/stat/device`;
    const response = await axios.get(devicesUrl, {
      httpsAgent: new (require("https").Agent)({
        rejectUnauthorized: false,
      }),
    });

    const devices = response.data.data.map((device: any) => ({
      name: device.name || device.model,
      mac: device.mac,
      ip: device.ip,
      model: device.model,
      state: device.state,
      uptime: device.uptime,
      clients: device.num_sta || 0,
    }));

    return NextResponse.json(devices);
  } catch (error) {
    console.error("UniFi API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch UniFi devices" },
      { status: 500 }
    );
  }
}
