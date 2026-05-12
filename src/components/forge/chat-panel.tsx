"use client";

import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Send, Sparkles, User, Cpu, RotateCcw, ChevronRight, Zap } from "lucide-react";
import type { DiagramData } from "./workspace";
import type { ChatMessage, ForgeResponse } from "@/app/api/forge/route";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  tag?: "diagram" | "terraform" | "update";
}

const EXAMPLE_PROMPTS = [
  "A SaaS project management tool like Linear — Next.js frontend, FastAPI backend, PostgreSQL, Redis on AWS, ~5000 users, cost-optimized",
  "Microservices e-commerce platform on GCP with Kubernetes, API gateway, Pub/Sub queue, ~50K daily users",
  "Real-time ML inference API on AWS with GPU instances, S3 data lake, auto-scaling, low-latency serving",
];

const REFINEMENT_CHIPS = [
  "Add Redis caching layer",
  "Make the database highly available",
  "Add a CDN in front",
  "Switch to serverless (Lambda)",
  "Add S3 for file uploads",
  "Make it multi-region",
  "Add a message queue",
  "Add auto-scaling",
];

const WELCOME: Message = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! Describe what you want to build — the more detail you give, the faster I can generate your architecture.\n\nI'll only ask follow-up questions if something critical is missing.",
};

export interface ChatPanelHandle {
  sendMessage: (text: string) => void;
}

