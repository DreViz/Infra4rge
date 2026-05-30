import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

export function Hero() {
  return (
    <section className="relative overflow-hidden px-6 pt-32 pb-20 md:pt-40 md:pb-32">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute top-20 right-1/4 h-[300px] w-[400px] rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="text-sm text-primary">AI-Powered Infrastructure</span>
        </div>

        <h1 className="text-balance text-4xl font-bold tracking-tight md:text-6xl lg:text-7xl">
          Forge Your Cloud
          <br />
          <span className="text-primary">Infrastructure</span> with AI
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
          Transform natural language into production-ready Terraform code.
          Get instant architecture diagrams, cost estimates, and security audits.
        </p>

        <div className="mt-10 flex items-center justify-center">
          <Link href="/forge">
            <Button size="lg" className="group bg-primary text-primary-foreground hover:bg-primary/90">
              Start Building
              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
