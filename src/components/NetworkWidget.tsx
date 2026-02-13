"use client";

import { useEffect, useState } from "react";
import { Wifi, Router, Monitor, Signal, WifiOff } from "lucide-react";

interface UnifiDevice {
  name: string;
  mac: string;
  ip: string;
  model: string;
  type: string;
  state: number;
  uptime: number;
  clients: number;
  satisfaction: number | null;
  version: string;
}

function formatUptime(seconds: number): string {
  if (!seconds) return "—";
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((seconds % 3600) / 60);
  return `${h}h ${m}m`;
}

function deviceIcon(type: string) {
  switch (type) {
    case "uap": return <Wifi className="w-3.5 h-3.5" />;
    case "usw": return <Monitor className="w-3.5 h-3.5" />;
    case "ugw":
    case "udm": return <Router className="w-3.5 h-3.5" />;
    default: return <Signal className="w-3.5 h-3.5" />;
  }
}

export default function NetworkWidget() {
  const [devices, setDevices] = useState<UnifiDevice[]>([]);
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
        if (Array.isArray(data)) {
          setDevices(data);
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

  const totalClients = devices.reduce((sum, d) => sum + d.clients, 0);
  const onlineDevices = devices.filter((d) => d.state === 1).length;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-500" />
          UniFi Network
        </h3>
        {!loading && !error && devices.length > 0 && (
          <div className="flex items-center gap-3 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Signal className="w-3 h-3 text-green-400" />
              {totalClients} clients
            </span>
            <span>{onlineDevices}/{devices.length} online</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error || devices.length === 0 ? (
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">No network data available</p>
        </div>
      ) : (
        <div className="space-y-2">
          {devices
            .sort((a, b) => b.clients - a.clients)
            .map((dev) => (
            <div key={dev.mac} className="bg-gray-900/50 rounded-lg p-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span className={dev.state === 1 ? "text-green-400" : "text-red-400"}>
                    {deviceIcon(dev.type)}
                  </span>
                  <div>
                    <span className="text-sm font-medium text-gray-200">{dev.name}</span>
                    <span className="text-xs text-gray-500 ml-2">{dev.model}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  {dev.clients > 0 && (
                    <span className="text-blue-400">{dev.clients} clients</span>
                  )}
                  <span>{formatUptime(dev.uptime)}</span>
                </div>
              </div>
              {dev.ip && (
                <div className="text-xs text-gray-500 mt-1 ml-6">{dev.ip}</div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
