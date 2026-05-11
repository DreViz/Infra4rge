import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowRight,
  Cpu,
  GitBranch,
  Shield,
  Zap,
  DollarSign,
  Network,
  Terminal,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Network,
    title: "Architecture Diagrams",
    description:
      "Instantly visualize your cloud infrastructure as a clean, professional architecture diagram. Mermaid-powered, fully editable.",
    badge: "Live Preview",
    badgeVariant: "cyan" as const,
    color: "cyan",
  },
  {
    icon: Terminal,
    title: "Terraform Code",
    description:
      "Get production-ready HCL with proper modules, variables, and outputs. AWS, GCP, and Azure supported out of the box.",
    badge: "IaC Ready",
    badgeVariant: "violet" as const,
    color: "violet",
  },
  {
    icon: DollarSign,
    title: "Cost Estimation",
    description:
      "Know your monthly cloud bill before you deploy. Per-resource breakdown with optimization suggestions.",
    badge: "Coming Soon",
    badgeVariant: "yellow" as const,
    color: "yellow",
  },
  {
    icon: Shield,
    title: "Security Audit",
    description:
      "Automated Checkov scanning on every generation. Security score, findings, and one-click auto-fix.",
    badge: "Coming Soon",
    badgeVariant: "green" as const,
    color: "green",
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description:
      "Push your Terraform to a new repo with GitHub Actions CI/CD wired up and ready for team collaboration.",
    badge: "Phase 3",
    badgeVariant: "default" as const,
    color: "default",
  },
  {
    icon: Zap,
    title: "Conversational Refinement",
    description:
      "\"Add Redis caching\" or \"make it multi-region\" — both the diagram and Terraform update together in real time.",
    badge: "AI Powered",
    badgeVariant: "violet" as const,
    color: "violet",
  },
];

const steps = [
  {
    number: "01",
    title: "Describe your app",
    description:
      "Tell InfraForge what you're building in plain English. Our AI asks smart clarifying questions to understand your scale, compliance needs, and cloud preference.",
  },
  {
    number: "02",
    title: "Review the architecture",
    description:
      "A live architecture diagram appears instantly. Refine it with natural language — add services, change providers, scale up or down.",
  },
  {
    number: "03",
    title: "Get your Terraform",
    description:
      "Production-ready HCL with proper structure, security defaults, and cost estimates. Copy, download, or push directly to GitHub.",
  },
];

