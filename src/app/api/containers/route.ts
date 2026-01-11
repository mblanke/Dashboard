import { NextResponse } from "next/server";
import axios from "axios";

const DOCKER_HOST = process.env.DOCKER_HOST || "http://localhost:2375";

export async function GET() {
  try {
    // Fetch all containers (both running and stopped for complete view)
    const response = await axios.get(`${DOCKER_HOST}/containers/json`, {
      params: { all: true }, // Show all containers
    });

    // Enhanced container data with stats
    const containers = await Promise.all(
      response.data.map(async (container: any) => {
        let stats = { cpu: "0%", memory: "0 MB" };

        // Try to fetch real stats if container is running
        if (container.State === "running") {
          try {
            const statsResponse = await axios.get(
              `${DOCKER_HOST}/containers/${container.Id}/stats`,
              { params: { stream: false } }
            );
            const data = statsResponse.data;

            // Calculate CPU percentage
            const cpuDelta =
              data.cpu_stats.cpu_usage.total_usage -
              (data.precpu_stats?.cpu_usage?.total_usage || 0);
            const systemDelta =
              data.cpu_stats.system_cpu_usage -
              (data.precpu_stats?.system_cpu_usage || 0);
            const cpuPercent =
              (cpuDelta / systemDelta) *
              100 *
              (data.cpu_stats.online_cpus || 1);

            // Calculate memory
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
              err
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
    console.error("Docker API error:", error);
    const errorMessage =
      error instanceof axios.AxiosError
        ? error.message
        : "Failed to fetch containers";

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
