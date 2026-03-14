import React from 'react';
import ChartRenderer from './ChartRenderer';
import SQLPreview from './SQLPreview';
// import FlowchartRenderer from './FlowchartRenderer';

const MessageBubble = ({ role, content, type, data }) => {
  const isUser = role === 'user';

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
            <div className="w-full mt-2">
               <ChartRenderer 
                 type={data.chartType} 
                 data={data.series} 
                 title={data.title} 
               />
            </div>
          )}

          {type === 'sql' && (
            <div className="w-full mt-2">
              <SQLPreview sql={data} />
            </div>
          )}

          {type === 'table' && (
            <div className="w-full mt-2 overflow-x-auto border border-white/5 rounded-xl shadow-xl bg-surface">
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
          )}
          
          {type === 'alert' && (
            <div className="w-full mt-2 bg-danger/10 border border-danger/30 text-danger px-4 py-3 rounded-xl flex items-center space-x-3 shadow-lg shadow-danger/5">
              <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm font-semibold">{data || content}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
