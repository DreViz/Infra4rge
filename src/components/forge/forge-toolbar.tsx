"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Check, Pencil, PackageOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface ForgeToolbarProps {
  projectName: string;
  isSaved: boolean;
  canExport: boolean;
  historyCount: number;
  onRename: (name: string) => void;
  onHistoryOpen: () => void;
  onExportZip: () => void;
}

export function ForgeToolbar({
  projectName,
  isSaved,
  canExport,
  historyCount,
  onRename,
  onHistoryOpen,
  onExportZip,
}: ForgeToolbarProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(projectName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    Promise.resolve().then(() => setDraft(projectName));
  }, [projectName]);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const commitRename = () => {
    const trimmed = draft.trim();
    if (trimmed && trimmed !== projectName) onRename(trimmed);
    else setDraft(projectName);
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") commitRename();
    if (e.key === "Escape") { setDraft(projectName); setEditing(false); }
  };

  return (
    <div className="flex items-center justify-between px-4 py-2 border-b border-[#1a1a1a] bg-[#080808] shrink-0">
      {/* Project name */}
      <div className="flex items-center gap-2 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={handleKeyDown}
            className="bg-[#111] border border-violet-600/40 rounded-md px-2 py-0.5 text-xs text-[#fafafa] outline-none w-56 focus:ring-1 focus:ring-violet-600/40"
          />
        ) : (
          <button
            onClick={() => setEditing(true)}
            className="group flex items-center gap-1.5 text-xs text-[#a1a1aa] hover:text-[#fafafa] transition-colors truncate max-w-[220px]"
          >
            <span className="truncate">{projectName}</span>
            <Pencil className="h-2.5 w-2.5 shrink-0 opacity-0 group-hover:opacity-50 transition-opacity" />
          </button>
        )}

        {isSaved && (
          <div className="flex items-center gap-1 text-[10px] text-[#3f3f46]">
            <Check className="h-2.5 w-2.5 text-emerald-600" />
            <span>Saved</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5">
        {canExport && (
          <Button
            variant="secondary"
            size="sm"
            onClick={onExportZip}
            className="h-7 gap-1.5 text-[11px]"
          >
            <PackageOpen className="h-3 w-3" />
            Export ZIP
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          onClick={onHistoryOpen}
          className={cn("h-7 gap-1.5 text-[11px]", historyCount > 0 && "text-[#a1a1aa]")}
        >
          <Clock className="h-3 w-3" />
          History
          {historyCount > 0 && (
            <Badge variant="default" className="text-[9px] px-1 py-0 ml-0.5">
              {historyCount}
            </Badge>
          )}
        </Button>
      </div>
    </div>
  );
}
