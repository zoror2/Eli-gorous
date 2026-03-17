import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import {
  MessageSquare,
  Database,
  Download,
  Mic,
  History,
  Share2,
  LayoutDashboard,
  Eye,
} from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Natural Language to SQL",
    desc: "Ask in plain English and review the generated SQL before execution for full confidence.",
  },
  {
    icon: Database,
    title: "Multi-Database Support",
    desc: "Query clinical and operations databases in one workflow with smart source selection.",
  },
  {
    icon: Download,
    title: "Export Functionality",
    desc: "Download visualizations as PNG/PDF and export result tables as CSV for reports.",
  },
  {
    icon: Mic,
    title: "Voice Input",
    desc: "Use speech-to-text for hands-free querying during rounds, triage, and operations review.",
  },
  {
    icon: History,
    title: "Query History & Favorites",
    desc: "Save, favorite, and rerun previous queries to accelerate repeat analysis and handoffs.",
  },
  {
    icon: Share2,
    title: "Collaborative Sharing",
    desc: "Generate secure share links for pinned visualizations so teams can review the same insight.",
  },
  {
    icon: LayoutDashboard,
    title: "Custom Dashboard Builder",
    desc: "Pin multiple charts and monitor critical KPIs in one command center view.",
  },
  {
    icon: Eye,
    title: "Transparent & Auditable",
    desc: "Every AI action stays traceable with explainable outputs for compliance-ready decision support.",
  },
];

const FeatureCard = ({ feature, index }: { feature: typeof features[0]; index: number }) => {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="glass-panel rounded-xl p-6 relative overflow-hidden group hover:border-primary/30 transition-colors cursor-default"
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{
          background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, hsl(var(--primary) / 0.06), transparent 60%)`,
        }}
      />
      <div className="relative z-10">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
          <feature.icon size={20} className="text-primary" />
        </div>
        <h3 className="text-base font-semibold mb-2">{feature.title}</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">{feature.desc}</p>
      </div>
    </motion.div>
  );
};

const Features = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="features" className="py-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Capabilities</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">Why DataGod Health Is Best</h2>
        </motion.div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f, i) => (
            <FeatureCard key={f.title} feature={f} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
