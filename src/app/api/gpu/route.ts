import { NextResponse } from "next/server";

const PROMETHEUS_URL = "http://prometheus:9090";

const INSTANCE_MAP: Record<string, string> = {
  "192.168.1.50": "Wile",
  "192.168.1.51": "RoadRunner",
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

async function queryWithFallback(
  primaryMetric: string,
  ...fallbacks: string[]
): Promise<Record<string, number>> {
  const primary = await queryPrometheus(primaryMetric);
  if (primary.length > 0) return extractByInstance(primary);

  for (const fb of fallbacks) {
    const res = await queryPrometheus(fb);
    if (res.length > 0) return extractByInstance(res);
  }
  return {};
}

export async function GET() {
  try {
    const [gpuUtilMap, memUtilMap, tempMap, powerMap] = await Promise.all([
      queryWithFallback(
        "DCGM_FI_DEV_GPU_UTIL",
        "nvidia_gpu_utilization_gpu",
        "gpu_utilization_percentage"
      ),
      queryWithFallback(
        "DCGM_FI_DEV_MEM_COPY_UTIL",
        "nvidia_gpu_memory_used_bytes / nvidia_gpu_memory_total_bytes * 100"
      ),
      queryWithFallback(
        "DCGM_FI_DEV_GPU_TEMP",
        "nvidia_gpu_temperature_gpu"
      ),
      queryWithFallback(
        "DCGM_FI_DEV_POWER_USAGE",
        "nvidia_gpu_power_draw_watts"
      ),
    ]);

    const gpus = Object.entries(INSTANCE_MAP).map(([ip, name]) => ({
      name,
      gpu_util: parseFloat((gpuUtilMap[ip] || 0).toFixed(1)),
      mem_util: parseFloat((memUtilMap[ip] || 0).toFixed(1)),
      temp: parseFloat((tempMap[ip] || 0).toFixed(0)),
      power_watts: parseFloat((powerMap[ip] || 0).toFixed(1)),
    }));

    return NextResponse.json(gpus);
  } catch (error) {
    console.error("GPU API error:", error);
    return NextResponse.json([]);
  }
}
