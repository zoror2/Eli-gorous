import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: true,
  theme: 'dark',
  securityLevel: 'loose',
  fontFamily: 'Inter',
});

const FlowchartRenderer = ({ code }) => {
  const chartRef = useRef(null);
  const containerId = `mermaid-chart-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const renderChart = async () => {
      if (chartRef.current && code) {
        try {
          // Clear previous content
          chartRef.current.innerHTML = '';
          
          // Render the chart using the API for better control
          const { svg } = await mermaid.render(containerId, code);
          chartRef.current.innerHTML = svg;
        } catch (error) {
          console.error("Mermaid execution error:", error);
          chartRef.current.innerHTML = `<div class="text-danger p-4 border border-danger/20 bg-danger/5 rounded-xl text-xs font-mono">Mermaid Syntax Error: ${error.message}</div>`;
        }
      }
    };
    renderChart();
  }, [code, containerId]);

  return (
    <div className="w-full bg-slate-900/50 rounded-2xl p-6 border border-white/5 overflow-hidden shadow-inner group relative">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center">
           <svg className="w-4 h-4 mr-2 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
           </svg>
           SYSTEM INTELLIGENCE FLOW
        </h3>
        <div className="flex space-x-2">
          <button 
            className="p-1.5 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-all"
            title="Download SVG"
            onClick={() => {
              const svg = chartRef.current.querySelector('svg').outerHTML;
              const blob = new Blob([svg], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              window.open(url);
            }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        </div>
      </div>
      <div className="overflow-x-auto py-4 flex justify-center custom-scrollbar">
        <div ref={chartRef} className="w-full text-center">
          {/* SVG will be injected here */}
          <div className="animate-pulse flex items-center justify-center py-10">
            <div className="text-slate-500 text-xs font-bold tracking-widest uppercase">Initializing Canvas...</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FlowchartRenderer;
