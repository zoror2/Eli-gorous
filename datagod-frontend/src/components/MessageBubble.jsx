import React from 'react';
import ChartRenderer from './ChartRenderer';
import SQLPreview from './SQLPreview';
import FlowchartRenderer from './FlowchartRenderer';
import ExportButton from './ExportButton';
import { api } from '../services/api';

const MessageBubble = ({ role, content, type, data, title, onRunQuery }) => {
  const isUser = role === 'user';
  const [isPinned, setIsPinned] = React.useState(false);

  const handlePin = async () => {
    try {
      await api.pinChart({
        title: data.title || "Pinned Metric",
        chart_data: data
      });
      setIsPinned(true);
      setTimeout(() => setIsPinned(false), 2000);
    } catch (error) {
      console.error("Pinning error:", error);
    }
  };

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} w-full animate-in fade-in slide-in-from-bottom-2 duration-300`}>
      <div className={`flex items-start space-x-3 max-w-[90%] md:max-w-[80%] ${isUser ? 'flex-row-reverse space-x-reverse' : 'flex-row'}`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center overflow-hidden border ${isUser ? 'bg-primary/20 border-primary/30' : 'bg-slate-700 border-white/5 shadow-inner'}`}>
          {isUser ? (
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          ) : (
            <img src="https://api.dicebear.com/7.x/bottts/svg?seed=DataGod" alt="AI" className="w-full h-full object-cover" />
          )}
        </div>

        {/* Bubble */}
        <div className={`flex flex-col space-y-2 ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm border ${
            isUser 
              ? 'bg-primary text-white rounded-tr-none border-primary/20' 
              : 'bg-surface text-slate-100 rounded-tl-none border-white/5'
          }`}>
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed font-medium">
              {content}
            </p>
          </div>

          {/* Conditional Media Rendering */}
          {type === 'chart' && (
            <div className="w-full mt-2 space-y-2">
               <ChartRenderer 
                 type={data.chartType} 
                 data={data.series} 
                 title={data.title} 
               />
               <div className="flex space-x-2">
                 <ExportButton type="csv" data={data} filename={data.title} />
                 <button 
                  onClick={handlePin}
                  className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border transition-all text-[11px] font-bold uppercase tracking-wider ${
                    isPinned 
                      ? 'bg-success text-slate-900 border-success' 
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border-white/5'
                  }`}
                 >
                    {isPinned ? (
                      <>
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        <span>PINNED!</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                        </svg>
                        <span>Pin to Dashboard</span>
                      </>
                    )}
                 </button>
               </div>
            </div>
          )}

          {type === 'flowchart' && (
            <div className="w-full mt-2">
              <FlowchartRenderer code={data} />
            </div>
          )}

          {type === 'sql' && (
            <div className="w-full mt-2">
              <SQLPreview sql={data} onRun={onRunQuery} />
            </div>
          )}

          {type === 'table' && (
            <div className="w-full mt-2 space-y-2">
              <div className="overflow-x-auto border border-white/5 rounded-xl shadow-xl bg-surface">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-800/80 text-slate-400 font-bold uppercase text-[10px] tracking-[0.15em] border-b border-white/5">
                    <tr>
                      {Object.keys(data[0] || {}).map((key) => (
                        <th key={key} className="px-6 py-4">{key}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {data.map((row, idx) => (
                      <tr key={idx} className="hover:bg-white/[0.03] text-slate-300 transition-colors">
                        {Object.values(row).map((val, i) => (
                          <td key={i} className="px-6 py-4 whitespace-nowrap">{String(val)}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ExportButton type="csv" data={data} filename="table_export" />
            </div>
          )}
          
          {type === 'alert' && (
            <div className="w-full mt-2 bg-danger/10 border border-danger/30 text-danger px-5 py-4 rounded-2xl flex items-start space-x-4 shadow-xl shadow-danger/5 backdrop-blur-sm">
              <div className="bg-danger/20 p-2 rounded-lg mt-0.5">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold uppercase tracking-wider mb-1">{title || "System Notification"}</span>
                <span className="text-[14px] leading-relaxed opacity-90">{content}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
