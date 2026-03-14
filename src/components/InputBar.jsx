import React, { useState } from 'react';

const InputBar = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSend(input);
      setInput('');
    }
  };

  const toggleMic = () => {
    // This will be connected to useVoiceInput later
    setIsListening(!isListening);
    if (!isListening) {
      console.log('Voice recognition started...');
      // Simulated voice result
      setTimeout(() => {
        setIsListening(false);
      }, 3000);
    }
  };

  return (
    <div className="p-4 md:p-6 border-t border-white/5 bg-background">
      <form 
        onSubmit={handleSubmit}
        className="max-w-4xl mx-auto flex items-center space-x-3 bg-surface border border-white/5 p-2 px-3 rounded-2xl shadow-2xl transition-all duration-300 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary/50"
      >
        <button
          type="button"
          onClick={toggleMic}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            isListening 
              ? 'bg-danger text-white animate-pulse shadow-lg shadow-danger/30' 
              : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-100'
          }`}
          title="Voice Search"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
          </svg>
        </button>

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask DataGod a health query..."
          className="flex-1 bg-transparent border-none focus:ring-0 text-slate-100 placeholder-slate-500 py-3 px-1 text-[15px] font-medium"
          disabled={isLoading}
        />

        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
            input.trim() && !isLoading
              ? 'bg-primary text-white shadow-lg shadow-primary/20'
              : 'bg-slate-700/50 text-slate-500'
          }`}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
          </svg>
        </button>
      </form>
      <div className="mt-3 text-center">
        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">DataGod Health AI Platform v1.0.0</p>
      </div>
    </div>
  );
};

export default InputBar;
