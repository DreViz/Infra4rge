"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ZoomIn, ZoomOut, CheckCircle, ArrowRight, Network } from "lucide-react";
import type { ForgeStage } from "./workspace";

interface DiagramPanelProps {
  isGenerating: boolean;
  diagram: string | null;
  summary: string | null;
  stage: ForgeStage;
  isRefinement: boolean;
  onConfirm: () => void;
}

export function DiagramPanel({ isGenerating, diagram, summary, stage, isRefinement, onConfirm }: DiagramPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rendered, setRendered] = useState(false);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (!diagram || isGenerating) return;
    let cancelled = false;

    const render = async () => {
      setRendered(false);
      if (typeof window === "undefined") return;
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          primaryColor: "#c4b5fd",
          primaryTextColor: "#1a1a1a",
          primaryBorderColor: "#7c3aed",
          lineColor: "#64748b",
          secondaryColor: "#93c5fd",
          tertiaryColor: "#6ee7b7",
          background: "#f8fafc",
          mainBkg: "#f1f5f9",
          nodeBorder: "#94a3b8",
          clusterBkg: "#f1f5f9",
          clusterBorder: "#cbd5e1",
          titleColor: "#0f172a",
          edgeLabelBackground: "#f8fafc",
          fontFamily: "var(--font-geist-sans), sans-serif",
          fontSize: "13px",
        },
        flowchart: { curve: "basis", padding: 24 },
      });

      if (!containerRef.current || cancelled) return;

      try {
        const id = `mermaid-${String(performance.now()).replace(".", "")}`;
        const { svg } = await mermaid.render(id, diagram);
        if (containerRef.current && !cancelled) {
          containerRef.current.innerHTML = svg;
          const svgEl = containerRef.current.querySelector("svg");
          if (svgEl) {
            svgEl.style.maxWidth = "100%";
            svgEl.style.height = "auto";
          }
          setRendered(true);
        }
      } catch (e) {
        console.warn("[Diagram] Mermaid render error:", e);
        if (containerRef.current && !cancelled) {
          containerRef.current.innerHTML = `
            <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:200px;gap:12px;padding:20px;text-align:center">
              <p style="color:var(--muted-foreground);font-size:13px;font-weight:500">Diagram syntax error</p>
              <p style="color:var(--muted-foreground);font-size:12px;opacity:0.6">Try asking the AI to regenerate the diagram</p>
            </div>`;
          setRendered(true);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [diagram, isGenerating]);

  useEffect(() => {
    if (!diagram) {
      Promise.resolve().then(() => setRendered(false));
    }
  }, [diagram]);

  const handleDownload = () => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;

    const bbox = svgEl.getBoundingClientRect();
    const width = Math.max(bbox.width, 400);
    const height = Math.max(bbox.height, 300);
    const scale = 2;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgData)))}`;

    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.scale(scale, scale);
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "architecture.png";
        a.click();
        URL.revokeObjectURL(url);
      }, "image/png");
    };
    img.src = dataUrl;
  };

  const showEmpty = !diagram && !isGenerating;
  const showDiagram = diagram && !isGenerating;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">Architecture</span>
          {isGenerating && (
            <Badge variant="yellow">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Generating...
            </Badge>
          )}
          {!isGenerating && diagram && stage !== "complete" && (
            <Badge variant="default">Review</Badge>
          )}
          {stage === "complete" && (
            <Badge variant="green">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Confirmed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} className="h-7 w-7" disabled={showEmpty}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-muted-foreground w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} className="h-7 w-7" disabled={showEmpty}>
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-border mx-1" />
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 gap-1.5" disabled={!rendered || isGenerating || !diagram}>
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs">PNG</span>
          </Button>
        </div>
      </div>

      <div className={`flex-1 overflow-auto ${showDiagram ? "p-6 bg-[#f1f5f9]" : "bg-background"}`}>
        {isGenerating && <GeneratingState />}
        {showEmpty && <EmptyState />}
        {showDiagram && (
          !rendered ? (
            <div>
              <div ref={containerRef} className="hidden" />
              <RenderingState />
            </div>
          ) : (
            <div
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              className="transition-transform duration-200"
            >
              <div ref={containerRef} className="flex items-center justify-center min-h-[200px]" />
            </div>
          )
        )}
      </div>

      {!isGenerating && (
        <div className="border-t border-border/40 shrink-0 bg-background/80 backdrop-blur-xl">
          {summary && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-muted-foreground leading-relaxed">{summary}</p>
            </div>
          )}
          {stage === "diagram_ready" && (
            <div className="px-4 pb-4 pt-2">
              <Button onClick={onConfirm} variant="glow" className="w-full group">
                <CheckCircle className="h-4 w-4" />
                {isRefinement ? "Looks good — Regenerate Terraform" : "Confirm Architecture & Generate Terraform"}
                <ArrowRight className="h-4 w-4 ml-auto transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          )}
          {stage === "generating_terraform" && (
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-center gap-2 h-9 rounded-lg bg-primary/10 border border-primary/20">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
                <span className="text-xs text-primary ml-1">Writing Terraform...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 select-none">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
        <Network className="h-8 w-8 text-primary/40" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-muted-foreground">
          Architecture diagram will appear here
        </p>
        <p className="text-xs text-muted-foreground/60 max-w-[220px] leading-relaxed">
          Describe your app in the chat to generate a live diagram
        </p>
      </div>
    </div>
  );
}

function RenderingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="h-4 w-4 text-muted-foreground animate-spin" />
      <p className="text-xs text-muted-foreground">Rendering...</p>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-primary/60 animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-xs text-muted-foreground tracking-wide">Designing your architecture...</p>
    </div>
  );
}
