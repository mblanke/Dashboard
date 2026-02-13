import { NextResponse } from "next/server";

const PROM = "http://prometheus:9090";

const INSTANCE_MAP: Record<string, string> = {
  "192.168.1.21:9100": "Atlas",
  "192.168.1.50:9100": "Wile",
  "192.168.1.51:9100": "RoadRunner",
};

async function promQuery(query: string) {
  const resp = await fetch(
    `${PROM}/api/v1/query?query=${encodeURIComponent(query)}`,
    { cache: "no-store" }
  );
  const data = await resp.json();
  return data.data?.result || [];
}

function mapInstance(instance: string): string {
  return INSTANCE_MAP[instance] || instance;
}

export async function GET() {
  try {
    const deviceFilter = 'device=~"eth0|eno1|enp.*|end0|bond0"';

    const [rxRate, txRate, rxTotal, txTotal] = await Promise.all([
      promQuery(`sum by (instance) (rate(node_network_receive_bytes_total{${deviceFilter}}[5m]))`),
      promQuery(`sum by (instance) (rate(node_network_transmit_bytes_total{${deviceFilter}}[5m]))`),
      promQuery(`sum by (instance) (node_network_receive_bytes_total{${deviceFilter}})`),
      promQuery(`sum by (instance) (node_network_transmit_bytes_total{${deviceFilter}})`),
    ]);

    const servers: Record<string, any> = {};

    for (const r of rxRate) {
      const name = mapInstance(r.metric.instance);
      if (!servers[name]) servers[name] = { name };
      servers[name].rxBytesPerSec = parseFloat(r.value[1]);
    }
    for (const r of txRate) {
      const name = mapInstance(r.metric.instance);
      if (!servers[name]) servers[name] = { name };
      servers[name].txBytesPerSec = parseFloat(r.value[1]);
    }
    for (const r of rxTotal) {
      const name = mapInstance(r.metric.instance);
      if (!servers[name]) servers[name] = { name };
      servers[name].rxBytesTotal = parseFloat(r.value[1]);
    }
    for (const r of txTotal) {
      const name = mapInstance(r.metric.instance);
      if (!servers[name]) servers[name] = { name };
      servers[name].txBytesTotal = parseFloat(r.value[1]);
    }

    const result = Object.values(servers).sort((a: any, b: any) => a.name.localeCompare(b.name));

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Network API error:", error?.message || error);
    return NextResponse.json({ error: "Failed to fetch network stats" }, { status: 500 });
  }
}
