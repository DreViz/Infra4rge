"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { ChatPanel, type ChatPanelHandle } from "./chat-panel";
import { DiagramPanel } from "./diagram-panel";
import { CodePanel } from "./code-panel";
import { CostPanel } from "./cost-panel";
import { SecurityPanel } from "./security-panel";
import { ForgeToolbar } from "./forge-toolbar";
import { HistorySidebar } from "./history-sidebar";
import { Badge } from "@/components/ui/badge";
import { Network, FileCode, DollarSign, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CostEstimate } from "@/app/api/forge/cost/route";
import type { SecurityAudit } from "@/app/api/forge/security/route";
import {
  getProjects,
  saveProject,
  updateProject,
  deleteProject,
  deriveProjectName,
  type SavedProject,
} from "@/lib/storage";

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

  // Project / history state
  const [projects, setProjects] = useState<SavedProject[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [projectName, setProjectName] = useState("Untitled Architecture");
  const [isSaved, setIsSaved] = useState(false);
  const [historySidebarOpen, setHistorySidebarOpen] = useState(false);
  const firstMessageRef = useRef<string>("");

  const chatRef = useRef<ChatPanelHandle>(null);

  // Load saved projects on mount
  useEffect(() => {
    Promise.resolve().then(() => setProjects(getProjects()));
  }, []);

  // Auto-save when terraform + diagram are both ready
  const autoSave = useCallback((
    tf: string,
    diag: DiagramData,
    cost: CostEstimate | null,
    security: SecurityAudit | null,
  ) => {
    const name = deriveProjectName(firstMessageRef.current || "Architecture");
    setProjectName(name);

    if (currentProjectId) {
      updateProject(currentProjectId, {
        name,
        diagram: diag.diagram,
        summary: diag.summary,
        terraform: tf,
        costEstimate: cost,
        securityAudit: security,
      });
      setProjects(getProjects());
    } else {
      const saved = saveProject({
        name,
        firstMessage: firstMessageRef.current,
        summary: diag.summary,
        diagram: diag.diagram,
        terraform: tf,
        costEstimate: cost,
        securityAudit: security,
      });
      setCurrentProjectId(saved.id);
      setProjects(getProjects());
    }
    setIsSaved(true);
  }, [currentProjectId]);

  const fetchSecurityAudit = useCallback(async (tf: string): Promise<SecurityAudit | null> => {
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
      if (data.error) { setSecurityError(data.error); return null; }
      if (!data.audit) {
        setSecurityError("Security audit returned no results — try regenerating Terraform.");
        return null;
      }
      setSecurityAudit(data.audit);
      return data.audit;
    } catch {
      setSecurityError("Failed to run security audit.");
      return null;
    } finally {
      setSecurityLoading(false);
    }
  }, []);

  const fetchCostEstimate = useCallback(async (tf: string): Promise<CostEstimate | null> => {
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
      if (data.error) { setCostError(data.error); return null; }
      if (!data.estimate) {
        setCostError("Cost estimation returned no results — try regenerating Terraform.");
        return null;
      }
      setCostEstimate(data.estimate);
      return data.estimate;
    } catch {
      setCostError("Failed to estimate cost.");
      return null;
    } finally {
      setCostLoading(false);
    }
  }, []);

  const handleDiagramReady = (data: DiagramData, isRefinement: boolean) => {
    setDiagramData(data);
    setStage("diagram_ready");
    setIsAILoading(false);
    setActiveTab("diagram");
    setIsSaved(false);
    if (isRefinement) {
      setTerraform(null);
      setCostEstimate(null);
      setSecurityAudit(null);
      setIterationCount((n) => n + 1);
    }
  };

  const handleTerraformReady = (tf: string, diag: DiagramData) => {
    setTerraform(tf);
    setStage("complete");
    setIsAILoading(false);
    setActiveTab("code");

    let cost: CostEstimate | null = null;
    let security: SecurityAudit | null = null;
    let done = 0;

    const trySave = () => {
      done++;
      if (done === 2) autoSave(tf, diag, cost, security);
    };

    fetchCostEstimate(tf).then((c) => { cost = c ?? null; trySave(); });
    fetchSecurityAudit(tf).then((s) => { security = s ?? null; trySave(); });
  };

  const handleFirstMessage = (msg: string) => {
    if (!firstMessageRef.current) firstMessageRef.current = msg;
  };

  const handleGenerating = (isGenerating: boolean) => {
    setIsAILoading(isGenerating);
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

  const handleLoadProject = (project: SavedProject) => {
    setDiagramData({ diagram: project.diagram, summary: project.summary });
    setTerraform(project.terraform);
    setCostEstimate(project.costEstimate);
    setSecurityAudit(project.securityAudit);
    setStage("complete");
    setCurrentProjectId(project.id);
    setProjectName(project.name);
    setIsSaved(true);
    firstMessageRef.current = project.firstMessage;
    setActiveTab("diagram");
    setHistorySidebarOpen(false);
    setIterationCount(0);
  };

  const handleDeleteProject = (id: string) => {
    setProjects(getProjects());
    if (id === currentProjectId) {
      setCurrentProjectId(null);
      setIsSaved(false);
    }
  };

  const handleRename = (name: string) => {
    setProjectName(name);
    if (currentProjectId) {
      updateProject(currentProjectId, { name });
      setProjects(getProjects());
    }
  };

  const handleExportZip = async () => {
    if (!terraform || !diagramData) return;
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    zip.file("main.tf", terraform);
    zip.file("architecture.mmd", diagramData.diagram);
    zip.file("README.md", `# ${projectName}\n\n${diagramData.summary}\n\n---\nGenerated by InfraForge\n`);

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectName.replace(/\s+/g, "-").toLowerCase()}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReset = () => {
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
    setCurrentProjectId(null);
    setProjectName("Untitled Architecture");
    setIsSaved(false);
    firstMessageRef.current = "";
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
    <div className="flex flex-col h-full overflow-hidden bg-background">
      <ForgeToolbar
        projectName={projectName}
        isSaved={isSaved}
        canExport={!!terraform}
        historyCount={projects.length}
        onRename={handleRename}
        onHistoryOpen={() => setHistorySidebarOpen(true)}
        onExportZip={handleExportZip}
      />

      <HistorySidebar
        open={historySidebarOpen}
        projects={projects}
        currentProjectId={currentProjectId}
        onClose={() => setHistorySidebarOpen(false)}
        onLoad={handleLoadProject}
        onDelete={handleDeleteProject}
      />

      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        {/* Chat panel */}
        <div className="w-full md:w-[380px] h-[45dvh] md:h-full shrink-0 flex flex-col border-b md:border-b-0 md:border-r border-border/40 overflow-hidden">
          <ChatPanel
            ref={chatRef}
            onGenerating={handleGenerating}
            onDiagramReady={handleDiagramReady}
            onTerraformReady={handleTerraformReady}
            onFirstMessage={handleFirstMessage}
            onReset={handleReset}
          />
        </div>

        {/* Right panel */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Tab bar with glassmorphism */}
          <div className="flex items-center gap-1 px-2 md:px-4 border-b border-border/40 bg-background/80 backdrop-blur-xl shrink-0 overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative flex items-center gap-2 px-3 py-3 text-xs font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
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
                  {/* Active indicator with gradient */}
                  {isActive && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-primary/80 to-accent rounded-full" />
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
    </div>
  );
}
