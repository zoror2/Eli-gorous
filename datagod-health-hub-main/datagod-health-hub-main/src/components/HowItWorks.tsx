import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { MessageCircle, Cpu, Zap } from "lucide-react";

const steps = [
  { icon: MessageCircle, title: "Ask in Plain English", desc: "Type your question like you'd ask a colleague." },
  { icon: Cpu, title: "AI Selects Tools", desc: "The agent picks the right databases, APIs, and reasoning paths." },
  { icon: Zap, title: "Instant Response", desc: "Operational insight delivered in seconds — with full action trail." },
];

const transcript = [
  { label: "USER", color: "text-muted-foreground", text: '"Show me readmission rates for cardiology, last 30 days."' },
  { label: "AGENT", color: "text-primary", text: "→ tool_call: query_database(table='admissions', dept='cardiology', window='30d', metric='readmission_rate')" },
  { label: "RESULT", color: "text-accent", text: "Cardiology readmission rate: 8.3% (↑18% vs. prior period). 3 flagged anomalies. Alert dispatched to clinical ops." },
];

const HowItWorks = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="how" className="py-24" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">Process</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">How It Works</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16 relative">

          {steps.map((s, i) => (
            <motion.div
              key={s.title}
              initial={{ opacity: 0, y: 30 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <s.icon size={28} className="text-primary" />
              </div>
              <span className="text-xs font-mono text-muted-foreground">Step {i + 1}</span>
              <h3 className="text-lg font-semibold mt-1 mb-2">{s.title}</h3>
              <p className="text-sm text-muted-foreground max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-panel rounded-xl p-6 max-w-2xl mx-auto font-mono text-sm space-y-3"
        >
          <div className="text-xs text-muted-foreground mb-3 uppercase tracking-widest">AI Action Transcript</div>
          {transcript.map((t, i) => (
            <div key={i} className="flex gap-3">
              <span className={`${t.color} font-semibold shrink-0 w-14 text-xs pt-0.5`}>{t.label}</span>
              <span className="text-foreground/80 text-xs leading-relaxed">{t.text}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default HowItWorks;
