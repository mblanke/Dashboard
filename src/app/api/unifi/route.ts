import { NextResponse } from "next/server";
import https from "https";

const UNIFI_HOST = process.env.UNIFI_HOST || "192.168.1.1";
const UNIFI_PORT = process.env.UNIFI_PORT || "443";
const UNIFI_USERNAME = process.env.UNIFI_USERNAME;
const UNIFI_PASSWORD = process.env.UNIFI_PASSWORD;

export const dynamic = "force-dynamic";

/** Low-level HTTPS request that ignores self-signed certs and returns cookies */
function httpsRequest(
  url: string,
  opts: {
    method?: string;
    headers?: Record<string, string>;
    body?: string;
  } = {}
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
    return NextResponse.json(
      { error: "UniFi credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const baseUrl = `https://${UNIFI_HOST}:${UNIFI_PORT}`;

    // Step 1: Login to UniFi OS
    const loginResp = await httpsRequest(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: UNIFI_USERNAME,
        password: UNIFI_PASSWORD,
      }),
    });

    if (loginResp.status !== 200) {
      console.error("UniFi login failed:", loginResp.status, loginResp.body.slice(0, 200));
      return NextResponse.json(
        { error: `UniFi login failed: ${loginResp.status}` },
        { status: 401 }
      );
    }

    // Extract session cookies
    const setCookies = loginResp.headers["set-cookie"] || [];
    const cookieStr = setCookies
      .map((c) => c.split(";")[0])
      .join("; ");

    // Extract CSRF token if present
    const csrfToken = (loginResp.headers["x-csrf-token"] || [])[0] || "";

    // Step 2: Fetch devices
    const reqHeaders: Record<string, string> = { Cookie: cookieStr };
    if (csrfToken) reqHeaders["x-csrf-token"] = csrfToken;

    const devicesResp = await httpsRequest(
      `${baseUrl}/proxy/network/api/s/default/stat/device`,
      { headers: reqHeaders }
    );

    if (devicesResp.status !== 200) {
      console.error("UniFi device fetch failed:", devicesResp.status);
      return NextResponse.json(
        { error: `UniFi device fetch failed: ${devicesResp.status}` },
        { status: 502 }
      );
    }

    const devicesData = JSON.parse(devicesResp.body);
    const rawDevices = devicesData?.data || [];

    const devices = rawDevices.map((device: any) => ({
      name: device.name || device.model || "Unknown",
      mac: device.mac || "",
      ip: device.ip || "",
      model: device.model || "",
      type: device.type || "",
      state: device.state ?? 0,
      uptime: device.uptime || 0,
      clients: device.num_sta || 0,
      satisfaction: device.satisfaction ?? null,
      version: device.version || "",
    }));

    return NextResponse.json(devices);
  } catch (error: any) {
    console.error("UniFi API error:", error?.message || error);
    return NextResponse.json(
      { error: "Failed to fetch UniFi devices" },
      { status: 500 }
    );
  }
}
