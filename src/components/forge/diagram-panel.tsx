"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ZoomIn, ZoomOut, CheckCircle, ArrowRight } from "lucide-react";
import type { ForgeStage } from "./workspace";

const PLACEHOLDER_DIAGRAM = `graph TB
    A["💬 Describe your app in the chat →\nto generate your architecture diagram"]
    style A fill:#ede9fe,color:#1a1a1a,stroke:#7c3aed`;

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

  const diagramSource = diagram ?? PLACEHOLDER_DIAGRAM;

  useEffect(() => {
    let cancelled = false;

    const render = async () => {
      setRendered(false);
      if (typeof window === "undefined") return;
      const mermaid = (await import("mermaid")).default;

      mermaid.initialize({
        startOnLoad: false,
        theme: "base",
        themeVariables: {
          // Vibrant defaults — nodes will be overridden by classDef from AI
          primaryColor: "#c4b5fd",        // violet — compute
          primaryTextColor: "#1a1a1a",
          primaryBorderColor: "#7c3aed",
          lineColor: "#64748b",
          secondaryColor: "#93c5fd",      // blue — database
          tertiaryColor: "#6ee7b7",       // green — cache
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
        const id = `mermaid-${Date.now()}`;
        const { svg } = await mermaid.render(id, diagramSource);
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
        console.error("Mermaid render error:", e);
        if (containerRef.current && !cancelled) {
          containerRef.current.innerHTML = `<p style="color:#71717a;padding:16px;font-size:13px">Diagram render failed — AI returned malformed Mermaid syntax.</p>`;
          setRendered(true);
        }
      }
    };

    if (!isGenerating) render();
    return () => { cancelled = true; };
  }, [diagramSource, isGenerating]);

  const handleDownload = () => {
    const svgEl = containerRef.current?.querySelector("svg");
    if (!svgEl) return;

    const bbox = svgEl.getBoundingClientRect();
    const width = Math.max(bbox.width, 400);
    const height = Math.max(bbox.height, 300);
    const scale = 2;

    // Use base64 data URL — blob URLs taint the canvas and block toBlob()
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-[#a1a1aa]">Architecture</span>
          {isGenerating && (
            <Badge variant="yellow">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 animate-pulse" />
              Generating...
            </Badge>
          )}
          {!isGenerating && diagram && stage !== "complete" && (
            <Badge variant="violet">Review</Badge>
          )}
          {stage === "complete" && (
            <Badge variant="green">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Confirmed
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} className="h-7 w-7">
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-[#52525b] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} className="h-7 w-7">
            <ZoomIn className="h-3.5 w-3.5" />
          </Button>
          <div className="w-px h-4 bg-[#222] mx-1" />
          <Button variant="ghost" size="sm" onClick={handleDownload} className="h-7 gap-1.5" disabled={!rendered || isGenerating || !diagram}>
            <Download className="h-3.5 w-3.5" />
            <span className="text-xs">PNG</span>
          </Button>
        </div>
      </div>

      {/* Diagram area */}
      <div className="flex-1 overflow-auto p-6 bg-[#f1f5f9]">
        {isGenerating ? (
          <GeneratingState />
        ) : !rendered ? (
          <div>
            <div ref={containerRef} className="hidden" />
            <LoadingState />
          </div>
        ) : (
          <div
            style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
            className="transition-transform duration-200"
          >
            <div ref={containerRef} className="flex items-center justify-center min-h-[200px]" />
          </div>
        )}
      </div>

      {/* Summary + confirm button */}
      {!isGenerating && (
        <div className="border-t border-[#1a1a1a] shrink-0 bg-[#080808]">
          {summary && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-[#71717a] leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Confirm button — only shown when diagram is ready and terraform not yet generated */}
          {stage === "diagram_ready" && (
            <div className="px-4 pb-4 pt-2">
              <Button onClick={onConfirm} variant="glow" className="w-full group">
                <CheckCircle className="h-4 w-4" />
                {isRefinement
                  ? "Looks good — Regenerate Terraform"
                  : "Confirm Architecture & Generate Terraform"}
                <ArrowRight className="h-4 w-4 ml-auto transition-transform group-hover:translate-x-0.5" />
              </Button>
            </div>
          )}

          {stage === "generating_terraform" && (
            <div className="px-4 pb-4 pt-2">
              <div className="flex items-center justify-center gap-2 h-9 rounded-lg bg-violet-950/30 border border-violet-800/30">
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:0ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:150ms]" />
                <span className="h-1.5 w-1.5 rounded-full bg-violet-500 animate-bounce [animation-delay:300ms]" />
                <span className="text-xs text-violet-400 ml-1">Writing Terraform...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="h-5 w-5 text-[#aaa] animate-spin" />
      <p className="text-xs text-[#888]">Rendering diagram...</p>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:0ms]" />
        <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:150ms]" />
        <span className="h-2 w-2 rounded-full bg-violet-400 animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-sm text-[#888]">Designing your architecture...</p>
    </div>
  );
}
