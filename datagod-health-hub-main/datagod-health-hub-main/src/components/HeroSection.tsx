import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Shield, Server, HeartPulse } from "lucide-react";
import { PRODUCT_URL } from "@/lib/config";
import ColorBends from "@/components/ColorBends";

const headlines = ["Your Hospital.", "One Conversation.", "Away from decisions."];

const chatMessages = [
  { role: "user", text: "How many patients were admitted to ICU this week?" },
  { role: "ai", text: "47 patients were admitted to ICU this week — 12% above the rolling average. Ward 3B is at 94% capacity." },
  { role: "user", text: "Flag any readmission anomalies in the last 30 days." },
  { role: "ai", text: "3 anomalies detected: Cardiology readmission rate spiked 18% in Week 3. Escalation alert generated for clinical ops." },
];

const Typewriter = () => {
  const [lineIndex, setLineIndex] = useState(0);
  const [charIndex, setCharIndex] = useState(0);
  const [displayedLines, setDisplayedLines] = useState<string[]>([]);

  useEffect(() => {
    if (lineIndex >= headlines.length) return;
    const currentLine = headlines[lineIndex];
    if (charIndex < currentLine.length) {
      const t = setTimeout(() => setCharIndex((c) => c + 1), 50);
      return () => clearTimeout(t);
    } else {
      setDisplayedLines((prev) => [...prev, currentLine]);
      const t = setTimeout(() => {
        setLineIndex((l) => l + 1);
        setCharIndex(0);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [lineIndex, charIndex]);

  return (
    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.1] tracking-tight">
      {displayedLines.map((line, i) => (
        <span key={i} className={i === 2 ? "text-gradient-cyan" : "text-foreground"}>
          {line}
          <br />
        </span>
      ))}
      {lineIndex < headlines.length && (
        <span className={lineIndex === 2 ? "text-gradient-cyan" : "text-foreground"}>
          {headlines[lineIndex].slice(0, charIndex)}
          <span className="animate-pulse text-primary">|</span>
        </span>
      )}
    </h1>
  );
};

const ChatReplay = () => {
  const [visibleCount, setVisibleCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleCount < chatMessages.length) {
      const t = setTimeout(() => setVisibleCount((c) => c + 1), 2200);
      return () => clearTimeout(t);
    }
  }, [visibleCount]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [visibleCount]);

  return (
    <div className="glass-panel rounded-xl p-4 max-w-md w-full h-72 flex flex-col">
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border/50">
        <div className="w-2.5 h-2.5 rounded-full bg-accent" />
        <span className="text-xs text-muted-foreground font-mono">DataGod Agent — Live Session</span>
      </div>
      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
        {chatMessages.slice(0, visibleCount).map((msg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className={`text-xs leading-relaxed rounded-lg px-3 py-2 ${
              msg.role === "user"
                ? "bg-secondary text-secondary-foreground ml-6"
                : "bg-muted/50 text-foreground mr-4 border border-primary/20"
            }`}
          >
            <span className={`font-mono font-semibold text-[10px] block mb-1 ${msg.role === "user" ? "text-muted-foreground" : "text-primary"}`}>
              {msg.role === "user" ? "YOU" : "AGENT"}
            </span>
            {msg.text}
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const trustBadges = [
  { icon: Shield, label: "Local & Private" },
  { icon: Server, label: "Healthcare Grade" },
  { icon: HeartPulse, label: "Built for Clinical Ops" },
];

const HeroSection = () => (
  <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
    <ColorBends
      className="z-0"
      colors={["#080C14", "#0F1923", "#00D4FF", "#00FF94"]}
      speed={0.22}
      autoRotate={6}
      scale={1.1}
      frequency={1.05}
      warpStrength={1.2}
      parallax={0.55}
      mouseInfluence={0.85}
      noise={0.04}
      transparent
    />
    <div className="absolute inset-0 z-[1] bg-[radial-gradient(ellipse_at_center,rgba(0,212,255,0.12)_0%,rgba(8,12,20,0.78)_62%,rgba(8,12,20,0.96)_100%)] pointer-events-none" />
    <div className="relative z-10 max-w-7xl mx-auto px-6 w-full py-20 grid lg:grid-cols-2 gap-12 items-center">
      <div className="space-y-8">
        <Typewriter />
        <p className="text-muted-foreground text-base sm:text-lg max-w-lg leading-relaxed">
          DataGod Health lets any hospital staff member query, analyze, and act on operational data — using plain English. No SQL. No dashboards. Just answers.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => (window.location.href = PRODUCT_URL)}
            className="h-11 px-6 inline-flex items-center rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors glow-cyan"
          >
            Launch App
          </button>
          <a
            href="#why"
            className="h-11 px-6 inline-flex items-center rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors"
          >
            See Why It Matters
          </a>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          {trustBadges.map((b) => (
            <div
              key={b.label}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-full px-3 py-1.5"
            >
              <b.icon size={14} className="text-primary" />
              {b.label}
            </div>
          ))}
        </div>
      </div>
      <div className="flex justify-center lg:justify-end">
        <ChatReplay />
      </div>
    </div>
  </section>
);

export default HeroSection;
