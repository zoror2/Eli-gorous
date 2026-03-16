import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Sidebar = ({ history = [], favorites = [], onQueryClick, onToggleFavorite, onDeleteHistory }) => {
  const location = useLocation();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="w-80 h-screen glass-panel border-r border-white/5 flex flex-col z-20 transition-all duration-500">
      {/* Brand Section */}
      <div className="p-8 border-b border-white/5 bg-slate-900/40">
        <div className="flex items-center space-x-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-blue-600 flex items-center justify-center shadow-xl shadow-primary/20 animate-glow">
            <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 00-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white italic">DATAGOD</h2>
            <p className="text-[9px] font-black text-primary tracking-[0.3em] uppercase opacity-80">Health Intelligence</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <div className="p-4 space-y-2">
        <Link 
          to="/" 
          className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
            isActive('/') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          <span>AI Consultation</span>
        </Link>

        <Link 
          to="/radiology" 
          className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
            isActive('/radiology') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9-9c1.657 0 3 4.03 3 9s-1.343 9-3 9m0-18c-1.657 0-3 4.03-3 9s1.343 9 3 9m-9-9a9 9 0 019-9" />
          </svg>
          <span>Radiology & Imaging</span>
        </Link>
        
        <Link 
          to="/dashboard" 
          className={`flex items-center space-x-3 px-4 py-3.5 rounded-2xl transition-all duration-300 font-bold text-sm ${
            isActive('/dashboard') ? 'bg-primary text-slate-900 shadow-lg shadow-primary/20' : 'text-slate-400 hover:bg-white/5 hover:text-white'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
          </svg>
          <span>Live Intelligence</span>
        </Link>
      </div>

      {/* History & Favorites Section */}
      <div className="flex-1 overflow-y-auto px-4 mt-6 custom-scrollbar">
        <div className="space-y-8">
           <div className="space-y-3">
             <h3 className="medical-label px-4 opacity-50">ARCHIVE_LOGS</h3>
             <div className="space-y-1">
                {(history || []).length === 0 ? (
                  <p className="px-4 text-[10px] text-slate-600 font-bold italic py-2">NO_RECORDS</p>
                ) : (
                  history.slice(0, 10).map((item) => (
                    <button 
                      key={item.id}
                      onClick={() => onQueryClick(item.query)}
                      className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-white/5 transition-colors text-xs text-slate-400 hover:text-white truncate font-medium border border-transparent hover:border-white/5"
                    >
                      {item.query}
                    </button>
                  ))
                )}
             </div>
           </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="p-6 border-t border-white/5 bg-slate-950/50">
         <div className="glass-card p-4 rounded-2xl border-primary/20">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center">
               <div className="w-1.5 h-1.5 rounded-full bg-success mr-2"></div>
               System Status
            </p>
            <div className="flex justify-between items-center text-[10px] font-bold">
               <span className="text-slate-500">Node: DG-001</span>
               <span className="text-success text-[8px]">V_1.5.2_STABLE</span>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Sidebar;
