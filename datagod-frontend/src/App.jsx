import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import { DashboardPage } from './pages/DashboardPage';
import RadiologyPage from './pages/RadiologyPage';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background text-slate-100 selection:bg-primary/30">
        <div className="fixed inset-0 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-[0.03] z-50"></div>
        <Routes>
          <Route path="/" element={<ChatPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/radiology" element={<RadiologyPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
