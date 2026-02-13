export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  ports: Port[];
  labels: Record<string, string>;
  cpu?: string;
  memory?: string;
  stats?: string;
}

export interface Port {
  ip?: string;
  privatePort: number;
  publicPort?: number;
  type: string;
}

export interface UnifiDevice {
  name: string;
  mac: string;
  ip: string;
  model: string;
  state: number;
  uptime: number;
}

export interface SynologyStorage {
  volume: string;
  size: number;
  used: number;
  available: number;
  percentUsed: number;
}

export interface GrafanaDashboard {
  uid: string;
  title: string;
  url: string;
}

export interface ServerStats {
  name: string;
  role: string;
  ip: string;
  cpu: number;
  memoryPercent: number;
  memoryUsedGB: number;
  memoryTotalGB: number;
  diskPercent: number;
  uptimeSeconds: number;
  load1: number;
}

export interface GPUStats {
  name: string;
  gpu_util: number;
  mem_util: number;
  temp: number;
  power_watts: number;
}
