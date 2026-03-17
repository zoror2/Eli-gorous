import { motion } from "framer-motion";
import type { ChatMessage as ChatMessageType } from "@/lib/api";
import { SqlPreview } from "./SqlPreview";
import { ChartRenderer } from "./ChartRenderer";
import { MermaidRenderer } from "./MermaidRenderer";
import { MarkdownContent } from "./MarkdownContent";
import { Bot } from "lucide-react";

interface Props {
  message: ChatMessageType;
  sessionId?: string;
}

export function ChatMessageBubble({ message, sessionId }: Props) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shrink-0 glow-cyan mt-1">
          <Bot className="w-5 h-5 text-primary" />
        </div>
      )}
      <div className={`max-w-[75%] space-y-3 ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? "bg-primary/15 border border-primary/20 text-foreground ml-auto"
              : "glass-panel text-foreground"
          }`}
        >
          <MarkdownContent content={message.content} />
        </div>
        {message.sql && <SqlPreview sql={message.sql} />}
        {message.chart && <ChartRenderer chart={message.chart} sessionId={sessionId} />}
        {message.flowchart && <MermaidRenderer chart={message.flowchart} />}
      </div>
    </motion.div>
  );
}
