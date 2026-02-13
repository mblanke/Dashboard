import { NextResponse } from "next/server";

const PROMETHEUS_URL = "http://prometheus:9090";

const INSTANCE_MAP: Record<string, { name: string; role: string }> = {
  "192.168.1.21": { name: "Atlas", role: "Control Node" },
  "192.168.1.50": { name: "Wile", role: "GPU Node - Heavy" },
  "192.168.1.51": { name: "RoadRunner", role: "GPU Node - Fast" },
};

async function queryPrometheus(query: string): Promise<any[]> {
  try {
    const url = `${PROMETHEUS_URL}/api/v1/query?query=${encodeURIComponent(query)}`;
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const json = await res.json();
    if (json.status === "success" && json.data?.result) {
      return json.data.result;
    }
    return [];
  } catch {
    return [];
  }
}

function extractByInstance(results: any[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const r of results) {
    const instance: string = r.metric?.instance || "";
    const ip = instance.replace(/:\d+$/, "");
    const val = parseFloat(r.value?.[1] || "0");
    if (!isNaN(val)) {
      map[ip] = val;
    }
  }
  return map;
}

export async function GET() {
  try {
    const [cpuRes, memPercentRes, memTotalRes, memAvailRes, diskRes, uptimeBootRes, uptimeNowRes, loadRes] =
      await Promise.all([
        queryPrometheus(
          '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)'
        ),
        queryPrometheus(
          "(1 - node_memory_MemAvailable_bytes / node_memory_MemTotal_bytes) * 100"
        ),
        queryPrometheus("node_memory_MemTotal_bytes"),
        queryPrometheus("node_memory_MemAvailable_bytes"),
        queryPrometheus(
          '100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100)'
        ),
        queryPrometheus("node_boot_time_seconds"),
        queryPrometheus("node_time_seconds"),
        queryPrometheus("node_load1"),
      ]);

    const cpuMap = extractByInstance(cpuRes);
    const memPercentMap = extractByInstance(memPercentRes);
    const memTotalMap = extractByInstance(memTotalRes);
    const memAvailMap = extractByInstance(memAvailRes);
    const diskMap = extractByInstance(diskRes);
    const bootMap = extractByInstance(uptimeBootRes);
    const nowMap = extractByInstance(uptimeNowRes);
    const loadMap = extractByInstance(loadRes);

    const servers = Object.entries(INSTANCE_MAP).map(([ip, info]) => {
      const memTotalBytes = memTotalMap[ip] || 0;
      const memAvailBytes = memAvailMap[ip] || 0;
      const memUsedBytes = memTotalBytes - memAvailBytes;
      const uptimeSeconds = (nowMap[ip] || 0) - (bootMap[ip] || 0);

      return {
        name: info.name,
        role: info.role,
        ip,
        cpu: parseFloat((cpuMap[ip] || 0).toFixed(1)),
        memoryPercent: parseFloat((memPercentMap[ip] || 0).toFixed(1)),
        memoryUsedGB: parseFloat((memUsedBytes / 1073741824).toFixed(1)),
        memoryTotalGB: parseFloat((memTotalBytes / 1073741824).toFixed(1)),
        diskPercent: parseFloat((diskMap[ip] || 0).toFixed(1)),
        uptimeSeconds: Math.floor(uptimeSeconds > 0 ? uptimeSeconds : 0),
        load1: parseFloat((loadMap[ip] || 0).toFixed(2)),
      };
    });

    return NextResponse.json(servers);
  } catch (error) {
    console.error("Servers API error:", error);
    return NextResponse.json([]);
  }
}
