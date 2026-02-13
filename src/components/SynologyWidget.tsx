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
}

interface SynologyData {
  volumes: Volume[];
  disks: Disk[];
  utilization: { cpu: number | null; memory: number | null } | null;
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 ** 4) return (bytes / (1024 ** 4)).toFixed(1) + " TB";
  if (bytes >= 1024 ** 3) return (bytes / (1024 ** 3)).toFixed(1) + " GB";
  if (bytes >= 1024 ** 2) return (bytes / (1024 ** 2)).toFixed(0) + " MB";
  return (bytes / 1024).toFixed(0) + " KB";
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
        if (json.volumes) {
          setData(json);
          setError(false);
        } else {
          setError(true);
        }
      } else {
        setError(true);
      }
      setLoading(false);
    } catch {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-500" />
          Synology NAS
        </h3>
        {data?.utilization && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            {data.utilization.cpu !== null && (
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3" /> {data.utilization.cpu}%
              </span>
            )}
            {data.utilization.memory !== null && (
              <span className="flex items-center gap-1">
                <MemoryStick className="w-3 h-3" /> {data.utilization.memory}%
              </span>
            )}
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : error || !data ? (
        <div className="text-center py-8">
          <HardDrive className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Configure Synology credentials in .env</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data.volumes.map((vol) => {
            const pct = parseFloat(vol.percentUsed);
            return (
              <div key={vol.id} className="bg-gray-900/50 rounded-lg p-3">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-300">{vol.id}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    vol.status === "normal" ? "bg-green-900/50 text-green-400" :
                    vol.status === "attention" ? "bg-yellow-900/50 text-yellow-400" :
                    "bg-red-900/50 text-red-400"
                  }`}>{vol.status}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden mb-2">
                  <div
                    className={`h-full rounded-full transition-all ${
                      pct > 90 ? "bg-red-500" : pct > 75 ? "bg-yellow-500" : "bg-purple-500"
                    }`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400">
                  <span>{formatBytes(vol.used)} / {formatBytes(vol.size)}</span>
                  <span>{vol.percentUsed}%</span>
                </div>
              </div>
            );
          })}

          {data.disks.length > 0 && (
            <div className="pt-2 border-t border-gray-700/50">
              <p className="text-xs text-gray-500 mb-2">{data.disks.length} drives</p>
              <div className="grid grid-cols-2 gap-1">
                {data.disks.slice(0, 8).map((disk, i) => (
                  <div key={i} className="flex items-center gap-1 text-xs">
                    <Disc className={`w-3 h-3 ${
                      disk.status === "normal" ? "text-green-400" : "text-yellow-400"
                    }`} />
                    <span className="text-gray-400 truncate" title={disk.model}>
                      {disk.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
