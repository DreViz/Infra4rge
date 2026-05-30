"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Anvil, GitFork } from "lucide-react";

interface NavbarProps {
  minimal?: boolean;
}

export function Navbar({ minimal = false }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="flex h-full items-center justify-between px-6 max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary">
            <Anvil className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-sm font-semibold tracking-tight">InfraForge</span>
        </Link>

        {!minimal && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Features
            </Link>
            <Link href="#workspace" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Workspace
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/DreViz/Infra4rge"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-colors"
          >
            <GitFork className="h-4 w-4" />
          </a>
          {!minimal && (
            <Link href="/forge">
              <Button variant="glow" size="sm">
                Start Building
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
