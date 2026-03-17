import { motion } from "framer-motion";
import { AlertTriangle, Info, AlertCircle } from "lucide-react";
import { useAlerts } from "@/hooks/use-api";
import { mockAlerts } from "@/lib/mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { AlertItem } from "@/lib/api";

const severityIcon = {
  critical: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export default function AlertsPage() {
  const { data: alerts } = useAlerts();
  const normalized: AlertItem[] = (alerts || []).map((item) => ({
    id: String(item.id),
    title: item.title || "System Alert",
    message: item.message || "No details available.",
    severity: item.severity || "info",
    timestamp: item.timestamp || new Date().toISOString(),
    source: item.source || "Alert Service",
  }));
  const a = normalized.length > 0 ? normalized : mockAlerts;

  return (
    <ScrollArea className="h-full scrollbar-thin">
      <div className="p-6 space-y-6 max-w-5xl mx-auto">
        <div>
          <h1 className="text-2xl font-bold text-foreground">System Alerts</h1>
          <p className="text-sm text-muted-foreground mt-1">Monitor all hospital system notifications</p>
        </div>
        <div className="space-y-3">
          {a.map((alert, i) => {
            const Icon = severityIcon[alert.severity] || Info;
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
                className={`glass-panel p-5 flex gap-4 ${
                  alert.severity === "critical" ? "glow-amber border-destructive/20" : ""
                }`}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                  alert.severity === "critical" ? "bg-destructive/20" : alert.severity === "warning" ? "bg-warning/20" : "bg-muted"
                }`}>
                  <Icon className={`w-5 h-5 ${
                    alert.severity === "critical" ? "text-destructive" : alert.severity === "warning" ? "text-warning" : "text-muted-foreground"
                  }`} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(alert.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{alert.message}</p>
                  <span className="text-[10px] text-muted-foreground/70 font-mono">{alert.source}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </ScrollArea>
  );
}
