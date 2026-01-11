import { NextResponse } from "next/server";
import axios from "axios";

const DOCKER_HOST = process.env.DOCKER_HOST || "http://100.104.196.38:2375";

export async function GET() {
  try {
    const response = await axios.get(`${DOCKER_HOST}/containers/json`, {
      params: { all: false }, // Only running containers
    });

    const containers = response.data.map((container: any) => ({
      id: container.Id,
      name: container.Names[0].replace("/", ""),
      image: container.Image,
      state: container.State,
      status: container.Status,
      created: container.Created,
      ports: container.Ports || [],
      labels: container.Labels || {},
    }));

    return NextResponse.json(containers);
  } catch (error) {
    console.error("Docker API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch containers" },
      { status: 500 }
    );
  }
}
