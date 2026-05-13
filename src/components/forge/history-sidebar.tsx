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
      {/* Backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-80 flex flex-col bg-[#0e0e0e] border-l border-[#1a1a1a] shadow-2xl transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <Clock className="h-3.5 w-3.5 text-[#71717a]" />
            <span className="text-sm font-medium text-[#fafafa]">History</span>
            {projects.length > 0 && (
              <Badge variant="default" className="text-[9px] px-1.5 py-0">
                {projects.length}
              </Badge>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[#52525b] hover:text-[#fafafa] hover:bg-[#1a1a1a] transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Project list */}
        <div className="flex-1 overflow-y-auto">
          {projects.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-3 px-6 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#161616] border border-[#2a2a2a]">
                <FolderOpen className="h-5 w-5 text-[#3f3f46]" />
              </div>
              <p className="text-sm text-[#3f3f46]">No saved projects yet</p>
              <p className="text-xs text-[#2a2a2a] leading-relaxed">
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
                        ? "bg-violet-950/30 border-violet-800/40"
                        : "bg-transparent border-transparent hover:bg-[#141414] hover:border-[#222]"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className={cn(
                        "text-xs font-medium leading-snug line-clamp-2 flex-1",
                        isCurrent ? "text-violet-200" : "text-[#e4e4e7]"
                      )}>
                        {project.name}
                      </span>
                      <div className="flex items-center gap-1 shrink-0">
                        {isHovered && !isCurrent && (
                          <span
                            onClick={(e) => handleDelete(e, project.id)}
                            className="flex h-5 w-5 items-center justify-center rounded text-[#52525b] hover:text-red-400 hover:bg-red-950/30 transition-colors cursor-pointer"
                          >
                            <Trash2 className="h-3 w-3" />
                          </span>
                        )}
                        {isCurrent && (
                          <Badge variant="violet" className="text-[9px] px-1 py-0">
                            Current
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] text-[#52525b]">
                        {formatRelativeTime(project.updatedAt)}
                      </span>
                      {project.costEstimate && (
                        <div className="flex items-center gap-1">
                          <DollarSign className="h-2.5 w-2.5 text-yellow-500/60" />
                          <span className="text-[10px] text-[#52525b]">
                            ${project.costEstimate.totalMonthly.toFixed(0)}/mo
                          </span>
                        </div>
                      )}
                      {project.securityAudit && (
                        <div className="flex items-center gap-1">
                          <Shield className="h-2.5 w-2.5 text-emerald-500/60" />
                          <span className="text-[10px] text-[#52525b]">
                            {project.securityAudit.grade} · {project.securityAudit.score}
                          </span>
                        </div>
                      )}
                    </div>

                    {isCurrent && (
                      <div className="flex items-center gap-1 text-[10px] text-violet-400/60">
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

        {/* Footer */}
        {projects.length > 0 && (
          <div className="px-4 py-3 border-t border-[#1a1a1a]">
            <p className="text-[10px] text-[#3f3f46]">
              {projects.length} of {20} slots used · Auto-saved locally
            </p>
          </div>
        )}
      </div>
    </>
  );
}
