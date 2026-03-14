import React from 'react';
import ChatPage from './ChatPage';

const DashboardPage = () => (
  <div className="h-screen bg-background flex flex-col items-center justify-center p-8">
    <div className="card max-w-2xl w-full p-12 text-center space-y-6">
      <div className="w-20 h-20 bg-primary/20 rounded-3xl flex items-center justify-center mx-auto border border-primary/30">
        <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <h1 className="text-3xl font-extrabold text-slate-100 tracking-tight">DataGod Health Dashboard</h1>
      <p className="text-slate-400 leading-relaxed">No charts pinned yet. Ask a question and pin charts here to monitor live hospital metrics.</p>
      <button 
        onClick={() => window.location.href = '/'}
        className="btn-primary"
      >
        Back to Chat
      </button>
    </div>
  </div>
);

export { DashboardPage };
