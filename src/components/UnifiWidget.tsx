"use client";

import { useEffect, useState } from "react";
import { Wifi, WifiOff, Globe, Radio, Network, ArrowDown, ArrowUp } from "lucide-react";

interface Health {
  wan?: { status: string; wanIp: string; isp: string; txRate: number; rxRate: number; gateways: number; clients: number };
  www?: { status: string; latency: number; uptime: number; downSpeed: number; upSpeed: number };
  wlan?: { status: string; adopted: number; clients: number; aps: number; txRate: number; rxRate: number };
  lan?: { status: string; adopted: number; clients: number; switches: number; txRate: number; rxRate: number };
  vpn?: { status: string };
}

function formatRate(bytesPerSec: number): string {
  if (bytesPerSec >= 1_000_000) return (bytesPerSec / 1_000_000).toFixed(1) + " MB/s";
  if (bytesPerSec >= 1_000) return (bytesPerSec / 1_000).toFixed(0) + " KB/s";
  return bytesPerSec + " B/s";
}

function StatusDot({ status }: { status: string }) {
  const color = status === "ok" ? "bg-green-400" : status === "unknown" ? "bg-gray-500" : "bg-yellow-400";
  return <span className={`inline-block w-1.5 h-1.5 rounded-full ${color}`} />;
}

export default function UnifiWidget() {
  const [devices, setDevices] = useState<any[]>([]);
  const [health, setHealth] = useState<Health | null>(null);
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
        const data = await response.json();
        const devArr = Array.isArray(data) ? data : Array.isArray(data?.devices) ? data.devices : [];
        setDevices(devArr);
        setHealth(data?.health || null);
        setError(false);
      } else {
        setError(true);
      }
      setLoading(false);
    } catch {
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
        {health?.wan && (
          <span className="text-xs text-gray-500">{health.wan.isp}</span>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <WifiOff className="w-12 h-12 text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-400">Configure UniFi credentials in .env</p>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Top stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Devices Online</p>
              <p className="text-2xl font-bold text-green-500">{onlineDevices}/{devices.length}</p>
            </div>
            <div className="bg-gray-900/50 rounded-lg p-3">
              <p className="text-xs text-gray-400">Connected Clients</p>
              <p className="text-2xl font-bold text-blue-500">{totalClients}</p>
            </div>
          </div>

          {/* Subsystem health */}
          {health && (
            <div className="pt-2 border-t border-gray-700/50 space-y-1.5">
              {health.wan && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Globe className="w-3 h-3" />
                    <StatusDot status={health.wan.status} />
                    WAN
                  </span>
                  <span className="flex items-center gap-2 text-gray-500">
                    <span className="flex items-center gap-0.5"><ArrowDown className="w-2.5 h-2.5 text-green-500" />{formatRate(health.wan.rxRate)}</span>
                    <span className="flex items-center gap-0.5"><ArrowUp className="w-2.5 h-2.5 text-blue-500" />{formatRate(health.wan.txRate)}</span>
                  </span>
                </div>
              )}
              {health.wlan && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Radio className="w-3 h-3" />
                    <StatusDot status={health.wlan.status} />
                    WLAN
                  </span>
                  <span className="text-gray-500">{health.wlan.clients} clients · {health.wlan.aps} APs</span>
                </div>
              )}
              {health.lan && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Network className="w-3 h-3" />
                    <StatusDot status={health.lan.status} />
                    LAN
                  </span>
                  <span className="text-gray-500">{health.lan.clients} clients · {health.lan.switches} switches</span>
                </div>
              )}
              {health.www && (
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-1.5 text-gray-300">
                    <Globe className="w-3 h-3" />
                    <StatusDot status={health.www.status} />
                    Internet
                  </span>
                  <span className="text-gray-500">{health.www.latency}ms latency</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
