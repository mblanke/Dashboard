"use client";

import { BarChart3 } from "lucide-react";

interface GrafanaWidgetProps {
  title: string;
  dashboardId: string;
  panelId: number;
}

export default function GrafanaWidget({
  title,
  dashboardId,
  panelId,
}: GrafanaWidgetProps) {
  const grafanaHost =
    process.env.NEXT_PUBLIC_GRAFANA_HOST || "http://100.104.196.38:3000";
  const iframeUrl = `${grafanaHost}/d-solo/${dashboardId}?orgId=1&panelId=${panelId}&theme=dark`;

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/60">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-orange-500" />
          {title}
        </h3>
      </div>
      <div className="relative h-48">
        <iframe
          src={iframeUrl}
          className="w-full h-full"
          frameBorder="0"
          title={title}
        />
        <div className="absolute top-2 right-2">
          <a
            href={`${grafanaHost}/d/${dashboardId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white transition-colors"
          >
            Open in Grafana →
          </a>
        </div>
      </div>
    </div>
  );
}
