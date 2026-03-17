import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function MarkdownContent({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        strong: ({ children }) => <strong className="font-semibold text-primary">{children}</strong>,
        code: ({ children }) => (
          <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-primary">{children}</code>
        ),
        p: ({ children }) => <p className="mb-1 last:mb-0">{children}</p>,
        ul: ({ children }) => <ul className="list-disc pl-5 space-y-1 my-2">{children}</ul>,
        ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1 my-2">{children}</ol>,
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto rounded-md border border-white/10">
            <table className="w-full border-collapse text-sm">{children}</table>
          </div>
        ),
        thead: ({ children }) => <thead className="bg-white/5">{children}</thead>,
        th: ({ children }) => (
          <th className="px-3 py-2 text-left font-semibold border-b border-white/10 whitespace-nowrap">{children}</th>
        ),
        td: ({ children }) => <td className="px-3 py-2 border-b border-white/10 align-top">{children}</td>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
