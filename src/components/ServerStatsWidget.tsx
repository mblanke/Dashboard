"use client";

import { useEffect, useState } from "react";
import { Cpu, HardDrive, Clock, Server, Thermometer, MemoryStick } from "lucide-react";

interface ServerData {
  name: string;
  role: string;
  ip: string;
  cpu: number;
  cpuTemp: number | null;
  memoryPercent: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskPercent: number;
  uptimeSeconds: number;
  load1: number;
}

function formatUptime(sec: number): string {
  if (!sec) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function GaugeRing({ value, max, color, size = 72 }: { value: number; max: number; color: string; size?: number }) {
  const pct = Math.min((value / max) * 100, 100);
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
      <circle
        cx={size/2} cy={size/2} r={radius} fill="none"
        stroke={color} strokeWidth="6" strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        className="transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

function cpuColor(v: number): string {
  if (v >= 90) return "#ef4444";
  if (v >= 70) return "#f59e0b";
  return "#22c55e";
}

function ramColor(v: number): string {
  if (v >= 90) return "#ef4444";
  if (v >= 70) return "#f59e0b";
  return "#3b82f6";
}

function tempColor(v: number): string {
  if (v >= 90) return "#ef4444";
  if (v >= 75) return "#f59e0b";
  if (v >= 60) return "#eab308";
  return "#22c55e";
}

export default function ServerStatsWidget() {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServers();
    const interval = setInterval(fetchServers, 15000);
    return () => clearInterval(interval);
  }, []);

  const fetchServers = async () => {
    try {
      const res = await fetch("/api/servers");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setServers(data);
      }
      setLoading(false);
    } catch { setLoading(false); }
  };

  if (loading) return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Server className="w-5 h-5 text-blue-500" /> Server Health
      </h3>
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-6">
        <Server className="w-5 h-5 text-blue-500" />
        Server Health
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {servers.map((srv) => (
          <div key={srv.name} className="bg-gray-900/50 rounded-xl p-4">
            {/* Server name */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="text-sm font-bold text-white">{srv.name}</h4>
                <p className="text-xs text-gray-500">{srv.role}</p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatUptime(srv.uptimeSeconds)}
                </div>
                <div>Load: {srv.load1}</div>
              </div>
            </div>

            {/* 3 Gauges */}
            <div className="flex items-center justify-around mb-3">
              {/* CPU Gauge */}
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <GaugeRing value={srv.cpu} max={100} color={cpuColor(srv.cpu)} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{Math.round(srv.cpu)}%</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                  <Cpu className="w-3 h-3" /> CPU
                </span>
              </div>

              {/* RAM Gauge */}
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <GaugeRing value={srv.memoryPercent} max={100} color={ramColor(srv.memoryPercent)} />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">{Math.round(srv.memoryPercent)}%</span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                  <MemoryStick className="w-3 h-3" /> RAM
                </span>
              </div>

              {/* Temp Gauge */}
              <div className="relative flex flex-col items-center">
                <div className="relative">
                  <GaugeRing
                    value={srv.cpuTemp ?? 0}
                    max={110}
                    color={srv.cpuTemp !== null ? tempColor(srv.cpuTemp) : "#4b5563"}
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {srv.cpuTemp !== null ? `${srv.cpuTemp}°` : "—"}
                    </span>
                  </div>
                </div>
                <span className="text-xs text-gray-400 mt-1 flex items-center gap-0.5">
                  <Thermometer className="w-3 h-3" /> Temp
                </span>
              </div>
            </div>

            {/* Disk + Memory detail */}
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span className="flex items-center gap-1"><HardDrive className="w-3 h-3" /> Disk</span>
                  <span>{srv.diskPercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      srv.diskPercent > 90 ? "bg-red-500" : srv.diskPercent > 75 ? "bg-yellow-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(srv.diskPercent, 100)}%` }}
                  />
                </div>
              </div>
              <div className="text-xs text-gray-500 text-center">
                {srv.memoryUsedGB} / {srv.memoryTotalGB} GB RAM
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
