import React, { useState } from 'react';

const SQLPreview = ({ sql, onRun, onEdit }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSql, setEditedSql] = useState(sql);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(editedSql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full bg-[#0D1117] border border-white/10 rounded-xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-300">
      {/* Terminal Header */}
      <div className="bg-slate-900 px-4 py-2 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center space-x-2">
          <div className="flex space-x-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <span className="text-[10px] text-slate-500 font-mono font-bold tracking-widest ml-4 uppercase">AI SQL GENERATOR</span>
        </div>
        <div className="flex items-center space-x-2">
           <button 
             onClick={handleCopy}
             className="p-1 px-2 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors flex items-center space-x-1"
           >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012-2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3" />
              </svg>
              <span className="text-[10px] uppercase font-bold">{copied ? 'COPIED!' : 'COPY'}</span>
           </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="p-4 bg-slate-950 min-h-[100px] flex">
        {isEditing ? (
          <textarea
            value={editedSql}
            onChange={(e) => setEditedSql(e.target.value)}
            className="w-full bg-transparent border-none text-success font-mono text-sm resize-none focus:ring-0 p-0"
            rows={editedSql.split('\n').length || 3}
            autoFocus
          />
        ) : (
          <pre className="text-success font-mono text-sm leading-relaxed whitespace-pre-wrap select-all">
            {sql}
          </pre>
        )}
      </div>

      {/* Actions */}
      <div className="p-2 px-4 bg-slate-900 border-t border-white/5 flex justify-end space-x-2">
        <button 
          onClick={() => setIsEditing(!isEditing)}
          className="px-3 py-1 text-slate-400 hover:text-white text-[11px] font-bold transition-colors"
        >
          {isEditing ? 'SAVE' : 'EDIT'}
        </button>
        <button 
          onClick={() => onRun ? onRun(editedSql) : console.log('Running SQL:', editedSql)}
          className="px-4 py-1.5 bg-success/20 hover:bg-success text-success hover:text-slate-950 text-[11px] font-black rounded border border-success/30 transition-all duration-300"
        >
          RUN QUERY
        </button>
      </div>
    </div>
  );
};

export default SQLPreview;
