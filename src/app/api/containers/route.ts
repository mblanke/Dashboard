import { NextResponse } from "next/server";
import Docker from "dockerode";

const docker = new Docker({ socketPath: "/var/run/docker.sock" });

export async function GET() {
  try {
    const containers = await docker.listContainers({ all: true });

    const enriched = await Promise.all(
      containers.map(async (c: any) => {
        let statsText = "";
        let cpu = "0%";
        let memory = "0 MB";

        if (c.State === "running") {
          try {
            const container = docker.getContainer(c.Id);
            const stats = await container.stats({ stream: false });

            const cpuDelta =
              stats.cpu_stats?.cpu_usage?.total_usage -
              (stats.precpu_stats?.cpu_usage?.total_usage || 0);
            const systemDelta =
              stats.cpu_stats?.system_cpu_usage -
              (stats.precpu_stats?.system_cpu_usage || 0);
            const online = stats.cpu_stats?.online_cpus || 1;
            const cpuPercent = systemDelta > 0 ? (cpuDelta / systemDelta) * 100 * online : 0;

            const memUsage = stats.memory_stats?.usage || 0;
            const memLimit = stats.memory_stats?.limit || 0;
            const memMB = (memUsage / 1024 / 1024).toFixed(1);
            const memLimitMB = (memLimit / 1024 / 1024).toFixed(0);

            cpu = `${cpuPercent.toFixed(1)}%`;
            memory = `${memMB} MB / ${memLimitMB} MB`;
            statsText = `${cpu}, ${memory}`;
          } catch (err) {
            statsText = "n/a";
          }
        }

        return {
          id: c.Id.slice(0, 12),
          name: c.Names?.[0]?.replace(/^\//, "") || "unknown",
          image: c.Image,
          state: c.State,
          status: c.Status,
          ports: c.Ports || [],
          cpu,
          memory,
          stats: statsText,
        };
      })
    );

    return NextResponse.json(enriched);
  } catch (error) {
    console.error("Containers API error:", error);
    return NextResponse.json({ error: "Failed to fetch containers" }, { status: 500 });
  }
}