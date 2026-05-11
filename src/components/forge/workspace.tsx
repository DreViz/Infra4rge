"use client";

import { useState, useRef } from "react";
import { ChatPanel, type ChatPanelHandle } from "./chat-panel";
import { DiagramPanel } from "./diagram-panel";
import { CodePanel } from "./code-panel";
import { Badge } from "@/components/ui/badge";
import { Network, FileCode, DollarSign, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

export type ForgeStage = "idle" | "questioning" | "diagram_ready" | "generating_terraform" | "complete";

export type RightTab = "diagram" | "code" | "cost" | "security";

const RIGHT_TABS: { id: RightTab; label: string; icon: typeof Network; badge?: string }[] = [
  { id: "diagram", label: "Diagram", icon: Network },
  { id: "code", label: "Terraform", icon: FileCode },
  { id: "cost", label: "Cost", icon: DollarSign, badge: "Soon" },
  { id: "security", label: "Security", icon: Shield, badge: "Soon" },
];

export interface DiagramData {
  summary: string;
  diagram: string;
}

export function Workspace() {
  const [activeTab, setActiveTab] = useState<RightTab>("diagram");
  const [stage, setStage] = useState<ForgeStage>("idle");
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [terraform, setTerraform] = useState<string | null>(null);
  const chatRef = useRef<ChatPanelHandle>(null);

  const handleDiagramReady = (data: DiagramData) => {
    setDiagramData(data);
    setStage("diagram_ready");
    setActiveTab("diagram");
  };

  const handleTerraformReady = (tf: string) => {
    setTerraform(tf);
    setStage("complete");
    setActiveTab("code");
  };

  const handleGenerating = (isGenerating: boolean) => {
    if (isGenerating) {
      setStage("questioning");
      setActiveTab("diagram");
    }
  };

  const handleConfirmDiagram = () => {
    setStage("generating_terraform");
    chatRef.current?.sendMessage("The architecture looks good. Please generate the complete Terraform code now.");
  };

  const handleReset = () => {
    setStage("idle");
    setDiagramData(null);
    setTerraform(null);
    setActiveTab("diagram");
  };

  const isGeneratingDiagram = stage === "questioning";
  const isGeneratingTerraform = stage === "generating_terraform";

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left — Chat */}
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#1a1a1a] overflow-hidden">
        <ChatPanel
          ref={chatRef}
          onGenerating={handleGenerating}
          onDiagramReady={handleDiagramReady}
          onTerraformReady={handleTerraformReady}
          onReset={handleReset}
        />
      </div>

      {/* Right pane */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 border-b border-[#1a1a1a] bg-[#080808] shrink-0">
          {RIGHT_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = !!tab.badge;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
                className={cn(
                  "flex items-center gap-2 px-3 py-3 text-xs font-medium border-b-2 transition-colors",
                  isActive
                    ? "border-violet-500 text-[#fafafa]"
                    : "border-transparent text-[#52525b] hover:text-[#a1a1aa]",
                  isDisabled && "cursor-not-allowed opacity-40"
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {tab.label}
                {tab.badge && (
                  <Badge variant="default" className="text-[9px] px-1 py-0">{tab.badge}</Badge>
                )}
              </button>
            );
          })}

          {stage === "complete" && (
            <div className="ml-auto flex items-center gap-2 pr-1">
              <Badge variant="green">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Complete
              </Badge>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {activeTab === "diagram" && (
            <DiagramPanel
              isGenerating={isGeneratingDiagram}
              diagram={diagramData?.diagram ?? null}
              summary={diagramData?.summary ?? null}
              stage={stage}
              onConfirm={handleConfirmDiagram}
            />
          )}
          {activeTab === "code" && (
            <CodePanel
              isGenerating={isGeneratingTerraform}
              terraform={terraform}
            />
          )}
          {(activeTab === "cost" || activeTab === "security") && (
            <ComingSoonPanel tab={activeTab} />
          )}
        </div>
      </div>
    </div>
  );
}

function ComingSoonPanel({ tab }: { tab: string }) {
  const config = {
    cost: {
      icon: DollarSign,
      title: "Cost Estimation",
      description: "Monthly cost breakdown per resource with optimization recommendations.",
      color: "text-yellow-400",
      bg: "bg-yellow-950/20",
      border: "border-yellow-900/30",
    },
    security: {
      icon: Shield,
      title: "Security Audit",
      description: "Automated Checkov scanning with security score and one-click auto-fix.",
      color: "text-emerald-400",
      bg: "bg-emerald-950/20",
      border: "border-emerald-900/30",
    },
  }[tab] ?? { icon: DollarSign, title: "Coming Soon", description: "", color: "text-[#a1a1aa]", bg: "bg-[#111]", border: "border-[#222]" };

  const Icon = config.icon;
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
      <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl border", config.bg, config.border)}>
        <Icon className={cn("h-6 w-6", config.color)} />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-sm font-semibold text-[#fafafa]">{config.title}</h3>
        <p className="text-sm text-[#71717a] max-w-xs leading-relaxed">{config.description}</p>
      </div>
      <Badge variant="default" className="mt-2">Coming in Phase 2</Badge>
    </div>
  );
}
