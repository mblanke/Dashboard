"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff } from "lucide-react";

export default function UnifiWidget() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchDevices = async () => {
    try {
      const response = await fetch("/api/unifi");
      if (response.ok) {
        const data = await response.json();
        setDevices(data);
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

  const onlineDevices = devices.filter((d) => d.state === 1).length;
  const totalClients = devices.reduce((sum, d) => sum + (d.clients || 0), 0);

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-500" />
          UniFi Network
        </h3>
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">
            Configure UniFi credentials in .env
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Devices Online</p>
              <p className="text-2xl font-bold text-green-500">
                {onlineDevices}/{devices.length}
              </p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Connected Clients</p>
              <p className="text-2xl font-bold text-blue-500">{totalClients}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
