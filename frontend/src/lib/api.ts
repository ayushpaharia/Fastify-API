const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", ...init?.headers },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// Authenticated API call (client-side, pass Clerk token)
export async function authApi<T>(
  path: string,
  token: string | null,
  init?: RequestInit
): Promise<T> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { ...headers, ...init?.headers },
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  authLevel: string;
  status: string;
  avatarUrl: string | null;
  lastActivity: string;
}

export interface Endpoint {
  id: number;
  method: string;
  path: string;
  description: string | null;
  category: string | null;
  latencyMs: number;
  reqPerMin: number;
  uptimePct: number;
  status: string;
}

export interface LogEntry {
  id: number;
  timestamp: string;
  method: string;
  endpoint: string;
  statusCode: number;
  statusText: string;
  latencyMs: number;
  requestId: string | null;
  payload: Record<string, unknown> | null;
}

export interface Metric {
  id: number;
  name: string;
  value: string;
  change: string | null;
  changeDirection: string;
  category: string;
}

export interface Paginated<T> {
  data: T[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface CriticalEvent {
  type: "error" | "warning" | "info";
  title: string;
  message: string;
  timestamp: string;
  timeAgo: string;
}

export interface SparklineData {
  requests: number[];
  latency: number[];
  errors: number[];
  raw: { requests: number[]; latency: number[]; errors: number[] };
}

export interface HealthStatus {
  status: string;
  uptime: number;
  timestamp: string;
  version: string;
  cluster: string;
  database: { status: string; latencyMs: number };
  services: Record<string, string>;
  stats: { endpoints: number; users: number; recentRequests: number; recentErrorRate: string };
}
