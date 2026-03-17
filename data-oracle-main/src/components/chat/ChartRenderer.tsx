import { motion } from "framer-motion";
import Plot from "react-plotly.js";
import { useState } from "react";
import { BarChart3, Check, Pin } from "lucide-react";
import { api, type ChartPayload, type PlotlyFigure } from "@/lib/api";

interface Props {
  chart: ChartPayload;
  sessionId?: string;
}

function isPlotlyFigure(chart: ChartPayload): chart is PlotlyFigure {
  return !Array.isArray(chart) && Array.isArray(chart?.data);
}

function toPlotlyFigure(chart: ChartPayload): PlotlyFigure | null {
  if (isPlotlyFigure(chart)) {
    return {
      data: chart.data,
      layout: chart.layout || {},
      frames: chart.frames,
      config: chart.config,
    };
  }

  if (!Array.isArray(chart) || chart.length === 0) {
    return null;
  }

  const keys = Object.keys(chart[0]);
  if (keys.length < 2) return null;

  const categoryKey = keys[0];
  const valueKeys = keys.slice(1);

  return {
    data: valueKeys.map((key, idx) => ({
      type: "bar",
      name: key,
      x: chart.map((row) => row[categoryKey]),
      y: chart.map((row) => row[key]),
      marker: {
        color: ["#00D4FF", "#7C4DFF", "#FFB020", "#35D07F"][idx % 4],
      },
    })),
    layout: {
      title: { text: "Data Visualization", font: { color: "#E6F0FF", size: 14 } },
      paper_bgcolor: "rgba(0,0,0,0)",
      plot_bgcolor: "rgba(0,0,0,0)",
      font: { color: "#B5C5D6", size: 12 },
      margin: { l: 30, r: 20, t: 44, b: 40 },
      xaxis: { gridcolor: "rgba(255,255,255,0.08)" },
      yaxis: { gridcolor: "rgba(255,255,255,0.08)" },
      legend: { orientation: "h", y: -0.2 },
      autosize: true,
    },
    config: {
      displaylogo: false,
      responsive: true,
      modeBarButtonsToRemove: ["lasso2d", "select2d"],
    },
  };
}

export function ChartRenderer({ chart, sessionId }: Props) {
  const figure = toPlotlyFigure(chart);
  const [isPinning, setIsPinning] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  if (!figure || !figure.data?.length) return null;

  const mergedConfig = {
    displaylogo: false,
    responsive: true,
    modeBarButtonsToRemove: ["lasso2d", "select2d"],
    ...figure.config,
  };

  const chartTitle =
    (typeof figure.layout?.title === "object" &&
      figure.layout?.title &&
      "text" in figure.layout.title &&
      typeof figure.layout.title.text === "string" &&
      figure.layout.title.text) ||
    "Pinned Visualization";

  const pinChart = async () => {
    if (!sessionId || isPinning || isPinned) return;
    setIsPinning(true);
    try {
      await api.pinChart({
        chart_data: figure,
        title: chartTitle,
        session_id: sessionId,
      });
      setIsPinned(true);
    } finally {
      setIsPinning(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-panel p-4 glow-cyan"
    >
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-primary" />
          <span className="text-xs font-mono text-primary uppercase tracking-wider">Interactive Visualization</span>
        </div>
        <button
          onClick={pinChart}
          disabled={!sessionId || isPinning || isPinned}
          className="text-xs px-2.5 py-1 rounded-md border border-white/15 bg-white/5 text-foreground/90 hover:bg-white/10 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          {isPinned ? <Check className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
          {isPinned ? "Pinned" : isPinning ? "Pinning..." : "Pin"}
        </button>
      </div>
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
          config={mergedConfig}
          style={{ width: "100%", height: "100%" }}
          useResizeHandler
        />
      </div>
    </motion.div>
  );
}
