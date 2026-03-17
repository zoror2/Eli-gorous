import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { ZoomIn, ZoomOut, RotateCcw, GitBranch } from "lucide-react";
import mermaid from "mermaid";

mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  themeVariables: {
    primaryColor: "#0e7490",
    primaryTextColor: "#e2e8f0",
    primaryBorderColor: "#06b6d4",
    lineColor: "#475569",
    secondaryColor: "#1e1b4b",
    tertiaryColor: "#0f172a",
    fontFamily: "monospace",
  },
});

export function MermaidRenderer({ chart }: { chart: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [svg, setSvg] = useState<string>("");

  useEffect(() => {
    const render = async () => {
      try {
        const id = `mermaid-${Date.now()}`;
        const { svg: rendered } = await mermaid.render(id, chart);
        setSvg(rendered);
      } catch (e) {
        console.error("Mermaid render error:", e);
      }
    };
    render();
  }, [chart]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel overflow-hidden glow-purple"
    >
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <GitBranch className="w-3.5 h-3.5 text-secondary" />
          <span className="text-xs font-mono text-secondary uppercase tracking-wider">Flowchart</span>
        </div>
        <span className="text-[10px] text-muted-foreground">Scroll to zoom · Drag to pan</span>
      </div>
      <div className="h-72 relative">
        <TransformWrapper initialScale={0.8} minScale={0.3} maxScale={3}>
          {({ zoomIn, zoomOut, resetTransform }) => (
            <>
              <div className="absolute top-2 right-2 z-10 flex gap-1">
                {[
                  { icon: ZoomIn, action: () => zoomIn() },
                  { icon: ZoomOut, action: () => zoomOut() },
                  { icon: RotateCcw, action: () => resetTransform() },
                ].map(({ icon: Icon, action }, i) => (
                  <button
                    key={i}
                    onClick={action}
                    className="w-7 h-7 rounded-md bg-muted/80 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
              <TransformComponent wrapperStyle={{ width: "100%", height: "100%" }}>
                <div
                  ref={containerRef}
                  className="p-6 flex items-center justify-center min-h-full"
                  dangerouslySetInnerHTML={{ __html: svg }}
                />
              </TransformComponent>
            </>
          )}
        </TransformWrapper>
      </div>
    </motion.div>
  );
}
