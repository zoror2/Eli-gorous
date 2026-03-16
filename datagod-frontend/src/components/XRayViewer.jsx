import React, { useState } from 'react';

const XRayViewer = ({ imageUrl, title, patientName, date, magnification = 1 }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [isFullscreen, setIsFullscreen] = useState(false);

  return (
    <div className={`flex flex-col ${isFullscreen ? 'fixed inset-0 z-50 bg-black p-8' : 'w-full'}`}>
      <div className="glass-panel rounded-3xl p-6 border border-white/10 shadow-2xl relative group overflow-hidden">
        {/* Top Info Bar */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex flex-col">
            <span className="medical-label">Digital Radiography System</span>
            <h3 className="text-xl font-bold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-400 mt-1">{patientName} • {date}</p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 bg-slate-800/80 hover:bg-primary/20 rounded-xl text-slate-400 hover:text-primary transition-all duration-300 border border-white/5"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            </button>
          </div>
        </div>

        {/* Main Viewer Area */}
        <div className="relative aspect-square md:aspect-video bg-[#050505] rounded-2xl overflow-hidden border border-white/5 ring-1 ring-white/5 flex items-center justify-center">
          <img 
            src={imageUrl} 
            alt={title}
            className="max-h-full max-w-full object-contain transition-all duration-300"
            style={{ 
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              imageRendering: 'crisp-edges'
            }}
          />
          
          {/* Controls Overlay */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center space-x-6 px-8 py-4 glass-panel rounded-2xl border border-white/10 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-4 group-hover:translate-y-0">
            <div className="flex flex-col space-y-2">
              <span className="medical-label text-[9px] text-center">Brightness</span>
              <input 
                type="range" min="50" max="200" value={brightness} 
                onChange={(e) => setBrightness(e.target.value)}
                className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex flex-col space-y-2">
              <span className="medical-label text-[9px] text-center">Contrast</span>
              <input 
                type="range" min="50" max="200" value={contrast} 
                onChange={(e) => setContrast(e.target.value)}
                className="w-32 h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-primary"
              />
            </div>
          </div>

          {/* Clinical HUD */}
          <div className="absolute top-4 right-4 flex flex-col items-end space-y-1">
            <div className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded border border-white/5 medical-label text-[8px] text-primary">MAG: {magnification}x</div>
            <div className="px-2 py-1 bg-black/40 backdrop-blur-sm rounded border border-white/5 medical-label text-[8px]">LUT: INVERTED_BONE</div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="mt-6 grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
           <div>
             <span className="medical-label block mb-1">Exposure</span>
             <p className="text-xs font-mono text-slate-400">80kVp • 250mA • 50ms</p>
           </div>
           <div>
             <span className="medical-label block mb-1">Artifacts</span>
             <p className="text-xs font-mono text-slate-400">NONE_DETECTED</p>
           </div>
           <div className="text-right flex flex-col items-end">
             <span className="medical-label block mb-1">Status</span>
             <div className="flex items-center space-x-1.5 text-success">
                <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse"></div>
                <span className="text-[10px] font-bold">CERTIFIED_AI_READ</span>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default XRayViewer;
