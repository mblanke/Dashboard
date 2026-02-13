"use client";

import { useState } from "react";
import { BarChart3, ExternalLink, AlertCircle } from "lucide-react";

interface GrafanaWidgetProps {
  title: string;
  dashboardUid: string;
  panelId: number;
  height?: number;
}

export default function GrafanaWidget({
  title,
  dashboardUid,
  panelId,
  height,
}: GrafanaWidgetProps) {
  const [loadError, setLoadError] = useState(false);
  const grafanaHost = process.env.NEXT_PUBLIC_GRAFANA_HOST || "https://grafana.guapo613.beer";
  const iframeUrl = `${grafanaHost}/d-solo/${dashboardUid}?orgId=1&panelId=${panelId}&theme=dark&refresh=30s`;
  const dashUrl = `${grafanaHost}/d/${dashboardUid}`;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-2 border-b border-gray-700 bg-gray-800/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          {title}
        </h3>
        <a
          href={dashUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1"
        >
          <ExternalLink className="w-3 h-3" />
          Open
        </a>
      </div>
      <div className="relative" style={{ height: height ? `${height}px` : '12rem' }}>
        {loadError ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <AlertCircle className="w-8 h-8 mb-2" />
            <p className="text-xs">Panel unavailable</p>
            <a href={dashUrl} target="_blank" rel="noopener noreferrer"
               className="text-xs text-blue-400 hover:text-blue-300 mt-1">
              View in Grafana
            </a>
          </div>
        ) : (
          <iframe
            src={iframeUrl}
            className="w-full h-full border-0"
            title={title}
            loading="lazy"
            onError={() => setLoadError(true)}
          />
        )}
      </div>
    </div>
  );
}
