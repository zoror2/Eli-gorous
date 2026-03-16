import React, { useState, useEffect } from 'react';
import ChatWindow from '../components/ChatWindow';
import InputBar from '../components/InputBar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';

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

  // Scroll to bottom when messages change
  useEffect(() => {
    const chatWindow = document.getElementById('chat-messages-container');
    if (chatWindow) {
      chatWindow.scrollTo({ top: chatWindow.scrollHeight, behavior: 'smooth' });
    }
  }, [messages, isLoading]);

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

    try {
      // Create a dummy session ID if none exists (in a real app, this should be consistent)
      const sessionId = localStorage.getItem('dg_session_id') || Date.now().toString();
      localStorage.setItem('dg_session_id', sessionId);

      // Call the actual backend API
      const responseData = await api.sendMessage(text, sessionId);

      const newMessages = [];
      
      // 1. If the backend sent SQL, show the SQL block first as its own message
      if (responseData.sql) {
        newMessages.push({
          role: 'agent',
          content: 'Here is the SQL query generated for your request:',
          type: 'sql',
          data: responseData.sql
        });
      }

      // 2. Add the main content message plus any attachments (chart, flowchart, etc.)
      // We prioritize the chart/data field for the main interactive component
      let bubbleType = responseData.type || "text";
      let bubbleData = null;

      if (responseData.chart) {
        bubbleType = 'chart';
        bubbleData = responseData.chart;
      } else if (responseData.flowchart) {
        bubbleType = 'flowchart';
        bubbleData = responseData.flowchart;
      } else if (responseData.data) {
        // Fallback for generic data (like tables)
        bubbleData = responseData.data;
      }

      newMessages.push({
        role: 'agent',
        content: responseData.response || "I have processed your query.",
        type: bubbleType,
        data: bubbleData
      });

      setMessages(prev => [...prev, ...newMessages]);
    } catch (error) {
      console.error("Backend Error:", error);
      
      let errorTitle = "Connection Failed";
      let errorContent = "I couldn't reach the backend server. Please make sure it's running on port 8000.";
      
      // Check for specific Gemini API key error
      if (error.response?.data?.detail?.includes("API key not valid")) {
        errorTitle = "Invalid Gemini API Key";
        errorContent = "Your Google API Key is invalid or missing. Please check your .env file in the backend folder and ensure the GOOGLE_API_KEY is pasted correctly.";
      }

      setMessages(prev => [...prev, {
        role: 'agent',
        content: errorContent,
        title: errorTitle,
        type: 'alert'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunQuery = async (sql) => {
    setIsLoading(true);
    try {
      const result = await api.executeQuery(sql);
      
      if (result.error) {
        setMessages(prev => [...prev, {
          role: 'agent',
          content: `SQL Error: ${result.error}`,
          type: 'alert'
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'agent',
          content: `Query results for: \n${sql}`,
          type: 'table',
          data: result.rows.map(row => {
            const rowObj = {};
            result.columns.forEach((col, i) => rowObj[col] = row[i]);
            return rowObj;
          })
        }]);
      }
    } catch (error) {
      console.error("Query Execution Error:", error);
      setMessages(prev => [...prev, {
        role: 'agent',
        content: "Failed to execute query. Check backend connectivity.",
        type: 'alert'
      }]);
    } finally {
      setIsLoading(false);
    }
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
        <ChatWindow messages={messages} isLoading={isLoading} onRunQuery={handleRunQuery} />
        <InputBar onSend={handleSendMessage} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default ChatPage;
