import { api, type LogEntry, type Metric, type Paginated, type CriticalEvent, type SparklineData } from "@/lib/api";
import LogsClient from "@/components/LogsClient";

export default async function LogsPage() {
  let logs: LogEntry[] = [];
  let logMetrics: Metric[] = [];
  let events: CriticalEvent[] = [];
  let sparkline: SparklineData | null = null;
  let total = 0;

  try {
    const [logRes, metricsRes, eventsRes, sparkRes] = await Promise.all([
      api<Paginated<LogEntry>>("/api/logs"),
      api<Metric[]>("/api/metrics?category=logs"),
      api<CriticalEvent[]>("/api/events"),
      api<SparklineData>("/api/metrics/sparkline"),
    ]);
    logs = logRes.data;
    total = logRes.pagination.total;
    logMetrics = metricsRes;
    events = eventsRes;
    sparkline = sparkRes;
  } catch {
    // empty
  }

  return (
    <LogsClient
      initialLogs={logs}
      initialTotal={total}
      initialEvents={events}
      initialMetrics={logMetrics}
      initialSparkline={sparkline}
    />
  );
}
