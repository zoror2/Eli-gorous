import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const stats = [
  { value: 9, suffix: "", label: "AI Tools Orchestrated" },
  { value: 2, suffix: "", label: "Connected Databases" },
  { value: 15, suffix: "-min", label: "Anomaly Check Cycles" },
  { value: 24, suffix: "/7", label: "Real-Time Operations" },
];

const AnimatedCounter = ({ target, suffix }: { target: number; suffix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let frame: number;
    const duration = 1200;
    const start = performance.now();
    const animate = (now: number) => {
      const progress = Math.min((now - start) / duration, 1);
      setCount(Math.floor(progress * target));
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [inView, target]);

  return (
    <span ref={ref} className="text-3xl sm:text-4xl font-black text-primary">
      {count}{suffix}
    </span>
  );
};

const ReadinessStrip = () => (
  <section className="py-16 border-y border-border/50">
    <div className="max-w-7xl mx-auto px-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="text-center"
          >
            <AnimatedCounter target={s.value} suffix={s.suffix} />
            <p className="text-xs text-muted-foreground mt-2 font-mono uppercase tracking-wider">{s.label}</p>
          </motion.div>
        ))}
      </div>
    </div>
  </section>
);

export default ReadinessStrip;
