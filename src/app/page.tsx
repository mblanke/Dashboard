"use client";

import { useEffect, useState } from "react";
import { Search, Server, Activity } from "lucide-react";
import ContainerGroup from "@/components/ContainerGroup";
import SearchBar from "@/components/SearchBar";
import GrafanaWidget from "@/components/GrafanaWidget";
import UnifiWidget from "@/components/UnifiWidget";
import SynologyWidget from "@/components/SynologyWidget";
import { Container } from "@/types";

export default function Home() {
  const [containers, setContainers] = useState<Container[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchContainers();
    const interval = setInterval(fetchContainers, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const fetchContainers = async () => {
    try {
      const response = await fetch("/api/containers");
      const data = await response.json();
      setContainers(data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch containers:", error);
      setLoading(false);
    }
  };

  const groupContainers = (containers: Container[]) => {
    return {
      media: containers.filter((c) =>
        [
          "sonarr",
          "radarr",
          "lidarr",
          "whisparr",
          "prowlarr",
          "bazarr",
          "tautulli",
          "overseerr",
          "ombi",
          "jellyfin",
          "plex",
          "audiobookshelf",
          "lazylibrarian",
        ].some((app) => c.name.toLowerCase().includes(app))
      ),
      download: containers.filter((c) =>
        [
          "qbittorrent",
          "transmission",
          "sabnzbd",
          "nzbget",
          "deluge",
          "gluetun",
          "flaresolverr",
        ].some((app) => c.name.toLowerCase().includes(app))
      ),
      infrastructure: containers.filter((c) =>
        [
          "traefik",
          "portainer",
          "heimdall",
          "homepage",
          "nginx",
          "caddy",
          "pihole",
          "adguard",
          "unbound",
          "mosquitto",
        ].some((app) => c.name.toLowerCase().includes(app))
      ),
      monitoring: containers.filter((c) =>
        [
          "grafana",
          "prometheus",
          "cadvisor",
          "node-exporter",
          "dozzle",
          "uptime-kuma",
          "beszel",
          "dockmon",
          "docker-stats-exporter",
          "diun",
          "container-census",
        ].some((app) => c.name.toLowerCase().includes(app))
      ),
      automation: containers.filter((c) =>
        [
          "homeassistant",
          "home-assistant",
          "n8n",
          "nodered",
          "node-red",
          "duplicati",
        ].some((app) => c.name.toLowerCase().includes(app))
      ),
      productivity: containers.filter((c) =>
        [
          "nextcloud",
          "openproject",
          "gitea",
          "gitlab",
          "code-server",
          "vscode",
        ].some((app) => c.name.toLowerCase().includes(app))
      ),
      media_processing: containers.filter((c) =>
        ["tdarr"].some((app) => c.name.toLowerCase().includes(app))
      ),
      ai: containers.filter((c) =>
        ["openwebui", "open-webui", "ollama", "stable-diffusion", "mcp"].some(
          (app) => c.name.toLowerCase().includes(app)
        )
      ),
      photos: containers.filter((c) =>
        ["immich"].some((app) => c.name.toLowerCase().includes(app))
      ),
      databases: containers.filter((c) =>
        ["postgres", "mariadb", "mysql", "mongo", "redis", "db"].some((app) =>
          c.name.toLowerCase().includes(app)
        )
      ),
    };
  };

  const filteredContainers = containers.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.image.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const grouped = groupContainers(
    searchQuery ? filteredContainers : containers
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="border-b border-gray-700 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Server className="w-8 h-8 text-blue-500" />
              <h1 className="text-2xl font-bold text-white">Atlas Dashboard</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <Activity className="w-4 h-4" />
                <span>{containers.length} containers</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <SearchBar value={searchQuery} onChange={setSearchQuery} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Widgets Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <UnifiWidget />
          <SynologyWidget />
          <GrafanaWidget
            title="Server Stats"
            dashboardId="server-overview"
            panelId={1}
          />
        </div>

        {/* Grafana Dashboards */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <GrafanaWidget
            title="Docker Stats"
            dashboardId="docker-monitoring"
            panelId={2}
          />
          <GrafanaWidget
            title="LLM Metrics"
            dashboardId="llm-monitoring"
            panelId={3}
          />
          <GrafanaWidget
            title="System Load"
            dashboardId="system-metrics"
            panelId={4}
          />
        </div>

        {/* Container Groups */}
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {grouped.media.length > 0 && (
              <ContainerGroup
                title="Media Management"
                containers={grouped.media}
                icon="📺"
              />
            )}
            {grouped.download.length > 0 && (
              <ContainerGroup
                title="Download Clients"
                containers={grouped.download}
                icon="⬇️"
              />
            )}
            {grouped.ai.length > 0 && (
              <ContainerGroup
                title="AI Services"
                containers={grouped.ai}
                icon="🤖"
              />
            )}
            {grouped.photos.length > 0 && (
              <ContainerGroup
                title="Photo Management"
                containers={grouped.photos}
                icon="📷"
              />
            )}
            {grouped.media_processing.length > 0 && (
              <ContainerGroup
                title="Media Processing"
                containers={grouped.media_processing}
                icon="🎬"
              />
            )}
            {grouped.automation.length > 0 && (
              <ContainerGroup
                title="Automation"
                containers={grouped.automation}
                icon="⚡"
              />
            )}
            {grouped.productivity.length > 0 && (
              <ContainerGroup
                title="Productivity"
                containers={grouped.productivity}
                icon="💼"
              />
            )}
            {grouped.infrastructure.length > 0 && (
              <ContainerGroup
                title="Infrastructure"
                containers={grouped.infrastructure}
                icon="🔧"
              />
            )}
            {grouped.monitoring.length > 0 && (
              <ContainerGroup
                title="Monitoring"
                containers={grouped.monitoring}
                icon="📊"
              />
            )}
            {grouped.databases.length > 0 && (
              <ContainerGroup
                title="Databases"
                containers={grouped.databases}
                icon="🗄️"
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
