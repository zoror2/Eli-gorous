import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import Sidebar from '../components/Sidebar';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState([]);
  const [favorites, setFavorites] = useState([]);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('dg_history');
    const savedFavorites = localStorage.getItem('dg_favorites');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    if (savedFavorites) setFavorites(JSON.parse(savedFavorites));
  }, []);

  // Save to localStorage whenever state changes
  useEffect(() => {
    localStorage.setItem('dg_history', JSON.stringify(history));
    localStorage.setItem('dg_favorites', JSON.stringify(favorites));
  }, [history, favorites]);

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    // Add to history
    const historyItem = {
      id: Date.now().toString(),
      query: text,
      timestamp: new Date().toISOString(),
      isFavorite: false
    };
    setHistory(prev => [historyItem, ...prev]);

    // Add user message
    const userMsg = { role: 'user', content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    // Simulated Logic for Table vs trend (Chart)
    setTimeout(() => {
      let agentMsg;
      const lowerText = text.toLowerCase();

      if (lowerText.includes('trend') || lowerText.includes('graph') || lowerText.includes('chart')) {
        // SQL Preview first
        setMessages(prev => [...prev, {
          role: 'agent',
          content: 'Analyzing historical trends...',
          type: 'sql',
          data: "SELECT date_trunc('month', date) as name, COUNT(*) as value FROM admissions GROUP BY 1 ORDER BY 1 LIMIT 6;"
        }]);

        agentMsg = {
          role: 'agent',
          content: `Here is the capacity trend based on your query.`,
          type: 'chart',
          data: {
            chartType: 'line',
            title: 'Patient Admission Trends (Last 6 Months)',
            series: [
              { name: 'Jan', value: 400 },
              { name: 'Feb', value: 300 },
              { name: 'Mar', value: 600 },
              { name: 'Apr', value: 800 },
              { name: 'May', value: 500 },
              { name: 'Jun', value: 900 }
            ]
          }
        };
      } else {
        // Standard SQL + Table
        setMessages(prev => [...prev, {
          role: 'agent',
          content: 'Searching hospital database...',
          type: 'sql',
          data: "SELECT id, name as patient, status, room FROM hospital_records WHERE status = 'Active' LIMIT 3;"
        }]);

        agentMsg = {
          role: 'agent',
          content: `Found matching records for patients in current rooms.`,
          type: 'table',
          data: [
            { ID: '101', Patient: 'John Doe', Status: 'Stable', Room: '202' },
            { ID: '102', Patient: 'Jane Smith', Status: 'Critical', Room: 'ICU-1' },
            { ID: '103', Patient: 'Mike Ross', Status: 'Recovered', Room: '305' }
          ]
        };
      }

      setMessages(prev => [...prev, agentMsg]);
      setIsLoading(false);
    }, 1500);
  };

  const toggleFavorite = (item) => {
    if (item.isFavorite) {
      setFavorites(prev => prev.filter(f => f.id !== item.id));
      setHistory(prev => prev.map(h => h.id === item.id ? { ...h, isFavorite: false } : h));
    } else {
      const updatedItem = { ...item, isFavorite: true };
      setFavorites(prev => [updatedItem, ...prev]);
      setHistory(prev => prev.map(h => h.id === item.id ? updatedItem : h));
    }
  };

  const deleteHistory = (id) => {
    setHistory(prev => prev.filter(h => h.id !== id));
    setFavorites(prev => prev.filter(f => f.id !== id));
  };

  return (
    <div className="flex h-screen bg-background text-slate-100 overflow-hidden">
      <Sidebar 
        history={history} 
        favorites={favorites} 
        onQueryClick={handleSendMessage}
        onToggleFavorite={toggleFavorite}
        onDeleteHistory={deleteHistory}
      />
      
      <div className="flex-1 flex flex-col min-w-0">
        <ChatWindow messages={messages} isLoading={isLoading} />
        <InputBar onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatPage;
