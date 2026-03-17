import { motion } from "framer-motion";
import { Settings, Server, Database, Shield } from "lucide-react";

export default function SettingsPage() {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

  return (
    <div className="p-6 space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Platform configuration and preferences</p>
      </div>

      {[
        { icon: Server, label: "API Endpoint", value: apiUrl, desc: "Backend server connection" },
        { icon: Database, label: "Database", value: "PostgreSQL (Medical DB)", desc: "Primary data source" },
        { icon: Shield, label: "Auth Status", value: "HIPAA Compliant", desc: "Security compliance level" },
        { icon: Settings, label: "Version", value: "DataGod v2.0.4", desc: "Platform version" },
      ].map((item, i) => (
        <motion.div
          key={item.label}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.08 }}
          className="glass-panel p-5 flex items-center gap-4"
        >
          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
            <item.icon className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-medium text-foreground">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.desc}</div>
          </div>
          <code className="text-xs font-mono text-primary bg-primary/10 px-3 py-1.5 rounded-md">{item.value}</code>
        </motion.div>
      ))}
    </div>
  );
}
