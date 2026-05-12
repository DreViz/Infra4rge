"use client";

import { useState, useRef, useCallback } from "react";
import { ChatPanel, type ChatPanelHandle } from "./chat-panel";
import { DiagramPanel } from "./diagram-panel";
import { CodePanel } from "./code-panel";
import { CostPanel } from "./cost-panel";
import { SecurityPanel } from "./security-panel";
import { Badge } from "@/components/ui/badge";
import { Network, FileCode, DollarSign, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CostEstimate } from "@/app/api/forge/cost/route";
import type { SecurityAudit } from "@/app/api/forge/security/route";

export type ForgeStage =
  | "idle"
  | "questioning"
  | "diagram_ready"
  | "generating_terraform"
  | "complete";

export type RightTab = "diagram" | "code" | "cost" | "security";

export interface DiagramData {
  summary: string;
  diagram: string;
}

export function Workspace() {
  const [activeTab, setActiveTab] = useState<RightTab>("diagram");
  const [stage, setStage] = useState<ForgeStage>("idle");
  const [isAILoading, setIsAILoading] = useState(false);
  const [diagramData, setDiagramData] = useState<DiagramData | null>(null);
  const [terraform, setTerraform] = useState<string | null>(null);
  const [iterationCount, setIterationCount] = useState(0);

  // Cost state
  const [costEstimate, setCostEstimate] = useState<CostEstimate | null>(null);
  const [costLoading, setCostLoading] = useState(false);
  const [costError, setCostError] = useState<string | null>(null);

  // Security state
  const [securityAudit, setSecurityAudit] = useState<SecurityAudit | null>(null);
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);

  const chatRef = useRef<ChatPanelHandle>(null);

  const fetchSecurityAudit = useCallback(async (tf: string) => {
    console.log("[Workspace] fetching security audit...");
    setSecurityLoading(true);
    setSecurityError(null);
    setSecurityAudit(null);
    try {
      const res = await fetch("/api/forge/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terraform: tf }),
      });
      const data = await res.json();
      console.log("[Workspace] security audit received, score:", data.audit?.score);
      if (data.error) setSecurityError(data.error);
      else setSecurityAudit(data.audit ?? null);
    } catch (err) {
      console.error("[Workspace] security fetch error:", err);
      setSecurityError("Failed to run security audit.");
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  const fetchCostEstimate = useCallback(async (tf: string) => {
    console.log("[Workspace] fetching cost estimate...");
    setCostLoading(true);
    setCostError(null);
    setCostEstimate(null);

    try {
      const res = await fetch("/api/forge/cost", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terraform: tf }),
      });
      const data = await res.json();
      console.log("[Workspace] cost estimate received:", data.estimate?.totalMonthly);
      if (data.error) setCostError(data.error);
      else setCostEstimate(data.estimate ?? null);
    } catch (err) {
      console.error("[Workspace] cost fetch error:", err);
      setCostError("Failed to estimate cost.");
    } finally {
      setCostLoading(false);
    }
  }, []);

  const handleDiagramReady = (data: DiagramData, isRefinement: boolean) => {
    console.log("[Workspace] diagram ready, isRefinement:", isRefinement);
    setDiagramData(data);
    setStage("diagram_ready");
    setIsAILoading(false);
    setActiveTab("diagram");
    if (isRefinement) {
      setTerraform(null);
      setCostEstimate(null);
      setSecurityAudit(null);
      setIterationCount((n) => n + 1);
    }
  };

  const handleTerraformReady = (tf: string) => {
    console.log("[Workspace] terraform ready, length:", tf.length);
    setTerraform(tf);
    setStage("complete");
    setIsAILoading(false);
    setActiveTab("code");
    // Auto-fetch cost + security in background (parallel)
    fetchCostEstimate(tf);
    fetchSecurityAudit(tf);
  };

  const handleGenerating = (isGenerating: boolean) => {
    console.log("[Workspace] AI loading:", isGenerating, "| stage:", stage);
    setIsAILoading(isGenerating);
    // Only move to "questioning" if we're not already mid-terraform-generation
    // Use functional update to read current stage without stale closure
    if (isGenerating) {
      setStage((prev) => prev === "generating_terraform" ? "generating_terraform" : "questioning");
    }
  };

  const handleConfirmDiagram = () => {
    setStage("generating_terraform");
    chatRef.current?.sendMessage(
      "The architecture looks good. Please generate the complete Terraform code now."
    );
  };

  const handleOptimize = (suggestion: string) => {
    setActiveTab("diagram");
    chatRef.current?.sendMessage(
      `Apply this cost optimization to the architecture: ${suggestion}`
    );
  };

  const handleSecurityFix = (instruction: string) => {
    setActiveTab("diagram");
    chatRef.current?.sendMessage(
      `Apply this security fix to the architecture and Terraform: ${instruction}`
    );
  };

  const handleReset = () => {
    console.log("[Workspace] reset");
    setStage("idle");
    setIsAILoading(false);
    setDiagramData(null);
    setTerraform(null);
    setIterationCount(0);
    setCostEstimate(null);
    setCostError(null);
    setCostLoading(false);
    setSecurityAudit(null);
    setSecurityError(null);
    setSecurityLoading(false);
    setActiveTab("diagram");
  };

  const isGeneratingDiagram = isAILoading && stage === "questioning";
  const isGeneratingTerraform = stage === "generating_terraform" && isAILoading;
  const isRefinement = iterationCount > 0;

  const tabs = [
    { id: "diagram" as const, label: "Diagram", icon: Network },
    { id: "code" as const, label: "Terraform", icon: FileCode },
    {
      id: "cost" as const,
      label: "Cost",
      icon: DollarSign,
      badge: costEstimate
        ? `$${costEstimate.totalMonthly.toFixed(0)}/mo`
        : costLoading
        ? "..."
        : undefined,
    },
    {
      id: "security" as const,
      label: "Security",
      icon: Shield,
      badge: securityAudit
        ? `${securityAudit.grade} · ${securityAudit.score}`
        : securityLoading ? "..." : undefined,
    },
  ];

  return (
    <div className="flex h-full overflow-hidden">
      <div className="w-[380px] shrink-0 flex flex-col border-r border-[#1a1a1a] overflow-hidden">
        <ChatPanel
          ref={chatRef}
          onGenerating={handleGenerating}
          onDiagramReady={handleDiagramReady}
          onTerraformReady={handleTerraformReady}
          onReset={handleReset}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Tab bar */}
        <div className="flex items-center gap-1 px-4 border-b border-[#1a1a1a] bg-[#080808] shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            const isDisabled = false;
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
                  <Badge
                    variant={
                      tab.id === "cost" && costEstimate ? "yellow" :
                      tab.id === "security" && securityAudit
                        ? securityAudit.score >= 75 ? "green"
                          : securityAudit.score >= 60 ? "yellow" : "red"
                        : "default"
                    }
                    className="text-[9px] px-1.5 py-0"
                  >
                    {tab.badge}
                  </Badge>
                )}
              </button>
            );
          })}

          {iterationCount > 0 && (
            <div className="ml-auto flex items-center gap-2 pr-1">
              <Badge variant="cyan">v{iterationCount + 1}</Badge>
            </div>
          )}
          {stage === "complete" && iterationCount === 0 && (
            <div className="ml-auto pr-1">
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
              isRefinement={isRefinement}
              onConfirm={handleConfirmDiagram}
            />
          )}
          {activeTab === "code" && (
            <CodePanel isGenerating={isGeneratingTerraform} terraform={terraform} />
          )}
          {activeTab === "cost" && (
            <CostPanel
              estimate={costEstimate}
              isLoading={costLoading}
              error={costError}
              onOptimize={handleOptimize}
            />
          )}
          {activeTab === "security" && (
            <SecurityPanel
              audit={securityAudit}
              isLoading={securityLoading}
              error={securityError}
              onFix={handleSecurityFix}
            />
          )}
        </div>
      </div>
    </div>
  );
}

