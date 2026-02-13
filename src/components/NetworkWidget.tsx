"use client";

import { useEffect, useState } from "react";
import { Wifi, Globe, Router, Monitor, Signal, WifiOff, ArrowDown, ArrowUp, Activity } from "lucide-react";

interface UnifiDevice {
  name: string;
  mac: string;
  ip: string;
  model: string;
  type: string;
  state: number;
  uptime: number;
  clients: number;
}

interface HealthSub {
  status: string;
  wanIp?: string;
  isp?: string;
  txRate?: number;
  rxRate?: number;
  latency?: number;
  uptime?: number;
  clients?: number;
  aps?: number;
  switches?: number;
  adopted?: number;
}

interface UnifiData {
  devices: UnifiDevice[];
  health: Record<string, HealthSub>;
  totalClients: number;
}

function formatRate(bps: number): string {
  if (bps >= 1024 * 1024) return (bps / (1024 ** 2)).toFixed(1) + " MB/s";
  if (bps >= 1024) return (bps / 1024).toFixed(1) + " KB/s";
  return bps.toFixed(0) + " B/s";
}

function formatUptime(sec: number): string {
  if (!sec) return "—";
  const d = Math.floor(sec / 86400);
  const h = Math.floor((sec % 86400) / 3600);
  if (d > 0) return `${d}d ${h}h`;
  const m = Math.floor((sec % 3600) / 60);
  return `${h}h ${m}m`;
}

function StatusDot({ status }: { status: string }) {
  const color = status === "ok" ? "bg-green-400" : status === "unknown" ? "bg-gray-500" : "bg-yellow-400";
  return <span className={`inline-block w-2 h-2 rounded-full ${color}`} />;
}

export default function NetworkWidget() {
  const [data, setData] = useState<UnifiData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchData = async () => {
    try {
      const response = await fetch("/api/unifi");
      if (response.ok) {
        const json = await response.json();
        if (json.devices) { setData(json); setError(false); }
        else setError(true);
      } else setError(true);
      setLoading(false);
    } catch { setError(true); setLoading(false); }
  };

  if (loading) return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Wifi className="w-5 h-5 text-blue-500" /> UniFi Network
      </h3>
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      </div>
    </div>
  );

  if (error || !data) return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white flex items-center gap-2 mb-4">
        <Wifi className="w-5 h-5 text-blue-500" /> UniFi Network
      </h3>
      <div className="text-center py-8">
        <WifiOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
        <p className="text-sm text-gray-400">No network data</p>
      </div>
    </div>
  );

  const { wan, www, wlan, lan } = data.health;
  const onlineDevices = data.devices.filter(d => d.state === 1).length;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Wifi className="w-5 h-5 text-blue-500" />
          UniFi Network
        </h3>
        <span className="text-xs text-gray-400">{onlineDevices}/{data.devices.length} devices</span>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{data.totalClients}</div>
          <div className="text-xs text-gray-400">Clients</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{wlan?.clients || 0}</div>
          <div className="text-xs text-gray-400">Wireless</div>
        </div>
        <div className="bg-gray-900/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-white">{lan?.clients || 0}</div>
          <div className="text-xs text-gray-400">Wired</div>
        </div>
      </div>

      {/* WAN status */}
      {wan && (
        <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-200 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-blue-400" />
              WAN
              <StatusDot status={wan.status} />
            </span>
            <span className="text-xs text-gray-500">{wan.wanIp}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-400">{wan.isp}</span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-green-400">
                <ArrowDown className="w-3 h-3" />{formatRate(wan.rxRate || 0)}
              </span>
              <span className="flex items-center gap-1 text-blue-400">
                <ArrowUp className="w-3 h-3" />{formatRate(wan.txRate || 0)}
              </span>
            </div>
          </div>
          {www && (
            <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Activity className="w-3 h-3" />{www.latency}ms latency
              </span>
              <span>Uptime: {formatUptime(www.uptime || 0)}</span>
            </div>
          )}
        </div>
      )}

      {/* WLAN + LAN row */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {wlan && (
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Wifi className="w-3.5 h-3.5 text-green-400" />
              <span className="text-sm font-medium text-gray-200">WiFi</span>
              <StatusDot status={wlan.status} />
            </div>
            <div className="text-xs text-gray-400">
              {wlan.aps} APs &middot; {wlan.clients} clients
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-400 flex items-center gap-0.5"><ArrowDown className="w-2.5 h-2.5" />{formatRate(wlan.rxRate || 0)}</span>
              <span className="text-blue-400 flex items-center gap-0.5"><ArrowUp className="w-2.5 h-2.5" />{formatRate(wlan.txRate || 0)}</span>
            </div>
          </div>
        )}
        {lan && (
          <div className="bg-gray-900/50 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Monitor className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-sm font-medium text-gray-200">LAN</span>
              <StatusDot status={lan.status} />
            </div>
            <div className="text-xs text-gray-400">
              {lan.switches} switches &middot; {lan.clients} clients
            </div>
            <div className="flex items-center gap-2 mt-1 text-xs">
              <span className="text-green-400 flex items-center gap-0.5"><ArrowDown className="w-2.5 h-2.5" />{formatRate(lan.rxRate || 0)}</span>
              <span className="text-blue-400 flex items-center gap-0.5"><ArrowUp className="w-2.5 h-2.5" />{formatRate(lan.txRate || 0)}</span>
            </div>
          </div>
        )}
      </div>

      {/* Device list - compact */}
      <div className="border-t border-gray-700/50 pt-3">
        <p className="text-xs text-gray-500 mb-2">Devices</p>
        <div className="grid grid-cols-2 gap-1">
          {data.devices
            .sort((a, b) => b.clients - a.clients)
            .map((dev) => (
              <div key={dev.mac} className="flex items-center justify-between text-xs py-1 px-2 rounded bg-gray-900/30">
                <div className="flex items-center gap-1.5 truncate">
                  <span className={`w-1.5 h-1.5 rounded-full ${dev.state === 1 ? "bg-green-400" : "bg-red-400"}`} />
                  <span className="text-gray-300 truncate">{dev.name}</span>
                </div>
                {dev.clients > 0 && <span className="text-gray-500 ml-1">{dev.clients}</span>}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
