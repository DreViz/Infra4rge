"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Cpu, GitFork } from "lucide-react";

interface NavbarProps {
  minimal?: boolean;
}

export function Navbar({ minimal = false }: NavbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-14 border-b border-[#1a1a1a] bg-[#080808]/80 backdrop-blur-md">
      <div className="flex h-full items-center justify-between px-6 max-w-7xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600 shadow-lg shadow-violet-900/40">
            <Cpu className="h-4 w-4 text-white" />
          </div>
          <span className="text-sm font-semibold tracking-tight text-[#fafafa]">
            InfraForge
          </span>
        </Link>

        {!minimal && (
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm text-[#71717a] hover:text-[#fafafa] transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-[#71717a] hover:text-[#fafafa] transition-colors">
              How it works
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3">
          <a
            href="https://github.com/DreViz/Infra4rge"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-8 w-8 items-center justify-center rounded-lg text-[#71717a] hover:text-[#fafafa] hover:bg-[#161616] transition-colors"
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