interface ChatPanelProps {
  onGenerating: (generating: boolean) => void;
  onDiagramReady: (data: DiagramData, isRefinement: boolean) => void;
  onTerraformReady: (terraform: string) => void;
  onReset: () => void;
}

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
  function ChatPanel({ onGenerating, onDiagramReady, onTerraformReady, onReset }, ref) {
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRefinementChips, setShowRefinementChips] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const msgCounter = useRef(0);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const sendMessage = async (text: string) => {
      if (!text.trim() || isLoading) return;

      const msgId = `msg-${++msgCounter.current}`;
      const userMsg: Message = {
        id: msgId,
        role: "user",
        content: text.trim(),
      };
      const newHistory: ChatMessage[] = [
        ...history,
        { role: "user", content: text.trim() },
      ];

      setMessages((prev) => [...prev, userMsg]);
      setHistory(newHistory);
      setInput("");
      setIsLoading(true);
      setShowRefinementChips(false);
      onGenerating(true);

      try {
        console.log("[Chat] sending to API, history length:", newHistory.length);

        const res = await fetch("/api/forge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newHistory }),
        });

        console.log("[Chat] API status:", res.status);
        const data: ForgeResponse = await res.json();
        console.log("[Chat] response type:", data.type, "| has diagram:", !!data.diagram, "| has terraform:", !!data.terraform);

        onGenerating(false);

        if (data.type === "error") {
          console.error("[Chat] error from API:", data.content);
          appendAssistant(data.content ?? "Something went wrong. Please try again.");
          setIsLoading(false);
          return;
        }

        if (data.type === "question") {
          console.log("[Chat] question received, content length:", data.content?.length);
          const content = data.content ?? "";
          appendAssistant(content);
          setHistory((h) => [...h, { role: "assistant", content }]);
        }

        if (data.type === "diagram") {
          const summary = data.summary ?? "Architecture designed.";
          const diagram = data.diagram ?? "";
          const isRefinement = history.some((m) => m.content.includes("Mermaid diagram:"));
          console.log("[Chat] diagram received, isRefinement:", isRefinement, "| diagram length:", diagram.length);

          appendAssistant(
            `${summary}\n\nReview the diagram on the right. When you're happy with it, click **Confirm** or say "looks good".`,
            isRefinement ? "update" : "diagram"
          );

          setHistory((h) => [
            ...h,
            {
              role: "assistant",
              content: `Architecture designed.\nSummary: ${summary}\n\nMermaid diagram:\n${diagram}`,
            },
          ]);

          onDiagramReady({ summary, diagram }, isRefinement);
        }

        if (data.type === "terraform") {
          console.log("[Chat] terraform received, length:", data.terraform?.length);
          appendAssistant(
            "Terraform is ready. Switch to the Terraform tab to copy or download it.",
            "terraform"
          );
          setHistory((h) => [
            ...h,
            {
              role: "assistant",
              content: "Terraform infrastructure code has been generated for the above architecture.",
            },
          ]);
          onTerraformReady(data.terraform ?? "");
          setShowRefinementChips(true);
        }
      } catch (err) {
        console.error("[Chat] fetch error:", err);
        onGenerating(false);
        appendAssistant("Network error. Please check your connection and try again.");
      }

      setIsLoading(false);
    };

    const appendAssistant = (content: string, tag?: Message["tag"]) => {
      const id = `msg-${++msgCounter.current}`;
      setMessages((prev) => [...prev, { id, role: "assistant", content, tag }]);
    };

    useImperativeHandle(ref, () => ({ sendMessage }));

    const handleReset = () => {
      setMessages([WELCOME]);
      setHistory([]);
      setInput("");
      setIsLoading(false);
      setShowRefinementChips(false);
      onReset();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    };

    return (
      <div className="flex flex-col h-full bg-[#0a0a0a]">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-violet-400" />
            <span className="text-xs font-medium text-[#a1a1aa]">AI Architect</span>
            <Badge variant="violet" className="text-[9px]">GLM-5</Badge>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-[#52525b] hover:text-[#a1a1aa] transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <ThinkingBubble />}
          <div ref={messagesEndRef} />
        </div>

        {/* Example prompts — only at very start */}
        {messages.length === 1 && !isLoading && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-[#3f3f46] uppercase tracking-widest mb-2">
              Examples
            </p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-start gap-2 p-2.5 rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] hover:bg-[#111] hover:border-[#2a2a2a] text-left transition-all group"
                >
                  <ChevronRight className="h-3 w-3 text-violet-600 shrink-0 mt-0.5" />
                  <span className="text-xs text-[#71717a] group-hover:text-[#a1a1aa] transition-colors leading-relaxed">
                    {prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Refinement chips — shown after terraform is generated */}
        {showRefinementChips && !isLoading && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-violet-400" />
              <p className="text-[10px] text-[#3f3f46] uppercase tracking-widest">
                Refine architecture
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REFINEMENT_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(chip)}
                  className="px-2.5 py-1 rounded-lg border border-[#1e1e1e] bg-[#0e0e0e] hover:bg-[#111] hover:border-violet-800/40 text-xs text-[#71717a] hover:text-violet-300 transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="p-4 border-t border-[#1a1a1a]">
          <div className="relative">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                showRefinementChips
                  ? "Ask to modify the architecture..."
                  : "Describe your infrastructure..."
              }
              rows={3}
              className="pr-12 bg-[#111] border-[#222]"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute bottom-3 right-3 h-7 w-7 rounded-lg"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-[#3f3f46] mt-2 text-center">
            ⏎ send · Shift+⏎ new line
          </p>
        </div>
      </div>
    );
  }
);

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === "user";

  const tagConfig: Record<
    NonNullable<Message["tag"]>,
    { label: string; color: string; border: string; bg: string }
  > = {
    diagram: {
      label: "Diagram Ready",
      color: "text-violet-400",
      border: "border-violet-900/30",
      bg: "bg-violet-950/10 border-violet-900/40",
    },
    update: {
      label: "Diagram Updated",
      color: "text-cyan-400",
      border: "border-cyan-900/30",
      bg: "bg-cyan-950/10 border-cyan-900/40",
    },
    terraform: {
      label: "Terraform Ready",
      color: "text-emerald-400",
      border: "border-emerald-900/30",
      bg: "bg-emerald-950/10 border-emerald-900/40",
    },
  };

  const tag = message.tag ? tagConfig[message.tag] : null;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-[#1a1a1a] border border-[#2a2a2a]"
            : "bg-violet-950/60 border border-violet-800/40"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-[#a1a1aa]" />
        ) : (
          <Cpu className="h-3.5 w-3.5 text-violet-400" />
        )}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-violet-600/90 text-white rounded-tr-sm"
              : "bg-[#111] border border-[#1e1e1e] text-[#e4e4e7] rounded-tl-sm",
            tag?.bg
          )}
        >
          {tag && (
            <div
              className={cn(
                "flex items-center gap-1.5 mb-2 pb-2 border-b text-[10px] font-medium uppercase tracking-wider",
                tag.color,
                tag.border
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-current" />
              {tag.label}
            </div>
          )}
          <FormattedContent content={message.content} />
        </div>
      </div>
    </div>
  );
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3">
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-950/60 border border-violet-800/40">
        <Cpu className="h-3.5 w-3.5 text-violet-400" />
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-[#111] border border-[#1e1e1e]">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
      </div>
    </div>
  );
}

function FormattedContent({ content }: { content: string }) {
  const parts = content.split(/(\*\*[^*]+\*\*|\n)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith("**") && part.endsWith("**"))
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        if (part === "\n") return <br key={i} />;
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}
