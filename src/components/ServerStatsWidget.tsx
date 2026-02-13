"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Cpu, HardDrive, Clock, Server } from "lucide-react";
import { ServerStats } from "@/types";

function StatBar({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
}) {
  const color =
    value < 50
      ? "from-green-500 to-green-400"
      : value < 80
      ? "from-yellow-500 to-yellow-400"
      : "from-red-500 to-red-400";

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-400 flex items-center gap-1">
          {icon}
          {label}
        </span>
        <span className="text-gray-300 font-mono">{value.toFixed(1)}%</span>
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

function formatUptime(seconds: number): string {
  if (seconds <= 0) return "N/A";
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  return `${days}d ${hours}h`;
}

export default function ServerStatsWidget() {
  const [servers, setServers] = useState<ServerStats[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/servers");
      const data = await res.json();
      if (Array.isArray(data)) setServers(data);
    } catch (err) {
      console.error("Failed to fetch server stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Server className="w-5 h-5 text-blue-400" />
          <h2 className="text-lg font-semibold text-white">Server Stats</h2>
        </div>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/60">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          Server Stats
          <span className="ml-auto text-sm text-gray-400">
            {servers.length} nodes
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6">
        {servers.map((server, idx) => (
          <motion.div
            key={server.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 hover:border-blue-500/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-white font-medium">{server.name}</h3>
                <p className="text-xs text-gray-400">{server.role}</p>
              </div>
              <span className="text-xs text-gray-500 font-mono">
                {server.ip}
              </span>
            </div>

            <div className="space-y-3">
              <StatBar
                label="CPU"
                value={server.cpu}
                icon={<Cpu className="w-3 h-3" />}
              />
              <StatBar
                label={`RAM (${server.memoryUsedGB}/${server.memoryTotalGB} GB)`}
                value={server.memoryPercent}
                icon={<Server className="w-3 h-3" />}
              />
              <StatBar
                label="Disk"
                value={server.diskPercent}
                icon={<HardDrive className="w-3 h-3" />}
              />

              <div className="flex items-center justify-between text-xs pt-1 border-t border-gray-700/50">
                <span className="text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Uptime
                </span>
                <span className="text-gray-300 font-mono">
                  {formatUptime(server.uptimeSeconds)}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Load (1m)</span>
                <span className="text-gray-300 font-mono">
                  {server.load1}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
