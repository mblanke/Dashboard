"use client";

import { useEffect, useState } from "react";
import { HardDrive, Disc, Cpu, MemoryStick } from "lucide-react";

interface Volume {
  volume: string;
  id: string;
  size: number;
  used: number;
  available: number;
  percentUsed: string;
  status: string;
  fsType: string;
}

interface Disk {
  name: string;
  model: string;
  status: string;
  isSsd: boolean;
  temp: number | null;
}

interface SynologyData {
  volumes: Volume[];
  disks: Disk[];
  utilization: { cpu: number | null; memory: number | null } | null;
}

function formatTB(bytes: number): string {
  return (bytes / (1024 ** 4)).toFixed(2) + " TB";
}

function formatTemp(t: number | null): string {
  return t !== null ? `${t}°C` : "";
}

export default function SynologyWidget() {
  const [data, setData] = useState<SynologyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchStorage();
    const interval = setInterval(fetchStorage, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStorage = async () => {
    try {
      const response = await fetch("/api/synology");
      if (response.ok) {
        const json = await response.json();
        if (json.volumes) { setData(json); setError(false); }
        else setError(true);
      } else setError(true);
      setLoading(false);
    } catch { setError(true); setLoading(false); }
  };

  if (loading) return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <HardDrive className="w-5 h-5 text-purple-500" /> Synology NAS
      </h3>
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <HardDrive className="w-5 h-5 text-purple-500" /> Synology NAS
      </h3>
      <div className="text-center py-8">
        <HardDrive className="w-12 h-12 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">Configure Synology credentials in .env</p>
      </div>
    </div>
  );

  // Aggregate across volumes
  const totalSize = data.volumes.reduce((s, v) => s + v.size, 0);
  const totalUsed = data.volumes.reduce((s, v) => s + v.used, 0);
  const totalAvail = totalSize - totalUsed;
  const overallPct = totalSize > 0 ? (totalUsed / totalSize) * 100 : 0;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-500" />
          Synology NAS
        </h3>
        {data.utilization && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {data.utilization.cpu !== null && (
              <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />{data.utilization.cpu}%</span>
            )}
            {data.utilization.memory !== null && (
              <span className="flex items-center gap-1"><MemoryStick className="w-3 h-3" />{data.utilization.memory}%</span>
            )}
          </div>
        )}
      </div>

      {/* Big total/available stats */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{formatTB(totalSize)}</div>
          <div className="text-xs text-gray-400">Total Space</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className={`text-2xl font-bold ${overallPct > 90 ? "text-red-400" : overallPct > 75 ? "text-yellow-400" : "text-green-400"}`}>
            {formatTB(totalAvail)}
          </div>
          <div className="text-xs text-gray-400">Available</div>
        </div>
      </div>

      {/* Usage bar per volume */}
      {data.volumes.map((vol) => {
        const pct = parseFloat(vol.percentUsed);
        return (
          <div key={vol.id} className="mb-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-gray-300">{vol.id}</span>
              <span className={`text-xs px-1.5 py-0.5 rounded ${
                vol.status === "normal" ? "bg-green-900/50 text-green-400" :
                vol.status === "attention" ? "bg-yellow-900/50 text-yellow-400" :
                "bg-red-900/50 text-red-400"
              }`}>{vol.status}</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5 overflow-hidden mb-1">
              <div
                className={`h-full rounded-full transition-all ${
                  pct > 90 ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-purple-500"
                }`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500">
              <span>{formatTB(vol.used)} used / {formatTB(vol.size)}</span>
              <span>{vol.percentUsed}%</span>
            </div>
          </div>
        );
      })}

      {/* Disk grid */}
      {data.disks.length > 0 && (
        <div className="pt-3 border-t border-gray-700/50">
          <p className="text-xs text-gray-500 mb-2">{data.disks.length} drives</p>
          <div className="grid grid-cols-3 gap-1">
            {data.disks.map((disk, i) => (
              <div key={i} className="flex items-center gap-1 text-xs py-0.5">
                <Disc className={`w-3 h-3 flex-shrink-0 ${
                  disk.status === "normal" ? "text-green-400" : "text-yellow-400"
                }`} />
                <span className="text-gray-400 truncate">{disk.name}</span>
                {disk.temp !== null && (
                  <span className="text-gray-600 ml-auto">{disk.temp}°</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
