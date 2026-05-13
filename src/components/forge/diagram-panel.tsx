"use client";

import { useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw, ZoomIn, ZoomOut, CheckCircle, ArrowRight } from "lucide-react";
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
        console.error("Mermaid render error:", e);
        if (containerRef.current && !cancelled) {
          containerRef.current.innerHTML = `<p style="color:#71717a;padding:16px;font-size:13px">Diagram render failed — AI returned malformed Mermaid syntax.</p>`;
          setRendered(true);
        }
      }
    };

    render();
    return () => { cancelled = true; };
  }, [diagram, isGenerating]);

  // Reset rendered state when diagram is cleared
  useEffect(() => {
    if (!diagram) {
      // Use a microtask to avoid synchronous setState in effect
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
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.max(0.4, z - 0.15))} className="h-7 w-7" disabled={showEmpty}>
            <ZoomOut className="h-3.5 w-3.5" />
          </Button>
          <span className="text-xs text-[#52525b] w-10 text-center">{Math.round(zoom * 100)}%</span>
          <Button variant="ghost" size="icon" onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))} className="h-7 w-7" disabled={showEmpty}>
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
      <div className={`flex-1 overflow-auto ${showDiagram ? "p-6 bg-[#f1f5f9]" : "bg-[#080808]"}`}>
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

      {/* Footer: summary + confirm */}
      {!isGenerating && (
        <div className="border-t border-[#1a1a1a] shrink-0 bg-[#080808]">
          {summary && (
            <div className="px-4 pt-3 pb-2">
              <p className="text-xs text-[#71717a] leading-relaxed">{summary}</p>
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

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-8 select-none">
      {/* Ghost architecture illustration */}
      <svg width="640" height="400" viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Connection lines */}
        <line x1="160" y1="44" x2="100" y2="96" stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="4 3"/>
        <line x1="160" y1="44" x2="220" y2="96" stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="4 3"/>
        <line x1="100" y1="116" x2="100" y2="148" stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="4 3"/>
        <line x1="220" y1="116" x2="220" y2="148" stroke="#2a2a2a" strokeWidth="1.5" strokeDasharray="4 3"/>
        <line x1="100" y1="116" x2="220" y2="148" stroke="#1e1e1e" strokeWidth="1" strokeDasharray="3 4"/>

        {/* Top node — Load Balancer */}
        <rect x="120" y="18" width="80" height="26" rx="6" fill="#7c3aed" fillOpacity="0.08" stroke="#7c3aed" strokeOpacity="0.25" strokeWidth="1"/>
        <rect x="134" y="26" width="28" height="4" rx="2" fill="#7c3aed" fillOpacity="0.25"/>
        <rect x="166" y="26" width="18" height="4" rx="2" fill="#7c3aed" fillOpacity="0.15"/>

        {/* Middle left — App Server */}
        <rect x="60" y="96" width="80" height="26" rx="6" fill="#c4b5fd" fillOpacity="0.06" stroke="#7c3aed" strokeOpacity="0.2" strokeWidth="1"/>
        <rect x="74" y="104" width="22" height="4" rx="2" fill="#c4b5fd" fillOpacity="0.2"/>
        <rect x="100" y="104" width="14" height="4" rx="2" fill="#c4b5fd" fillOpacity="0.12"/>

        {/* Middle right — App Server */}
        <rect x="180" y="96" width="80" height="26" rx="6" fill="#c4b5fd" fillOpacity="0.06" stroke="#7c3aed" strokeOpacity="0.2" strokeWidth="1"/>
        <rect x="194" y="104" width="22" height="4" rx="2" fill="#c4b5fd" fillOpacity="0.2"/>
        <rect x="220" y="104" width="14" height="4" rx="2" fill="#c4b5fd" fillOpacity="0.12"/>

        {/* Bottom left — Database */}
        <rect x="60" y="148" width="80" height="26" rx="6" fill="#3b82f6" fillOpacity="0.06" stroke="#3b82f6" strokeOpacity="0.2" strokeWidth="1"/>
        <rect x="74" y="156" width="18" height="4" rx="2" fill="#3b82f6" fillOpacity="0.2"/>
        <rect x="96" y="156" width="28" height="4" rx="2" fill="#3b82f6" fillOpacity="0.12"/>

        {/* Bottom right — Cache */}
        <rect x="180" y="148" width="80" height="26" rx="6" fill="#059669" fillOpacity="0.06" stroke="#059669" strokeOpacity="0.2" strokeWidth="1"/>
        <rect x="194" y="156" width="24" height="4" rx="2" fill="#059669" fillOpacity="0.2"/>
        <rect x="222" y="156" width="16" height="4" rx="2" fill="#059669" fillOpacity="0.12"/>
      </svg>

      {/* Text */}
      <div className="flex flex-col items-center gap-2 text-center">
        <p className="text-sm font-medium text-[#3f3f46] tracking-tight">
          Architecture diagram will appear here
        </p>
        <p className="text-xs text-[#2a2a2a] max-w-[220px] leading-relaxed">
          Describe your app in the chat to generate a live diagram
        </p>
      </div>
    </div>
  );
}

function RenderingState() {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-3">
      <RefreshCw className="h-4 w-4 text-[#94a3b8] animate-spin" />
      <p className="text-xs text-[#94a3b8]">Rendering...</p>
    </div>
  );
}

function GeneratingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-5">
      <div className="flex items-center gap-1.5">
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60 animate-bounce [animation-delay:0ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60 animate-bounce [animation-delay:150ms]" />
        <span className="h-1.5 w-1.5 rounded-full bg-violet-500/60 animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="text-xs text-[#52525b] tracking-wide">Designing your architecture...</p>
    </div>
  );
}
