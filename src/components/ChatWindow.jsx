import React, { useState, useRef, useEffect } from 'react';
import MessageBubble from './MessageBubble';

const ChatWindow = ({ messages, isLoading }) => {
  const scrollRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  return (
    <div className="flex-1 flex flex-col h-full bg-background overflow-hidden relative">
      {/* Header Overlay (optional but looks professional) */}
      <div className="h-16 flex items-center px-6 bg-background/80 backdrop-blur-md border-b border-white/5 z-10 sticky top-0">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
            <span className="text-white text-xs font-bold">DG</span>
          </div>
          <h1 className="font-semibold text-lg text-slate-100">DataGod Health Assistant</h1>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth"
      >
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-surface flex items-center justify-center border border-white/5">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <p className="text-center max-w-xs">Welcome to DataGod. Ask me anything about patients, appointments, or laboratory results.</p>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <MessageBubble key={idx} {...msg} />
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-start space-x-3">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=DataGod" alt="Avatar" />
            </div>
            <div className="bg-surface border border-white/5 rounded-2xl rounded-tl-none p-4 shadow-sm max-w-[80%]">
              <div className="flex space-x-1 items-center h-4">
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce-dots [animation-delay:-0.3s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce-dots [animation-delay:-0.15s]"></div>
                <div className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce-dots"></div>
                <span className="ml-2 text-xs text-slate-400 font-medium">DataGod is thinking...</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatWindow;
