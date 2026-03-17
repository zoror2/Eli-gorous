import { motion } from "framer-motion";
import { useInView } from "framer-motion";
import { useRef } from "react";
import { Database, FileSpreadsheet, AlertTriangle } from "lucide-react";

const problems = [
  {
    icon: Database,
    title: "Fragmented Data",
    desc: "Patient records, bed management, billing, and clinical data live in siloed systems with no unified view.",
  },
  {
    icon: FileSpreadsheet,
    title: "Manual Reporting",
    desc: "Teams rely on SQL queries and static reports — often waiting hours or days for critical operational answers.",
  },
  {
    icon: AlertTriangle,
    title: "Critical Delays",
    desc: "Slow data access means delayed decisions — impacting patient outcomes, staffing, and hospital efficiency.",
    alert: true,
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.15 },
  }),
};

const WhyWeBuiltThis = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section id="why" className="py-24 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-mono text-primary uppercase tracking-widest">The Problem</span>
          <h2 className="text-3xl sm:text-4xl font-bold mt-3">Why We Built This</h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {problems.map((p, i) => (
            <motion.div
              key={p.title}
              custom={i}
              initial="hidden"
              animate={inView ? "visible" : "hidden"}
              variants={cardVariants}
              className={`glass-panel rounded-xl p-6 group hover:border-primary/30 transition-colors ${
                p.alert ? "border-alert-orange/30" : ""
              }`}
            >
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-4 ${
                p.alert ? "bg-alert-orange/10" : "bg-primary/10"
              }`}>
                <p.icon size={20} className={p.alert ? "text-alert-orange" : "text-primary"} />
              </div>
              <h3 className="text-lg font-semibold mb-2">{p.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-panel rounded-xl p-8 text-center max-w-3xl mx-auto glow-cyan"
        >
          <span className="text-xs font-mono text-accent uppercase tracking-widest">Our Mission</span>
          <p className="text-lg sm:text-xl font-semibold mt-3 leading-relaxed text-foreground">
            Democratize hospital intelligence so any staff member can act on real data — instantly.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default WhyWeBuiltThis;
