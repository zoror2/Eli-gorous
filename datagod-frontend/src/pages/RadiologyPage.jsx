import React from 'react';
import XRayViewer from '../components/XRayViewer';
import Sidebar from '../components/Sidebar';

const RadiologyPage = () => {
  // Sample imaging data
  const scans = [
    {
      id: 1,
      title: "Chest PA View",
      patientName: "John Doe",
      date: "Mar 15, 2026",
      url: "https://images.unsplash.com/photo-1542382156909-9ae37b3f56fd?q=80&w=2000&auto=format&fit=crop", // placeholder
      type: "X-RAY"
    },
    {
      id: 2,
      title: "Hand AP/Lat",
      patientName: "Jane Smith",
      date: "Mar 14, 2026",
      url: "https://images.unsplash.com/photo-1579154235828-401982250e16?q=80&w=2000&auto=format&fit=crop", // placeholder
      type: "X-RAY"
    }
  ];

  const [activeScan, setActiveScan] = React.useState(scans[0]);

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      <Sidebar />
      <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-10">
          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <span className="medical-label text-primary">Department of Radiology</span>
              <h1 className="text-4xl font-extrabold tracking-tight mt-2 italic capitalize">Clinical Imaging Matrix</h1>
            </div>
            <div className="flex space-x-4">
               <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center">
                  <span className="medical-label text-[9px]">Total Scans</span>
                  <span className="text-2xl font-black text-primary">1,280</span>
               </div>
               <div className="glass-panel px-6 py-3 rounded-2xl flex flex-col items-center border-primary/20">
                  <span className="medical-label text-[9px]">Anomalies</span>
                  <span className="text-2xl font-black text-danger">12</span>
               </div>
            </div>
          </div>

          {/* Main Viewer */}
          <XRayViewer 
            imageUrl={activeScan.url} 
            title={activeScan.title}
            patientName={activeScan.patientName}
            date={activeScan.date}
          />

          {/* Gallery Sidebar/Grid */}
          <div className="space-y-6">
            <h4 className="medical-label">Recent Acquisitions</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {scans.map((scan) => (
                <button 
                  key={scan.id}
                  onClick={() => setActiveScan(scan)}
                  className={`glass-card p-4 rounded-3xl text-left flex flex-col space-y-4 group ${
                    activeScan.id === scan.id ? 'ring-2 ring-primary border-primary/50' : ''
                  }`}
                >
                  <div className="aspect-square bg-black rounded-2xl overflow-hidden border border-white/5 relative">
                     <img src={scan.url} alt={scan.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                     <div className="absolute top-2 right-2 bg-primary/20 backdrop-blur-md px-2 py-0.5 rounded text-[8px] font-bold text-primary">{scan.type}</div>
                  </div>
                  <div>
                    <h5 className="font-bold text-sm text-slate-200">{scan.title}</h5>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{scan.date}</p>
                  </div>
                </button>
              ))}
              
              {/* New Scan Placeholder */}
              <div className="glass-card p-4 rounded-3xl border-dashed border-white/10 flex flex-col items-center justify-center text-slate-600 hover:text-slate-400 cursor-pointer transition-colors">
                 <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                 </svg>
                 <span className="text-[10px] font-black uppercase tracking-widest">Add Archive</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RadiologyPage;
