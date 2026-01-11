"use client";

import { useEffect, useState } from "react";
import { HardDrive } from "lucide-react";

export default function SynologyWidget() {
  const [volumes, setVolumes] = useState<any[]>([]);
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
        const data = await response.json();
        setVolumes(data);
        setError(false);
      } else {
        setError(true);
      }
      setLoading(false);
    } catch (err) {
      setError(true);
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    const tb = bytes / 1024 ** 4;
    return tb.toFixed(2) + " TB";
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-purple-500" />
          Synology Storage
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <HardDrive className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Configure Synology credentials in .env
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {volumes.map((vol, idx) => (
            <div key={idx} className="bg-gray-900/50 rounded-lg p-3">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-300">{vol.volume}</span>
                <span className="text-xs text-gray-400">
                  {vol.percentUsed}%
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    parseFloat(vol.percentUsed) > 90
                      ? "bg-red-500"
                      : parseFloat(vol.percentUsed) > 75
                      ? "bg-yellow-500"
                      : "bg-green-500"
                  }`}
                  style={{ width: `${vol.percentUsed}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-gray-400">
                <span>{formatBytes(vol.used)} used</span>
                <span>{formatBytes(vol.available)} free</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
