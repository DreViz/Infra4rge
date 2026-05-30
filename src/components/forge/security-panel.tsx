"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Info,
  Zap,
  RefreshCw,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";
import type { SecurityAudit, SecurityFinding, Severity, Grade } from "@/app/api/forge/security/route";

interface SecurityPanelProps {
  audit: SecurityAudit | null;
  isLoading: boolean;
  error: string | null;
  onFix: (instruction: string) => void;
}

const SEVERITY_CONFIG: Record<Severity, {
  label: string;
  color: string;
  bg: string;
  border: string;
  badge: "red" | "yellow" | "cyan" | "default";
  icon: typeof AlertTriangle;
}> = {
  CRITICAL: {
    label: "Critical",
    color: "text-red-400",
    bg: "bg-red-950/30",
    border: "border-red-900/40",
    badge: "red",
    icon: ShieldAlert,
  },
  HIGH: {
    label: "High",
    color: "text-orange-400",
    bg: "bg-orange-950/30",
    border: "border-orange-900/40",
    badge: "yellow",
    icon: AlertTriangle,
  },
  MEDIUM: {
    label: "Medium",
    color: "text-yellow-400",
    bg: "bg-yellow-950/20",
    border: "border-yellow-900/30",
    badge: "yellow",
    icon: AlertCircle,
  },
  LOW: {
    label: "Low",
    color: "text-blue-400",
    bg: "bg-blue-950/20",
    border: "border-blue-900/30",
    badge: "cyan",
    icon: Info,
  },
};

const GRADE_CONFIG: Record<Grade, { color: string; bg: string; ring: string; stroke: string }> = {
  A: { color: "text-emerald-400", bg: "bg-emerald-950/30", ring: "ring-emerald-500/40", stroke: "#34d399" },
  B: { color: "text-blue-400",    bg: "bg-blue-950/30",    ring: "ring-blue-500/40",    stroke: "#60a5fa" },
  C: { color: "text-yellow-400",  bg: "bg-yellow-950/30",  ring: "ring-yellow-500/40",  stroke: "#fbbf24" },
  D: { color: "text-orange-400",  bg: "bg-orange-950/30",  ring: "ring-orange-500/40",  stroke: "#fb923c" },
  F: { color: "text-red-400",     bg: "bg-red-950/30",     ring: "ring-red-500/40",     stroke: "#f87171" },
};

