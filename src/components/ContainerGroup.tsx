"use client";

import { Container } from "@/types";
import { motion } from "framer-motion";
import { ExternalLink, Power, Circle } from "lucide-react";

interface ContainerGroupProps {
  title: string;
  containers: Container[];
  icon: string;
}

export default function ContainerGroup({
  title,
  containers,
  icon,
}: ContainerGroupProps) {
  const getStatusColor = (state: string) => {
    switch (state.toLowerCase()) {
      case "running":
        return "text-green-500";
      case "paused":
        return "text-yellow-500";
      case "exited":
        return "text-red-500";
      default:
        return "text-gray-500";
    }
  };

  const getTraefikUrl = (labels: Record<string, string>) => {
    const host = labels["traefik.http.routers.https.rule"];
    if (host) {
      const match = host.match(/Host\(`([^`]+)`\)/);
      if (match) return `https://${match[1]}`;
    }
    return null;
  };

  return (
    <div className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-700 bg-gray-800/60">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="text-2xl">{icon}</span>
          {title}
          <span className="ml-auto text-sm text-gray-400">
            {containers.length}{" "}
            {containers.length === 1 ? "container" : "containers"}
          </span>
        </h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
        {containers.map((container, idx) => {
          const url = getTraefikUrl(container.labels);
          return (
            <motion.div
              key={container.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-gray-900/50 rounded-lg border border-gray-700 p-4 hover:border-blue-500/50 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-medium truncate">
                    {container.name}
                  </h3>
                  <p className="text-xs text-gray-400 truncate">
                    {container.image}
                  </p>
                </div>
                <Circle
                  className={`w-3 h-3 fill-current ${getStatusColor(
                    container.state
                  )} flex-shrink-0`}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-400">Status</span>
                  <span className="text-gray-300">{container.status}</span>
                </div>

                {container.ports.length > 0 && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400">Ports</span>
                    <span className="text-gray-300">
                      {container.ports
                        .filter((p) => p.publicPort)
                        .map((p) => p.publicPort)
                        .join(", ") || "Internal"}
                    </span>
                  </div>
                )}

                {url && (
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 mt-3 py-2 px-3 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded text-xs font-medium transition-colors"
                  >
                    <ExternalLink className="w-3 h-3" />
                    Open
                  </a>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
