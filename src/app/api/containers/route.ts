import { NextResponse } from "next/server";
import axios from "axios";
import http from "http";

// Support both Unix socket and TCP
const DOCKER_SOCKET = process.env.DOCKER_SOCKET || "/var/run/docker.sock";
const DOCKER_HOST = process.env.DOCKER_HOST;

function getAxiosConfig(path: string, params?: Record<string, any>) {
  if (DOCKER_HOST) {
    // TCP mode: DOCKER_HOST is set (e.g., http://localhost:2375)
    return { url: `${DOCKER_HOST}${path}`, params };
  }
  // Unix socket mode (default)
  return {
    url: `http://localhost${path}`,
    params,
    socketPath: DOCKER_SOCKET,
    httpAgent: new http.Agent({ socketPath: DOCKER_SOCKET } as any),
  };
}

export async function GET() {
  try {
    const config = getAxiosConfig("/containers/json", { all: true });
    const response = await axios.get(config.url, {
      params: config.params,
      socketPath: (config as any).socketPath,
      httpAgent: (config as any).httpAgent,
    });

    // Enhanced container data with stats
    const containers = await Promise.all(
      response.data.map(async (container: any) => {
        let stats = { cpu: "0%", memory: "0 MB" };

        if (container.State === "running") {
          try {
            const statsConfig = getAxiosConfig(
              `/containers/${container.Id}/stats`,
              { stream: false }
            );
            const statsResponse = await axios.get(statsConfig.url, {
              params: statsConfig.params,
              socketPath: (statsConfig as any).socketPath,
              httpAgent: (statsConfig as any).httpAgent,
            });
            const data = statsResponse.data;

            const cpuDelta =
              data.cpu_stats.cpu_usage.total_usage -
              (data.precpu_stats?.cpu_usage?.total_usage || 0);
            const systemDelta =
              data.cpu_stats.system_cpu_usage -
              (data.precpu_stats?.system_cpu_usage || 0);
            const cpuPercent =
              systemDelta > 0
                ? (cpuDelta / systemDelta) *
                  100 *
                  (data.cpu_stats.online_cpus || 1)
                : 0;

            const memoryUsage = data.memory_stats?.usage || 0;
            const memoryLimit = data.memory_stats?.limit || 0;
            const memoryMB = (memoryUsage / 1024 / 1024).toFixed(1);
            const memoryLimitMB = (memoryLimit / 1024 / 1024).toFixed(0);

            stats = {
              cpu: cpuPercent.toFixed(1) + "%",
              memory: `${memoryMB} MB / ${memoryLimitMB} MB`,
            };
          } catch (err) {
            console.warn(
              `Failed to fetch stats for ${container.Names[0]}:`,
              err instanceof Error ? err.message : err
            );
          }
        }

        return {
          id: container.Id.slice(0, 12),
          name: container.Names[0]?.replace(/^\//, "") || "unknown",
          image: container.Image,
          imageId: container.ImageID,
          status: container.Status,
          state: container.State,
          created: container.Created,
          ports: (container.Ports || []).map((port: any) => {
            if (port.PublicPort) {
              return `${port.PublicPort}:${port.PrivatePort}/${port.Type}`;
            }
            return `${port.PrivatePort}/${port.Type}`;
          }),
          labels: container.Labels || {},
          mounts: (container.Mounts || []).map((mount: any) => ({
            source: mount.Source,
            destination: mount.Destination,
            mode: mount.Mode,
          })),
          stats,
        };
      })
    );

    return NextResponse.json({
      total: containers.length,
      running: containers.filter((c) => c.state === "running").length,
      containers: containers.sort((a: any, b: any) =>
        a.name.localeCompare(b.name)
      ),
    });
  } catch (error) {
    console.error("Docker API error:", error instanceof Error ? error.message : error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to fetch containers";

    return NextResponse.json(
      { error: errorMessage, total: 0, running: 0, containers: [] },
      { status: 500 }
    );
  }
}
