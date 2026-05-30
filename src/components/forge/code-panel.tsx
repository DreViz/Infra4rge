"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, Download, FileCode, Code } from "lucide-react";

const PLACEHOLDER = `# Describe your infrastructure in the chat
# to generate Terraform code here.`;

interface CodePanelProps {
  isGenerating: boolean;
  terraform: string | null;
}

export function CodePanel({ isGenerating, terraform }: CodePanelProps) {
  const [copied, setCopied] = useState(false);
  const code = terraform ?? PLACEHOLDER;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "main.tf";
    a.click();
    URL.revokeObjectURL(url);
  };

  const lineCount = code.split("\n").length;
  const resourceCount = (code.match(/^resource\s+"/gm) ?? []).length;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2">
          <FileCode className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-xs font-medium text-muted-foreground">main.tf</span>
          {isGenerating && (
            <Badge variant="yellow">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Generating...
            </Badge>
          )}
          {!isGenerating && terraform && <Badge variant="green">Ready</Badge>}
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={handleCopy} className="h-7 gap-1.5" disabled={!terraform}>
            {copied ? (
              <><Check className="h-3 w-3 text-emerald-400" /><span className="text-xs text-emerald-400">Copied</span></>
            ) : (
              <><Copy className="h-3 w-3" /><span className="text-xs">Copy</span></>
            )}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleDownload} className="h-7 w-7" disabled={!terraform}>
            <Download className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-48 gap-4">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
              <span className="h-2 w-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
            </div>
            <p className="text-sm text-muted-foreground">Writing Terraform...</p>
          </div>
        ) : !terraform ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border/40">
              <Code className="h-6 w-6 text-muted-foreground/40" />
            </div>
            <p className="text-sm text-muted-foreground">Terraform will appear here after generation</p>
          </div>
        ) : (
          <pre className="code-block p-5 text-muted-foreground overflow-x-auto">
            <TerraformHighlight code={code} />
          </pre>
        )}
      </div>

      {terraform && !isGenerating && (
        <div className="px-4 py-3 border-t border-border/40 flex items-center gap-4 shrink-0">
          {resourceCount > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Resources</span>
              <Badge variant="default">{resourceCount}</Badge>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Lines</span>
            <Badge variant="default">{lineCount}</Badge>
          </div>
        </div>
      )}
    </div>
  );
}

function TerraformHighlight({ code }: { code: string }) {
  const lines = code.split("\n");
  return (
    <>
      {lines.map((line, i) => (
        <div key={i} className="flex">
          <span className="select-none w-10 shrink-0 text-right pr-4 text-muted-foreground/40 text-[11px] leading-6">
            {i + 1}
          </span>
          <span className="leading-6 whitespace-pre">
            <HighlightLine line={line} />
          </span>
        </div>
      ))}
    </>
  );
}

function HighlightLine({ line }: { line: string }) {
  if (line.trim().startsWith("#")) {
    return <span className="text-muted-foreground/50">{line}</span>;
  }
  const blockMatch = line.match(/^(resource|variable|provider|data|output|terraform|module|locals)\s+"([^"]+)"(?:\s+"([^"]+)")?/);
  if (blockMatch) {
    return (
      <>
        <span className="text-primary">{blockMatch[1]}</span>
        <span className="text-muted-foreground/60">{" \""}</span>
        <span className="text-accent">{blockMatch[2]}</span>
        <span className="text-muted-foreground/60">{"\" "}</span>
        {blockMatch[3] && (
          <>
            <span className="text-muted-foreground/60">{"\""}</span>
            <span className="text-emerald-400">{blockMatch[3]}</span>
            <span className="text-muted-foreground/60">{"\" "}</span>
          </>
        )}
        <span className="text-muted-foreground/60">{"{"}</span>
      </>
    );
  }
  const kvMatch = line.match(/^(\s+)(\w+)\s*=\s*(.+)/);
  if (kvMatch) {
    return (
      <>
        <span>{kvMatch[1]}</span>
        <span className="text-card-foreground">{kvMatch[2]}</span>
        <span className="text-muted-foreground/60">{" = "}</span>
        <ValueHighlight value={kvMatch[3]} />
      </>
    );
  }
  return <span className="text-muted-foreground">{line}</span>;
}

function ValueHighlight({ value }: { value: string }) {
  if (value.startsWith('"') || value.includes("${")) return <span className="text-emerald-400">{value}</span>;
  if (!isNaN(Number(value))) return <span className="text-accent">{value}</span>;
  if (value === "true" || value === "false") return <span className="text-yellow-400">{value}</span>;
  return <span className="text-muted-foreground">{value}</span>;
}
