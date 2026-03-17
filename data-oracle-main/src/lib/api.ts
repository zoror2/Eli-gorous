const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

export interface PlotlyFigure {
  data: Record<string, unknown>[];
  layout?: Record<string, unknown>;
  frames?: Record<string, unknown>[];
  config?: Record<string, unknown>;
}

export type ChartPayload = PlotlyFigure | Record<string, unknown>[];

// --- Types ---
export interface ChatRequest {
  session_id: string;
  message: string;
  mode?: "chat" | "preview_sql" | "run_sql";
  sql_override?: string;
  database?: "clinical" | "operations";
}

export interface ChatResponse {
  response: string;
  sql: string | null;
  chart: ChartPayload | null;
  flowchart: string | null;
  type: "text" | "mixed" | "chart" | "sql_preview";
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sql?: string | null;
  chart?: ChartPayload | null;
  flowchart?: string | null;
  timestamp: string;
}

export interface DashboardData {
  activeERPatients: number;
  criticalAlerts: number;
  openCases: number;
  dischargeRate: number;
  admissionsFlow: { hour: string; admissions: number; discharges: number }[];
  recentCritical: { id: string; patient: string; condition: string; severity: string; time: string }[];
}

export interface AlertItem {
  id: string;
  title: string;
  message: string;
  severity: "critical" | "warning" | "info";
  timestamp: string;
  source: string;
}

export interface PinChartRequest {
  chart_data: ChartPayload;
  title: string;
  session_id: string;
}

export interface PinnedChartItem {
  id: number;
  session_id: string;
  title: string;
  chart_data: ChartPayload | null;
  created_at: string;
}

export interface ShareChartResponse {
  status: string;
  chart_id: number;
  share_token: string;
}

export interface SharedChartItem {
  chart_id: number;
  title: string;
  chart_data: ChartPayload | null;
  pinned_at: string;
  shared_at: string;
  share_token: string;
}

export interface HistoryItem {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  message: string;
  sql_query: string | null;
  chart_data: ChartPayload | null;
  flowchart_data: string | null;
  response_type: string;
  is_favorite: boolean;
  created_at: string;
}

// --- API calls ---
async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export const api = {
  sendChat: (data: ChatRequest) =>
    apiFetch<ChatResponse>("/chat", { method: "POST", body: JSON.stringify(data) }),

  getHistory: (sessionId: string) =>
    apiFetch<HistoryItem[]>(`/history/${sessionId}`),

  getAllHistory: (limit = 100) =>
    apiFetch<HistoryItem[]>(`/history?limit=${limit}`),

  toggleFavorite: (sessionId: string, messageId: string) =>
    apiFetch<{ status: string; message_id: string }>(`/history/${sessionId}/favorite?message_id=${messageId}`, {
      method: "POST",
    }),

  toggleFavoriteGlobal: (messageId: string) =>
    apiFetch<{ status: string; message_id: string }>(`/history/favorite/${messageId}`, {
      method: "POST",
    }),

  getDashboard: () => apiFetch<DashboardData>("/dashboard/overview"),

  getPinnedCharts: () => apiFetch<PinnedChartItem[]>("/dashboard"),

  pinChart: (data: PinChartRequest) =>
    apiFetch<{ status: string; chart_id: number }>("/dashboard/pin", {
      method: "POST",
      body: JSON.stringify(data),
    }),

  unpinChart: (chartId: number) =>
    apiFetch<{ status: string; chart_id: number }>(`/dashboard/${chartId}`, {
      method: "DELETE",
    }),

  sharePinnedChart: (chartId: number) =>
    apiFetch<ShareChartResponse>(`/dashboard/${chartId}/share`, {
      method: "POST",
    }),

  getSharedChart: (shareToken: string) =>
    apiFetch<SharedChartItem>(`/dashboard/share/${encodeURIComponent(shareToken)}`),

  getAlerts: () => apiFetch<AlertItem[]>("/alerts"),
};
