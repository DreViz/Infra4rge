"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  X,
  Trash2,
  Clock,
  FolderOpen,
  ChevronRight,
  Shield,
  DollarSign,
} from "lucide-react";
import {
  type SavedProject,
  deleteProject,
  formatRelativeTime,
} from "@/lib/storage";

interface HistorySidebarProps {
  open: boolean;
  projects: SavedProject[];
  currentProjectId: string | null;
  onClose: () => void;
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

export function HistorySidebar({
  open,
  projects,
  currentProjectId,
  onClose,
  onLoad,
  onDelete,
}: HistorySidebarProps) {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    deleteProject(id);
    onDelete(id);
  };

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 flex flex-col bg-card/95 backdrop-blur-xl border-l border-border/40 shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/40">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-sm font-medium text-foreground">History</span>
            {projects.length > 0 && (
              <Badge variant="default" className="text-[9px] px-1.5 py-0">
                {projects.length}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card border border-border/40">
                <FolderOpen className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">No saved projects yet</p>
              <p className="text-xs text-muted-foreground/60 leading-relaxed">
                Generate Terraform to auto-save your first architecture
              </p>
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {projects.map((project) => {
                const isCurrent = project.id === currentProjectId;
                const isHovered = hoveredId === project.id;

                return (
                  <button
                    key={project.id}
                    onClick={() => onLoad(project)}
                    onMouseEnter={() => setHoveredId(project.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    className={cn(
                      "w-full flex flex-col gap-2 p-3 rounded-xl text-left transition-all border",
                      isCurrent
                        ? "bg-primary/10 border-primary/20"
                        : "bg-transparent border-transparent hover:bg-card hover:border-border/40"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn(
                        "text-xs font-medium leading-snug line-clamp-2 flex-1",
                        isCurrent ? "text-primary" : "text-card-foreground"
                      )}>
                        {project.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isHovered && !isCurrent && (
                          <span
                            onClick={(e) => handleDelete(e, project.id)}
                            className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        )}
                        {isCurrent && (
                          <Badge variant="default" className="text-[9px] px-1 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-muted-foreground">
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                      {project.costEstimate && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5 text-yellow-500/60" />
                          <span className="text-[10px] text-muted-foreground">
                            ${project.costEstimate.totalMonthly.toFixed(0)}/mo
                          </span>
                        </div>
                      )}
                      {project.securityAudit && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5 text-emerald-500/60" />
                          <span className="text-[10px] text-muted-foreground">
                            {project.securityAudit.grade} · {project.securityAudit.score}
                          </span>
                        </div>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="flex items-center gap-1 text-[10px] text-primary/60">
                        <ChevronRight className="h-2.5 w-2.5" />
                        <span>Active</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {projects.length > 0 && (
          <div className="px-4 py-3 border-t border-border/40">
            <p className="text-[10px] text-muted-foreground">
              {projects.length} of {20} slots used · Auto-saved locally
            </p>
          </div>
        )}
      </div>
    </>
  );
}
