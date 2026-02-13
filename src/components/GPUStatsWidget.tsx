"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Zap, Thermometer, Cpu } from "lucide-react";
import { GPUStats } from "@/types";

function getTempColor(temp: number): string {
  if (temp < 60) return "text-green-400";
  if (temp < 80) return "text-yellow-400";
  return "text-red-400";
}

function getTempBarColor(temp: number): string {
  if (temp < 60) return "from-green-500 to-green-400";
  if (temp < 80) return "from-yellow-500 to-yellow-400";
  return "from-red-500 to-red-400";
}

function UtilBar({
  label,
  value,
  icon,
  colorOverride,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  colorOverride?: string;
}) {
  const color =
    colorOverride ||
    (value < 50
      ? "from-green-500 to-green-400"
      : value < 80
      ? "from-yellow-500 to-yellow-400"
      : "from-red-500 to-red-400");

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="text-gray-300 font-mono">{value}%</span>
      </div>
      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(value, 100)}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

export default function GPUStatsWidget() {
  const [gpus, setGpus] = useState<GPUStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGPU = async () => {
    try {
      const res = await fetch("/api/gpu");
      const data = await res.json();
      if (Array.isArray(data)) setGpus(data);
    } catch (err) {
      console.error("Failed to fetch GPU stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGPU();
    const interval = setInterval(fetchGPU, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Cpu className="w-5 h-5 text-purple-400" />
          <h2 className="text-lg font-semibold text-white">GPU Stats</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
        </div>
      </div>
    );
  }

  if (gpus.length === 0) return null;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/60">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-purple-400" />
          GPU Stats
          <span className="ml-auto text-sm text-gray-400">
            {gpus.length} GPUs
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6">
        {gpus.map((gpu, idx) => (
          <motion.div
            key={gpu.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 hover:border-purple-500/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">{gpu.name}</h3>
              <span className="text-xs text-gray-500">NVIDIA Jetson</span>
            </div>

            <div className="space-y-3">
              <UtilBar
                label="GPU Utilization"
                value={gpu.gpu_util}
                icon={<Cpu className="w-3 h-3" />}
              />
              <UtilBar
                label="Memory Utilization"
                value={gpu.mem_util}
                icon={<Cpu className="w-3 h-3" />}
              />
              <UtilBar
                label="Temperature"
                value={Math.min((gpu.temp / 100) * 100, 100)}
                icon={<Thermometer className="w-3 h-3" />}
                colorOverride={getTempBarColor(gpu.temp)}
              />

              <div className="flex items-center justify-between pt-1 border-t border-gray-700/50">
                <div className="flex items-center gap-2 text-xs">
                  <Thermometer className="w-3 h-3 text-gray-400" />
                  <span className={`font-mono ${getTempColor(gpu.temp)}`}>
                    {gpu.temp}°C
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Zap className="w-3 h-3 text-yellow-400" />
                  <span className="text-gray-300 font-mono">
                    {gpu.power_watts}W
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
