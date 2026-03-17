import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Mic, MicOff, Send } from "lucide-react";
import { ChatMessageBubble } from "@/components/chat/ChatMessage";
import type { ChatMessage } from "@/lib/api";
import { api } from "@/lib/api";
import { mockChatHistory, mockChatResponses } from "@/lib/mock-data";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getOrCreateSessionId } from "@/lib/session";

const SESSION_ID = getOrCreateSessionId();

type SpeechRecognitionEvent = Event & {
  results: {
    [index: number]: {
      [index: number]: { transcript: string };
      isFinal: boolean;
    };
    length: number;
  };
};

type SpeechRecognitionCtor = new () => {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>(mockChatHistory);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || loading) return;

    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      role: "user",
      content: text,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendChat({ session_id: SESSION_ID, message: text, mode: "chat" });
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: res.response,
        sql: res.sql,
        chart: res.chart,
        flowchart: res.flowchart,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch {
      const lower = text.toLowerCase();
      let mockKey = "default";
      if (lower.includes("sql") || lower.includes("query") || lower.includes("patient")) mockKey = "sql";
      else if (lower.includes("chart") || lower.includes("graph") || lower.includes("data")) mockKey = "chart";
      else if (lower.includes("flow") || lower.includes("diagram") || lower.includes("process")) mockKey = "flowchart";

      const mock = mockChatResponses[mockKey];
      const aiMsg: ChatMessage = {
        id: `a-${Date.now()}`,
        role: "assistant",
        content: mock.response || "Analysis complete.",
        sql: mock.sql || null,
        chart: mock.chart || null,
        flowchart: mock.flowchart || null,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Recognition) {
      setSpeechSupported(false);
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = "";
      for (let i = 0; i < event.results.length; i += 1) {
        transcript += event.results[i][0].transcript;
      }
      setInput(transcript.trimStart());
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    setSpeechSupported(true);

    return () => {
      recognition.stop();
      recognitionRef.current = null;
    };
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const listener = (event: Event) => {
      const custom = event as CustomEvent<string>;
      const rerunQuery = custom.detail || "";
      if (!rerunQuery.trim()) return;
      void handleSendMessage(rerunQuery);
    };

    window.addEventListener("datagod:rerun-query", listener as EventListener);
    return () => {
      window.removeEventListener("datagod:rerun-query", listener as EventListener);
    };
  }, [loading]);

  const toggleListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition || loading) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
      return;
    }

    setIsListening(true);
    recognition.start();
  };

  const sendMessage = async () => {
    const text = input;
    if (!text.trim() || loading) return;
    setInput("");
    await handleSendMessage(text);
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4 scrollbar-thin">
        <div className="max-w-4xl mx-auto space-y-6 pb-4">
          {messages.map((msg) => (
            <ChatMessageBubble key={msg.id} message={msg} sessionId={SESSION_ID} />
          ))}
          {loading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-3 items-center"
            >
              <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center glow-cyan">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              </div>
              <div className="glass-panel px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 rounded-full bg-primary/60"
                      animate={{ y: [0, -6, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-white/[0.06] shrink-0">
        <div className="max-w-4xl mx-auto">
          <div className="glass-panel-strong flex items-center gap-3 p-2 pl-4">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask DataGod AI to analyze medical data..."
              className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
            />
            {speechSupported && (
              <button
                onClick={toggleListening}
                disabled={loading}
                title={isListening ? "Stop voice input" : "Start voice input"}
                className={`p-2.5 rounded-lg border transition-all ${
                  isListening
                    ? "bg-red-500/20 border-red-400/40 text-red-300"
                    : "bg-white/5 border-white/10 text-foreground/80 hover:bg-white/10"
                } disabled:opacity-40 disabled:cursor-not-allowed`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>
            )}
            <button
              onClick={sendMessage}
              disabled={!input.trim() || loading}
              className="px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold tracking-wide flex items-center gap-2 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed animate-pulse-glow"
            >
              <Send className="w-4 h-4" />
              ANALYZE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
