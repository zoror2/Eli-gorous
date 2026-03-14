import React, { useState, useEffect } from 'react';

const Sidebar = ({ history, favorites, onQueryClick, onToggleFavorite, onDeleteHistory }) => {
  const [activeTab, setActiveTab] = useState('history');
  const [isCollapsed, setIsCollapsed] = useState(false);

  const items = activeTab === 'history' ? history : favorites;

  return (
    <div className={`transition-all duration-300 bg-surface border-r border-white/5 flex flex-col h-full ${isCollapsed ? 'w-16' : 'w-72'}`}>
      {/* Sidebar Header */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-white/5">
        {!isCollapsed && <span className="text-xs uppercase font-black text-slate-500 tracking-[0.2em]">Query Manager</span>}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-slate-700 rounded-lg text-slate-400"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isCollapsed ? "M13 5l7 7-7 7M5 5l7 7-7 7" : "M11 19l-7-7 7-7m8 14l-7-7 7-7"} />
          </svg>
        </button>
      </div>

      {!isCollapsed && (
        <>
          {/* Tabs */}
          <div className="flex p-2 gap-1">
            <button 
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'history' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-slate-700/50'}`}
            >
              HISTORY
            </button>
            <button 
              onClick={() => setActiveTab('favorites')}
              className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'favorites' ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' : 'text-slate-400 hover:bg-slate-700/50'}`}
            >
              FAVORITES
            </button>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-hide">
            {items.length === 0 ? (
              <div className="py-10 text-center text-slate-600">
                <p className="text-xs italic">No {activeTab} yet</p>
              </div>
            ) : (
              items.map((item) => (
                <div 
                  key={item.id}
                  className="group relative bg-white/[0.03] border border-white/5 rounded-xl p-3 hover:bg-white/[0.07] transition-all cursor-pointer"
                  onClick={() => onQueryClick(item.query)}
                >
                  <div className="flex justify-between items-start mb-1">
                    <p className="text-[13px] font-medium text-slate-300 line-clamp-2 transition-colors group-hover:text-white">
                      {item.query}
                    </p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onToggleFavorite(item); }}
                        className={`p-1 rounded hover:bg-slate-600 ${item.isFavorite ? 'text-amber-400' : 'text-slate-400'}`}
                      >
                        <svg className="w-3.5 h-3.5" fill={item.isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      </button>
                      <button 
                        onClick={(e) => { e.stopPropagation(); onDeleteHistory(item.id); }}
                        className="p-1 rounded hover:bg-danger/20 text-slate-400 hover:text-danger"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Sidebar Footer */}
      {!isCollapsed && (
        <div className="p-4 border-t border-white/5 space-y-3">
          <button 
            onClick={() => window.location.href = '/dashboard'}
            className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-lg border border-white/5 flex items-center justify-center space-x-2 transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>LIVE DASHBOARD</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