export function SecurityPanel({ audit, isLoading, error, onFix }: SecurityPanelProps) {
  if (isLoading) return <LoadingState />;
  if (error)     return <ErrorState message={error} />;
  if (!audit)    return <EmptyState />;

  const criticalAndHigh = audit.findings.filter(
    (f) => f.severity === "CRITICAL" || f.severity === "HIGH"
  );
  const bySeverity: Record<Severity, SecurityFinding[]> = {
    CRITICAL: audit.findings.filter((f) => f.severity === "CRITICAL"),
    HIGH:     audit.findings.filter((f) => f.severity === "HIGH"),
    MEDIUM:   audit.findings.filter((f) => f.severity === "MEDIUM"),
    LOW:      audit.findings.filter((f) => f.severity === "LOW"),
  };

  const gradeConfig = GRADE_CONFIG[audit.grade] ?? GRADE_CONFIG.F;
  const circumference = 2 * Math.PI * 36;
  const scoreOffset = circumference - (audit.score / 100) * circumference;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Score header with circular progress */}
      <div className="px-5 py-4 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-5">
          {/* Circular score ring */}
          <div className={cn("relative flex items-center justify-center shrink-0", gradeConfig.bg, "rounded-2xl")}>
            <svg width="80" height="80" className="-rotate-90">
              <circle cx="40" cy="40" r="36" fill="none" stroke="currentColor" strokeWidth="3" className="text-border/40" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke={gradeConfig.stroke}
                strokeWidth="3"
                strokeDasharray={circumference}
                strokeDashoffset={scoreOffset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={cn("text-xl font-bold leading-none", gradeConfig.color)}>
                {audit.grade}
              </span>
              <span className="text-[10px] text-muted-foreground mt-0.5">{audit.score}/100</span>
            </div>
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              {(["CRITICAL","HIGH","MEDIUM","LOW"] as Severity[]).map((sev) => {
                const count = bySeverity[sev].length;
                if (count === 0) return null;
                const cfg = SEVERITY_CONFIG[sev];
                return (
                  <Badge key={sev} variant={cfg.badge} className="gap-1">
                    <cfg.icon className="h-2.5 w-2.5" />
                    {count} {cfg.label}
                  </Badge>
                );
              })}
              {audit.passed.length > 0 && (
                <Badge variant="green">
                  <CheckCircle2 className="h-2.5 w-2.5" />
                  {audit.passed.length} Passed
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
              {audit.summary}
            </p>
          </div>
        </div>

        {/* Fix All button */}
        {criticalAndHigh.length > 0 && (
          <Button
            onClick={() => onFix(audit.fixAllInstruction)}
            variant="glow"
            className="w-full mt-4 group"
          >
            <Zap className="h-4 w-4" />
            Fix All Critical & High ({criticalAndHigh.length} issues)
          </Button>
        )}
      </div>

      {/* Findings list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {(["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).map((sev) => {
          const findings = bySeverity[sev];
          if (findings.length === 0) return null;
          return (
            <FindingGroup key={sev} severity={sev} findings={findings} onFix={onFix} />
          );
        })}

        {audit.passed.length > 0 && (
          <PassedSection passed={audit.passed} />
        )}
      </div>
    </div>
  );
}

function FindingGroup({
  severity,
  findings,
  onFix,
}: {
  severity: Severity;
  findings: SecurityFinding[];
  onFix: (instruction: string) => void;
}) {
  const cfg = SEVERITY_CONFIG[severity];
  const Icon = cfg.icon;

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
        <span className="text-xs font-medium text-muted-foreground">{cfg.label}</span>
        <span className={cn("text-xs font-bold", cfg.color)}>{findings.length}</span>
      </div>
      <div className="space-y-2">
        {findings.map((finding, i) => (
          <FindingCard key={`${finding.id}-${i}`} finding={finding} onFix={onFix} />
        ))}
      </div>
    </div>
  );
}

function FindingCard({
  finding,
  onFix,
}: {
  finding: SecurityFinding;
  onFix: (instruction: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = SEVERITY_CONFIG[finding.severity];
  const Icon = cfg.icon;

  return (
    <div className={cn("rounded-xl border overflow-hidden", cfg.bg, cfg.border)}>
      <button
        className="flex items-start gap-3 w-full text-left p-3"
        onClick={() => setExpanded((e) => !e)}
      >
        <Icon className={cn("h-3.5 w-3.5 mt-0.5 shrink-0", cfg.color)} />
        <div className="flex flex-col gap-0.5 flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <span className="text-xs font-medium text-card-foreground leading-snug">
              {finding.title}
            </span>
            {expanded
              ? <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
              : <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
            }
          </div>
          <span className="text-[11px] text-muted-foreground font-mono">{finding.resource}</span>
        </div>
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-3 border-t border-border/20 pt-3">
          <p className="text-xs text-muted-foreground leading-relaxed">{finding.description}</p>
          <div className="flex items-start gap-2 p-2 rounded-lg bg-emerald-950/20 border border-emerald-900/30">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-[11px] text-emerald-300 leading-relaxed flex-1">{finding.fix}</p>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground/60 font-mono">{finding.id}</span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => onFix(`Fix this security issue: ${finding.title}. ${finding.fix}`)}
              className="h-6 px-2 text-[10px]"
            >
              Fix this
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function PassedSection({ passed }: { passed: SecurityAudit["passed"] }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div>
      <button
        className="flex items-center gap-2 mb-2 group"
        onClick={() => setExpanded((e) => !e)}
      >
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
        <span className="text-xs font-medium text-muted-foreground">Passed</span>
        <span className="text-xs font-bold text-emerald-400">{passed.length}</span>
        {expanded
          ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
          : <ChevronRight className="h-3 w-3 text-muted-foreground" />
        }
      </button>

      {expanded && (
        <div className="space-y-1.5">
          {passed.map((p, i) => (
            <div
              key={`${p.id}-${i}`}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-emerald-900/20 bg-emerald-950/10"
            >
              <CheckCircle2 className="h-3 w-3 text-emerald-400 shrink-0" />
              <div className="flex flex-col min-w-0">
                <span className="text-xs text-muted-foreground truncate">{p.title}</span>
                <span className="text-[10px] text-muted-foreground/60 font-mono truncate">{p.resource}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20">
        <RefreshCw className="h-5 w-5 text-primary animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-foreground">Running security audit...</p>
        <p className="text-xs text-muted-foreground">Analyzing your Terraform for misconfigurations</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card border border-border/40">
        <Shield className="h-6 w-6 text-muted-foreground/40" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-sm font-semibold text-foreground">Security Audit</h3>
        <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
          Confirm the architecture diagram to generate Terraform — the security audit runs automatically after.
        </p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-950/20 border border-red-900/30">
        <AlertCircle className="h-6 w-6 text-red-400" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-sm font-semibold text-foreground">Audit failed</h3>
        <p className="text-xs text-muted-foreground max-w-xs">{message}</p>
      </div>
    </div>
  );
}