const examplePrompts = [
  "A SaaS app with Next.js frontend, FastAPI backend, PostgreSQL, and Redis cache on AWS",
  "Microservices e-commerce platform with Kubernetes, API gateway, and a message queue",
  "ML inference pipeline with GPU instances, S3 data lake, and a serving endpoint",
  "Multi-region web app with global CDN, auto-scaling, and disaster recovery",
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-[#080808] relative overflow-hidden">
      <Navbar />

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-14 grid-bg">
        {/* Background glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] rounded-full opacity-20 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse, rgba(109,40,217,0.4) 0%, rgba(6,182,212,0.1) 50%, transparent 70%)",
            filter: "blur(60px)",
          }}
        />

        <div className="relative z-10 flex flex-col items-center text-center max-w-4xl mx-auto gap-8">
          {/* Pill badge */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#222] bg-[#111]/80 backdrop-blur-sm text-xs text-[#a1a1aa]">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>Powered by GLM</span>
            <span className="h-3 w-px bg-[#333]" />
            <span className="text-violet-400">Phase 1 — Public Beta</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.05]">
            <span className="text-[#fafafa]">Describe it.</span>
            <br />
            <span className="gradient-text">Architect it.</span>
            <br />
            <span className="text-[#fafafa]">Ship it.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-[#71717a] max-w-xl leading-relaxed">
            Turn a plain-English description into a production-ready cloud
            architecture diagram and Terraform code — in one conversation.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <Link href="/forge">
              <Button variant="glow" size="lg" className="group">
                Start Building Free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
            <Button variant="secondary" size="lg">
              <Cpu className="h-4 w-4 text-[#71717a]" />
              View Example
            </Button>
          </div>

          {/* Example prompts */}
          <div className="flex flex-col items-center gap-3 mt-4 w-full max-w-2xl">
            <p className="text-xs text-[#52525b] uppercase tracking-widest">
              Try these
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {examplePrompts.map((prompt, i) => (
                <Link key={i} href="/forge">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1e1e1e] bg-[#111]/60 text-xs text-[#71717a] hover:text-[#a1a1aa] hover:border-[#2a2a2a] hover:bg-[#161616] transition-all cursor-pointer text-left">
                    <ChevronRight className="h-3 w-3 shrink-0 text-violet-600" />
                    <span className="line-clamp-1">{prompt}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-30">
          <div className="h-8 w-px bg-gradient-to-b from-transparent to-[#555]" />
        </div>
      </section>

      {/* Features */}
      <section id="features" className="relative py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <Badge variant="violet">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#fafafa]">
              Everything in one place
            </h2>
            <p className="text-[#71717a] max-w-lg">
              From description to deployed infrastructure — no context switching,
              no stitching tools together.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              const colorMap: Record<string, string> = {
                cyan: "text-cyan-400 bg-cyan-950/40 border-cyan-900/40",
                violet: "text-violet-400 bg-violet-950/40 border-violet-900/40",
                yellow: "text-yellow-400 bg-yellow-950/40 border-yellow-900/40",
                green: "text-emerald-400 bg-emerald-950/40 border-emerald-900/40",
                default: "text-[#a1a1aa] bg-[#161616] border-[#222]",
              };
              const iconColor = colorMap[feature.color];

              return (
                <div
                  key={i}
                  className="group relative flex flex-col gap-4 p-6 rounded-2xl border border-[#1a1a1a] bg-[#0e0e0e] hover:border-[#2a2a2a] hover:bg-[#111] transition-all duration-300"
                >
                  {/* Subtle corner glow on hover */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{ background: "radial-gradient(circle at 10% 10%, rgba(109,40,217,0.04), transparent 60%)" }}
                  />
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl border ${iconColor}`}>
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-[#fafafa]">{feature.title}</h3>
                      <Badge variant={feature.badgeVariant}>{feature.badge}</Badge>
                    </div>
                    <p className="text-sm text-[#71717a] leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="relative py-32 px-6">
        {/* Subtle divider */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#222] to-transparent" />

        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col items-center text-center gap-4 mb-16">
            <Badge variant="cyan">How it works</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#fafafa]">
              Three steps to production
            </h2>
          </div>

          <div className="relative flex flex-col gap-0">
            {/* Vertical line */}
            <div className="absolute left-[19px] top-8 bottom-8 w-px bg-gradient-to-b from-violet-800/60 via-[#222] to-transparent hidden sm:block" />

            {steps.map((step, i) => (
              <div key={i} className="flex gap-6 pb-14 last:pb-0">
                {/* Step number circle */}
                <div className="relative shrink-0 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-violet-800/60 bg-[#0e0e0e] text-xs font-mono font-bold text-violet-400 z-10">
                  {step.number}
                </div>
                <div className="flex flex-col gap-2 pt-1 sm:pt-2">
                  <h3 className="text-base font-semibold text-[#fafafa]">{step.title}</h3>
                  <p className="text-sm text-[#71717a] leading-relaxed max-w-lg">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="relative py-24 px-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#222] to-transparent" />

        <div className="max-w-3xl mx-auto">
          <div className="relative flex flex-col items-center text-center gap-6 p-12 rounded-3xl border border-[#1e1e1e] bg-[#0e0e0e] overflow-hidden">
            {/* Glow */}
            <div className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at 50% 100%, rgba(109,40,217,0.15), transparent 70%)",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600 shadow-xl shadow-violet-900/40">
                <Cpu className="h-6 w-6 text-white" />
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[#fafafa]">
                Ready to forge your infrastructure?
              </h2>
              <p className="text-[#71717a] max-w-md">
                No account required. Describe your stack and get your architecture
                diagram and Terraform in seconds.
              </p>
              <Link href="/forge">
                <Button variant="glow" size="xl" className="group">
                  Open InfraForge
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative border-t border-[#1a1a1a] py-8 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-600">
              <Cpu className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-[#52525b]">
              InfraForge
            </span>
          </div>
          <p className="text-xs text-[#3f3f46]">
            Built with Claude AI · Open Source
          </p>
        </div>
      </footer>
    </div>
  );
}
