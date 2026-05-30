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
  "SaaS app on AWS — Next.js, FastAPI, Postgres, Redis, ~5K users",
  "E-commerce on GCP — Cloud Run, Firestore, Pub/Sub, CDN",
  "ML API on AWS — GPU inference, S3 data lake, auto-scaling",
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
  onTerraformReady: (terraform: string, diagram: DiagramData) => void;
  onFirstMessage: (msg: string) => void;
  onReset: () => void;
}

export const ChatPanel = forwardRef<ChatPanelHandle, ChatPanelProps>(
  function ChatPanel({ onGenerating, onDiagramReady, onTerraformReady, onFirstMessage, onReset }, ref) {
    const [messages, setMessages] = useState<Message[]>([WELCOME]);
    const [history, setHistory] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showRefinementChips, setShowRefinementChips] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const msgCounter = useRef(0);
    const currentDiagramRef = useRef<DiagramData | null>(null);

    useEffect(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    const sendMessage = async (text: string) => {
      if (!text.trim() || isLoading) return;

      if (history.length === 0) onFirstMessage(text.trim());

      const msgId = `msg-${++msgCounter.current}`;
      const userMsg: Message = { id: msgId, role: "user", content: text.trim() };
      const newHistory: ChatMessage[] = [...history, { role: "user", content: text.trim() }];

      setMessages((prev) => [...prev, userMsg]);
      setHistory(newHistory);
      setInput("");
      setIsLoading(true);
      setShowRefinementChips(false);
      onGenerating(true);

      try {
        const res = await fetch("/api/forge", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: newHistory }),
        });

        const data: ForgeResponse = await res.json();
        onGenerating(false);

        if (data.type === "error") {
          appendAssistant(data.content ?? "Something went wrong. Please try again.");
          setIsLoading(false);
          return;
        }

        if (data.type === "question") {
          const content = data.content ?? "";
          appendAssistant(content);
          setHistory((h) => [...h, { role: "assistant", content }]);
        }

        if (data.type === "diagram") {
          const summary = data.summary ?? "Architecture designed.";
          const diagram = data.diagram ?? "";
          const isRefinement = history.some((m) => m.content.includes("Mermaid diagram:"));

          appendAssistant(
            `${summary}\n\nReview the diagram on the right. When you're happy with it, click **Confirm** or say "looks good".`,
            isRefinement ? "update" : "diagram"
          );

          setHistory((h) => [
            ...h,
            { role: "assistant", content: `Architecture designed.\nSummary: ${summary}\n\nMermaid diagram:\n${diagram}` },
          ]);

          currentDiagramRef.current = { summary, diagram };
          onDiagramReady({ summary, diagram }, isRefinement);
        }

        if (data.type === "terraform") {
          appendAssistant(
            "Terraform is ready. Switch to the Terraform tab to copy or download it.",
            "terraform"
          );
          setHistory((h) => [
            ...h,
            { role: "assistant", content: "Terraform infrastructure code has been generated for the above architecture." },
          ]);
          onTerraformReady(
            data.terraform ?? "",
            currentDiagramRef.current ?? { summary: "", diagram: "" }
          );
          setShowRefinementChips(true);
        }
      } catch {
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
      currentDiagramRef.current = null;
      onReset();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage(input);
      }
    };

    return (
      <div className="flex flex-col h-full bg-card/30">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="h-3.5 w-3.5 text-primary" />
            <span className="text-xs font-medium text-muted-foreground">AI Architect</span>
            <Badge variant="default" className="text-[9px]">GLM-5</Badge>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <RotateCcw className="h-3 w-3" />
            Reset
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}
          {isLoading && <ThinkingBubble />}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && !isLoading && (
          <div className="px-4 pb-3">
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest mb-2">
              Examples
            </p>
            <div className="flex flex-col gap-1.5">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(prompt)}
                  className="flex items-start gap-2 p-2.5 rounded-lg border border-border/40 bg-card/30 hover:bg-card hover:border-primary/30 text-left transition-all group"
                >
                  <ChevronRight className="h-3 w-3 text-primary/60 shrink-0 mt-0.5" />
                  <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors leading-relaxed">
                    {prompt}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {showRefinementChips && !isLoading && (
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Zap className="h-3 w-3 text-primary" />
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">
                Refine architecture
              </p>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {REFINEMENT_CHIPS.map((chip, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(chip)}
                  className="px-2.5 py-1 rounded-lg border border-border/40 bg-card/30 hover:bg-card hover:border-primary/40 text-xs text-muted-foreground hover:text-primary transition-all"
                >
                  {chip}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t border-border/40">
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
              className="pr-12 bg-input/50 border-border/40"
              disabled={isLoading}
            />
            <Button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="absolute bottom-3 right-3 h-7 w-7 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground"
            >
              <Send className="h-3.5 w-3.5" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
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
      color: "text-primary",
      border: "border-primary/20",
      bg: "border-primary/30",
    },
    update: {
      label: "Diagram Updated",
      color: "text-accent",
      border: "border-accent/20",
      bg: "border-accent/30",
    },
    terraform: {
      label: "Terraform Ready",
      color: "text-emerald-400",
      border: "border-emerald-900/30",
      bg: "border-emerald-800/30",
    },
  };

  const tag = message.tag ? tagConfig[message.tag] : null;

  return (
    <div className={cn("flex gap-3", isUser && "flex-row-reverse")}>
      <div
        className={cn(
          "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary/20 border border-primary/30"
            : "bg-primary/10 border border-primary/20"
        )}
      >
        {isUser ? (
          <User className="h-3.5 w-3.5 text-primary" />
        ) : (
          <Cpu className="h-3.5 w-3.5 text-primary" />
        )}
      </div>

      <div className={cn("flex flex-col gap-1 max-w-[85%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/10"
              : "bg-card/60 backdrop-blur-sm border border-border/40 text-card-foreground rounded-tl-sm",
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
      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
        <Cpu className="h-3.5 w-3.5 text-primary" />
      </div>
      <div className="flex items-center gap-1 px-4 py-3 rounded-2xl rounded-tl-sm bg-card/60 backdrop-blur-sm border border-border/40">
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
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
