import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Plot from "react-plotly.js";
import { api, type PlotlyFigure } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { AlertTriangle, ArrowLeft } from "lucide-react";

function isPlotlyFigure(chart: unknown): chart is PlotlyFigure {
  return !!chart && typeof chart === "object" && !Array.isArray(chart) && Array.isArray((chart as PlotlyFigure).data);
}

export default function SharedChartPage() {
  const { token } = useParams();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["shared-chart", token],
    queryFn: () => api.getSharedChart(token || ""),
    enabled: !!token,
    retry: 1,
  });

  const figure = useMemo(() => {
    if (!data?.chart_data || !isPlotlyFigure(data.chart_data)) return null;
    return data.chart_data;
  }, [data]);

  return (
    <div className="min-h-screen bg-background text-foreground p-6 md:p-10">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Shared Visualization</h1>
            <p className="text-sm text-muted-foreground mt-1">Read-only chart link shared from DataGod Command Center</p>
          </div>
          <Button asChild variant="outline" className="gap-2">
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="rounded-xl border border-white/10 bg-black/20 p-5">
          {isLoading && <p className="text-sm text-muted-foreground">Loading shared chart...</p>}

          {isError && (
            <div className="flex items-start gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4 mt-0.5" />
              <p className="text-sm">This shared link is invalid or no longer available.</p>
            </div>
          )}

          {!isLoading && !isError && !figure && (
            <p className="text-sm text-muted-foreground">No chart data is available for this shared item.</p>
          )}

          {!isLoading && !isError && figure && (
            <>
              <div className="mb-4">
                <h2 className="text-lg font-semibold">{data?.title || "Shared Chart"}</h2>
                <p className="text-xs text-muted-foreground">
                  Shared on {data?.shared_at ? new Date(data.shared_at).toLocaleString() : "unknown"}
                </p>
              </div>

              <div className="h-[520px]">
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
            </>
          )}
        </div>
      </div>
    </div>
  );
}
