import { motion } from "framer-motion";
import { Activity, AlertTriangle, FolderOpen, Gauge, Clock, Share2 } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useDashboard, useAlerts } from "@/hooks/use-api";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, type DashboardData, type AlertItem, type PinnedChartItem, type PlotlyFigure } from "@/lib/api";
import Plot from "react-plotly.js";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

const statCards = [
  { key: "activeERPatients" as const, label: "Active ER Patients", icon: Activity, color: "primary" },
  { key: "criticalAlerts" as const, label: "Critical Alerts", icon: AlertTriangle, color: "warning" },
  { key: "openCases" as const, label: "Open Cases", icon: FolderOpen, color: "secondary" },
  { key: "dischargeRate" as const, label: "Discharge Rate (%)", icon: Gauge, color: "destructive" },
];

export default function DashboardPage() {
  const { data: dashboard } = useDashboard();
  const { data: alerts } = useAlerts();
  const queryClient = useQueryClient();
  const [sharingChartId, setSharingChartId] = useState<number | null>(null);
  const { data: pinnedCharts = [] } = useQuery({
    queryKey: ["dashboard-pins"],
    queryFn: api.getPinnedCharts,
  });

  const unpinMutation = useMutation({
    mutationFn: (id: number) => api.unpinChart(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["dashboard-pins"] });
    },
  });

  const isDashboardData = (value: unknown): value is DashboardData => {
    if (!value || typeof value !== "object" || Array.isArray(value)) return false;
    const v = value as DashboardData;
    return Array.isArray(v.admissionsFlow) && Array.isArray(v.recentCritical);
  };

  const emptyDashboard: DashboardData = {
    activeERPatients: 0,
    criticalAlerts: 0,
    openCases: 0,
    dischargeRate: 0,
    admissionsFlow: [],
    recentCritical: [],
  };

  const d: DashboardData = isDashboardData(dashboard) ? dashboard : emptyDashboard;

  const normalizeAlerts = (value: unknown): AlertItem[] => {
    if (!Array.isArray(value)) return [];

    return value.map((item, index) => {
      const row = (item || {}) as Record<string, unknown>;
      const rawSeverity = String(row.severity || "").toLowerCase();

      let severity: AlertItem["severity"] = "info";
      if (rawSeverity === "critical" || rawSeverity === "warning" || rawSeverity === "info") {
        severity = rawSeverity;
      } else if (row.is_active === true || row.active === true) {
        severity = "critical";
      }

      return {
        id: String(row.id ?? `alert-${index}`),
        title: String(row.title ?? row.name ?? "System Alert"),
        message: String(row.message ?? "No details available."),
        severity,
        timestamp: String(row.timestamp ?? row.last_checked ?? new Date().toISOString()),
        source: String(row.source ?? "Operations"),
      };
    });
  };

  const a: AlertItem[] = normalizeAlerts(alerts);

  const glowClass: Record<string, string> = {
    primary: "glow-cyan",
    secondary: "glow-purple",
    warning: "glow-amber",
    destructive: "",
  };

  const iconColor: Record<string, string> = {
    primary: "text-primary",
    secondary: "text-secondary",
    warning: "text-warning",
    destructive: "text-destructive",
  };

  const shareChart = async (chartId: number) => {
    if (sharingChartId !== null) return;
    setSharingChartId(chartId);
    try {
      const result = await api.sharePinnedChart(chartId);
      const shareLink = `${window.location.origin}/share/${result.share_token}`;

      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareLink);
      }

      toast.success("Share link copied", {
        description: shareLink,
      });
    } catch (err) {
      toast.error("Failed to create share link", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    } finally {
      setSharingChartId(null);
    }
  };

  return (
    <ScrollArea className="h-full scrollbar-thin">
      <div className="p-6 space-y-6 max-w-7xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Command Center</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time hospital operations overview</p>
        </div>

        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ key, label, icon: Icon, color }, i) => (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className={`glass-panel p-5 ${glowClass[color]}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs text-muted-foreground uppercase tracking-wider">{label}</span>
                <Icon className={`w-4 h-4 ${iconColor[color]}`} />
              </div>
              <div className="text-3xl font-bold text-foreground font-mono">{d[key]}</div>
            </motion.div>
          ))}
        </div>

        {/* Admissions Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-panel p-5"
        >
          <h2 className="text-sm font-semibold text-foreground mb-4">24h Admissions Flow</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={d.admissionsFlow} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="admGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(187, 72%, 43%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(187, 72%, 43%)" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="disGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(263, 70%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(217, 20%, 16%)" />
                <XAxis dataKey="hour" tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={{ stroke: "hsl(217, 20%, 16%)" }} />
                <YAxis tick={{ fill: "hsl(215, 20%, 55%)", fontSize: 10 }} axisLine={{ stroke: "hsl(217, 20%, 16%)" }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(222, 50%, 8%)", border: "1px solid hsl(0,0%,100%,0.1)", borderRadius: "8px", color: "hsl(210,40%,92%)", fontSize: "12px" }} />
                <Area type="monotone" dataKey="admissions" stroke="hsl(187, 72%, 43%)" fill="url(#admGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="discharges" stroke="hsl(263, 70%, 50%)" fill="url(#disGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Pinned Visualizations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-foreground">Pinned Visualizations</h2>
            <span className="text-xs text-muted-foreground">{pinnedCharts.length} saved</span>
          </div>

          {pinnedCharts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pinned charts yet. Pin any chart from chat to display it here.
            </p>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {pinnedCharts.map((item: PinnedChartItem) => {
                const figure = item.chart_data as PlotlyFigure | null;
                const hasData = !!figure && Array.isArray(figure.data) && figure.data.length > 0;

                return (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-black/20 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-medium text-foreground truncate pr-3">{item.title || "Pinned Chart"}</h3>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => shareChart(item.id)}
                          disabled={sharingChartId === item.id}
                          className="text-xs px-2 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                        >
                          <Share2 className="w-3 h-3" />
                          {sharingChartId === item.id ? "Sharing..." : "Share"}
                        </button>
                        <button
                          onClick={() => unpinMutation.mutate(item.id)}
                          className="text-xs px-2 py-1 rounded-md border border-white/15 bg-white/5 hover:bg-white/10"
                        >
                          Unpin
                        </button>
                      </div>
                    </div>
                    {hasData ? (
                      <div className="h-64">
                        <Plot
                          data={figure.data as never}
                          layout={{
                            paper_bgcolor: "rgba(0,0,0,0)",
                            plot_bgcolor: "rgba(0,0,0,0)",
                            font: { color: "#B5C5D6", size: 12 },
                            margin: { l: 30, r: 20, t: 44, b: 40 },
                            autosize: true,
                            ...figure.layout,
                          }}
                          config={{ displaylogo: false, responsive: true, ...figure.config }}
                          style={{ width: "100%", height: "100%" }}
                          useResizeHandler
                        />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">Chart data unavailable.</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Live Alerts */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="glass-panel p-5"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-warning" />
              Live System Alerts
            </h2>
            <div className="space-y-3">
              {a.slice(0, 4).map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 rounded-lg border ${
                    alert.severity === "critical"
                      ? "bg-destructive/10 border-destructive/20"
                      : alert.severity === "warning"
                      ? "bg-warning/10 border-warning/20"
                      : "bg-muted/50 border-white/[0.06]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-semibold text-foreground">{alert.title}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase ${
                      alert.severity === "critical" ? "bg-destructive/20 text-destructive" : alert.severity === "warning" ? "bg-warning/20 text-warning" : "bg-muted text-muted-foreground"
                    }`}>
                      {alert.severity}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{alert.message}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Recent Critical */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55 }}
            className="glass-panel p-5"
          >
            <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-destructive" />
              Recent Critical Conditions
            </h2>
            <div className="space-y-2">
              {d.recentCritical.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-white/[0.04]">
                  <div>
                    <span className="text-sm font-medium text-foreground">{item.patient}</span>
                    <p className="text-xs text-muted-foreground">{item.condition}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono uppercase ${
                      item.severity === "critical" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"
                    }`}>{item.severity}</span>
                    <p className="text-[10px] text-muted-foreground mt-1">{item.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </ScrollArea>
  );
}
