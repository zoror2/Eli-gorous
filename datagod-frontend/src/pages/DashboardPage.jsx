import React from 'react';
import Dashboard from '../components/Dashboard';

const DashboardPage = () => (
  <div className="min-h-screen bg-background text-slate-100 flex flex-col">
    {/* Header */}
    <header className="px-6 py-4 bg-surface/50 border-b border-white/5 flex items-center justify-between backdrop-blur-md sticky top-0 z-50">
      <div className="flex items-center space-x-4">
        <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center border border-primary/30 shadow-lg shadow-primary/10">
          <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">DataGod Health — Live Dashboard</h1>
          <div className="flex items-center space-x-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
            <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">System Monitoring Active</span>
          </div>
        </div>
      </div>
      
      <button 
        onClick={() => window.location.href = '/'}
        className="flex items-center space-x-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl border border-white/5 transition-all text-sm font-bold"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span>Back to Chat</span>
      </button>
    </header>

    {/* Content */}
    <main className="flex-1 p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col space-y-1">
          <h2 className="text-3xl font-black text-slate-100 uppercase tracking-tighter">Clinical Intelligence Cluster</h2>
          <p className="text-slate-500 text-sm font-medium">Real-time visualization of hospital performance metrics and patient outcome trends.</p>
        </div>
        
        <Dashboard />
      </div>
    </main>

    {/* Footer */}
    <footer className="p-6 border-t border-white/5 text-center bg-surface/30">
        <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em] font-black">DataGod Health AI Platform v1.0.0 — Secured War Room Access</p>
    </footer>
  </div>
);

export { DashboardPage };
