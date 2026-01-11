export interface Container {
  id: string;
  name: string;
  image: string;
  state: string;
  status: string;
  created: number;
  ports: Port[];
  labels: Record<string, string>;
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
