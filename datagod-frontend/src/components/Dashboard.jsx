import React, { useState, useEffect } from 'react';
import ChartRenderer from './ChartRenderer';
import { api } from '../services/api';

const Dashboard = () => {
  const [pins, setPins] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setPins(data || []);
    } catch (error) {
      console.error("Dashboard fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
    // Auto-refresh every 60 minutes as per spec
    const interval = setInterval(fetchDashboard, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-slate-400 font-bold tracking-widest uppercase text-xs">Syncing Intelligence Nodes...</p>
      </div>
    );
  }

  if (pins.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-20 text-center space-y-6 bg-surface/30 rounded-3xl border border-white/5 backdrop-blur-md">
        <div className="w-16 h-16 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-500 border border-white/5">
           <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
           </svg>
        </div>
        <div>
          <h3 className="text-xl font-bold text-slate-200 uppercase tracking-tight">No Active Intelligence Pinned</h3>
          <p className="text-slate-500 mt-2 max-w-sm mx-auto">Analyze clinic data in the chat and pin key metrics here to monitor Eli-gorous Medical Center performance.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 w-full animate-in fade-in zoom-in-95 duration-500">
      {pins.map((pin) => (
        <div 
          key={pin.id} 
          className="bg-surface/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl flex flex-col group hover:border-primary/30 transition-all duration-300"
        >
          {/* Card Header */}
          <div className="px-6 py-4 bg-slate-800/40 flex items-center justify-between border-b border-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Live Telemetry Control</span>
            </div>
            <button 
              className="text-slate-600 hover:text-danger p-1.5 hover:bg-danger/10 rounded-lg transition-all"
              title="Unpin Insight"
              onClick={() => {
                 // In a real app we'd call the API, here we mock for UX
                 setPins(prev => prev.filter(p => p.id !== pin.id));
              }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>

          {/* Card Body */}
          <div className="flex-1 p-6">
             <ChartRenderer 
               type={pin.chart_data.chartType} 
               data={pin.chart_data.series} 
               title={pin.title} 
             />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Dashboard;
