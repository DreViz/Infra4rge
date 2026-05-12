"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DollarSign,
  Cpu,
  Database,
  Network,
  HardDrive,
  Box,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  MapPin,
} from "lucide-react";
import type { CostEstimate } from "@/app/api/forge/cost/route";

interface CostPanelProps {
  estimate: CostEstimate | null;
  isLoading: boolean;
  error: string | null;
  onOptimize: (suggestion: string) => void;
}

const CATEGORY_CONFIG = {
  compute: {
    label: "Compute",
    icon: Cpu,
    color: "text-violet-400",
    bg: "bg-violet-950/30",
    border: "border-violet-800/30",
    badge: "violet" as const,
  },
  database: {
    label: "Database",
    icon: Database,
    color: "text-blue-400",
    bg: "bg-blue-950/30",
    border: "border-blue-800/30",
    badge: "cyan" as const,
  },
  network: {
    label: "Network",
    icon: Network,
    color: "text-pink-400",
    bg: "bg-pink-950/30",
    border: "border-pink-800/30",
    badge: "default" as const,
  },
  storage: {
    label: "Storage",
    icon: HardDrive,
    color: "text-yellow-400",
    bg: "bg-yellow-950/30",
    border: "border-yellow-800/30",
    badge: "yellow" as const,
  },
  other: {
    label: "Other",
    icon: Box,
    color: "text-[#a1a1aa]",
    bg: "bg-[#161616]",
    border: "border-[#2a2a2a]",
    badge: "default" as const,
  },
};

export function CostPanel({ estimate, isLoading, error, onOptimize }: CostPanelProps) {
  if (isLoading) return <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (!estimate) return <EmptyState />;

  const totalOptimizationSaving = estimate.optimizations.reduce(
    (sum, o) => sum + o.saving,
    0
  );

  // Group resources by category
  const grouped = estimate.resources.reduce<
    Record<string, typeof estimate.resources>
  >((acc, r) => {
    const cat = r.category || "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(r);
    return acc;
  }, {});

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header summary bar */}
      <div className="px-5 py-4 border-b border-[#1a1a1a] shrink-0">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-[10px] text-[#52525b] uppercase tracking-widest mb-1">
              Estimated Monthly Cost
            </p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-[#fafafa]">
                ${estimate.totalMonthly.toFixed(2)}
              </span>
              <span className="text-sm text-[#52525b]">/ mo</span>
            </div>
            <p className="text-xs text-[#52525b] mt-0.5">
              ${estimate.totalYearly.toFixed(0)} / year
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3 w-3 text-[#52525b]" />
              <span className="text-xs text-[#71717a]">{estimate.region}</span>
            </div>
            {totalOptimizationSaving > 0 && (
              <Badge variant="green">
                <TrendingDown className="h-3 w-3" />
                Save up to ${totalOptimizationSaving.toFixed(0)}/mo
              </Badge>
            )}
          </div>
        </div>

        {/* Cost bar visualization */}
        <div className="mt-4 flex h-2 rounded-full overflow-hidden gap-0.5">
          {estimate.resources.map((r, i) => {
            const pct = estimate.totalMonthly > 0
              ? (r.monthlyCost / estimate.totalMonthly) * 100
              : 0;
            const colors: Record<string, string> = {
              compute: "bg-violet-500",
              database: "bg-blue-500",
              network: "bg-pink-500",
              storage: "bg-yellow-500",
              other: "bg-[#444]",
            };
            return pct > 1 ? (
              <div
                key={i}
                className={cn("h-full rounded-sm transition-all", colors[r.category] ?? "bg-[#444]")}
                style={{ width: `${pct}%` }}
                title={`${r.name}: $${r.monthlyCost.toFixed(2)}`}
              />
            ) : null;
          })}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Resource breakdown */}
        <div className="p-5 space-y-5">
          {Object.entries(grouped).map(([category, resources]) => {
            const cfg = CATEGORY_CONFIG[category as keyof typeof CATEGORY_CONFIG] ?? CATEGORY_CONFIG.other;
            const Icon = cfg.icon;
            const catTotal = resources.reduce((s, r) => s + r.monthlyCost, 0);

            return (
              <div key={category}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-3.5 w-3.5", cfg.color)} />
                    <span className="text-xs font-medium text-[#a1a1aa]">{cfg.label}</span>
                  </div>
                  <span className="text-xs text-[#71717a]">${catTotal.toFixed(2)}/mo</span>
                </div>

                <div className="space-y-1.5">
                  {resources.map((resource, i) => (
                    <div
                      key={i}
                      className={cn(
                        "flex items-center justify-between px-3 py-2.5 rounded-xl border",
                        cfg.bg,
                        cfg.border
                      )}
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-medium text-[#e4e4e7] truncate">
                          {resource.name}
                        </span>
                        <span className="text-[11px] text-[#71717a] truncate">
                          {resource.details}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 ml-3">
                        <span className="text-xs font-semibold text-[#fafafa]">
                          ${resource.monthlyCost.toFixed(2)}
                        </span>
                        <span className="text-[10px] text-[#52525b]">/mo</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Assumptions */}
          {estimate.assumptions.length > 0 && (
            <div className="pt-2 border-t border-[#1a1a1a]">
              <p className="text-[10px] text-[#3f3f46] uppercase tracking-widest mb-2">
                Assumptions
              </p>
              <ul className="space-y-1">
                {estimate.assumptions.map((a, i) => (
                  <li key={i} className="text-[11px] text-[#52525b] flex items-start gap-1.5">
                    <span className="mt-1 h-1 w-1 rounded-full bg-[#3f3f46] shrink-0" />
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Optimization suggestions */}
          {estimate.optimizations.length > 0 && (
            <div className="pt-2 border-t border-[#1a1a1a]">
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-3.5 w-3.5 text-emerald-400" />
                <p className="text-xs font-medium text-[#a1a1aa]">Cost Optimizations</p>
              </div>
              <div className="space-y-2">
                {estimate.optimizations.map((opt, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 p-3 rounded-xl border border-emerald-900/30 bg-emerald-950/10"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-emerald-300">
                          {opt.title}
                        </span>
                        <Badge variant="green" className="text-[9px] px-1 py-0">
                          -${opt.saving.toFixed(0)}/mo
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#71717a] leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onOptimize(opt.title)}
                      className="h-7 px-2 text-[10px] text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30 shrink-0"
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-950/30 border border-yellow-900/30">
        <RefreshCw className="h-5 w-5 text-yellow-400 animate-spin" />
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-sm font-medium text-[#fafafa]">Estimating costs...</p>
        <p className="text-xs text-[#71717a]">Analyzing your Terraform resources</p>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 px-8">
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-yellow-950/20 border border-yellow-900/30">
        <DollarSign className="h-6 w-6 text-yellow-400" />
      </div>
      <div className="flex flex-col items-center gap-2 text-center">
        <h3 className="text-sm font-semibold text-[#fafafa]">Cost Estimation</h3>
        <p className="text-sm text-[#71717a] max-w-xs leading-relaxed">
          Generate Terraform first — cost breakdown will appear automatically.
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
        <h3 className="text-sm font-semibold text-[#fafafa]">Estimation failed</h3>
        <p className="text-xs text-[#71717a] max-w-xs">{message}</p>
      </div>
    </div>
  );
}
