import { Anvil } from "lucide-react";
import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-border/40 px-6 py-12">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Anvil className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">InfraForge</span>
          </Link>

          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="https://github.com/DreViz/Infra4rge" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground">
              GitHub
            </Link>
          </div>

          <p className="text-sm text-muted-foreground">
            Open Source · No account required
          </p>
        </div>
      </div>
    </footer>
  );
}
