import type { CostEstimate } from "@/app/api/forge/cost/route";
import type { SecurityAudit } from "@/app/api/forge/security/route";

export interface SavedProject {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  firstMessage: string;
  summary: string;
  diagram: string;
  terraform: string;
  costEstimate: CostEstimate | null;
  securityAudit: SecurityAudit | null;
}

const STORAGE_KEY = "infraforge_projects";
const MAX_PROJECTS = 20;

export function getProjects(): SavedProject[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SavedProject[]) : [];
  } catch {
    return [];
  }
}

export function saveProject(
  data: Omit<SavedProject, "id" | "createdAt" | "updatedAt">
): SavedProject {
  const projects = getProjects();
  const now = new Date().toISOString();
  const project: SavedProject = { ...data, id: `proj_${Date.now()}`, createdAt: now, updatedAt: now };
  const updated = [project, ...projects].slice(0, MAX_PROJECTS);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return project;
}

export function updateProject(id: string, updates: Partial<SavedProject>): void {
  const projects = getProjects();
  const idx = projects.findIndex((p) => p.id === id);
  if (idx === -1) return;
  projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deleteProject(id: string): void {
  const projects = getProjects().filter((p) => p.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
}

export function deriveProjectName(firstMessage: string): string {
  const cleaned = firstMessage
    .replace(/^(i want to build|build me|create a?|make a?|i need a?|a )/i, "")
    .trim();
  const words = cleaned.split(/\s+/).slice(0, 7).join(" ");
  return words.charAt(0).toUpperCase() + words.slice(1);
}

export function formatRelativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}
