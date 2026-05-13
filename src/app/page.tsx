import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
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
  History,
} from "lucide-react";

const features = [
  {
    icon: Network,
    title: "Architecture Diagrams",
    description: "Color-coded cloud diagrams generated from plain English. Zoom, refine, and download as PNG.",
    color: "text-violet-400",
    bg: "bg-violet-950/20",
    border: "border-violet-900/20",
  },
  {
    icon: Terminal,
    title: "Production Terraform",
    description: "HCL with KMS encryption, IAM least-privilege, multi-AZ, and security defaults — out of the box.",
    color: "text-cyan-400",
    bg: "bg-cyan-950/20",
    border: "border-cyan-900/20",
  },
  {
    icon: Zap,
    title: "Conversational Refinement",
    description: "Say \"add Redis\" or \"make it serverless\" — diagram and Terraform both update in the same message.",
    color: "text-violet-400",
    bg: "bg-violet-950/20",
    border: "border-violet-900/20",
  },
  {
    icon: DollarSign,
    title: "Cost Estimation",
    description: "Per-resource monthly cost breakdown with optimization suggestions, auto-generated with every Terraform.",
    color: "text-yellow-400",
    bg: "bg-yellow-950/20",
    border: "border-yellow-900/20",
  },
  {
    icon: Shield,
    title: "Security Audit",
    description: "Security score A–F with Checkov findings by severity. One-click fix sends the patch back to the AI.",
    color: "text-emerald-400",
    bg: "bg-emerald-950/20",
    border: "border-emerald-900/20",
  },
  {
    icon: History,
    title: "Project History",
    description: "Every architecture auto-saves locally. Restore any past project instantly or export as a ZIP.",
    color: "text-[#a1a1aa]",
    bg: "bg-[#161616]",
    border: "border-[#1e1e1e]",
  },
  {
    icon: GitBranch,
    title: "GitHub Integration",
    description: "Push Terraform to a new repo with GitHub Actions CI/CD wired up for your team.",
    color: "text-[#52525b]",
    bg: "bg-[#111]",
    border: "border-[#1a1a1a]",
    soon: true,
  },
];

const steps = [
  {
    number: "01",
    title: "Describe your project",
    detail: "AI asks smart questions",
    description:
      "Tell InfraForge what you're building. It detects your domain — streaming, SaaS, ML, e-commerce — and asks only the 1-2 questions that actually change the architecture.",
    output: null,
  },
  {
    number: "02",
    title: "Review the architecture diagram",
    detail: "Color-coded, live preview",
    description:
      "A cloud architecture diagram appears instantly. Refine it by chatting — \"add Redis\", \"make it multi-region\", \"switch to Fargate\" — diagram updates in real time.",
    output: "→ Architecture Diagram (PNG)",
  },
  {
    number: "03",
    title: "Confirm and generate Terraform",
    detail: "Production-ready HCL",
    description:
      "One click generates complete Terraform with KMS encryption, least-privilege IAM, multi-AZ, VPC flow logs, S3 versioning, and all security defaults enforced from line one.",
    output: "→ main.tf",
  },
  {
    number: "04",
    title: "Cost breakdown + Security audit",
    detail: "Auto-generated alongside Terraform",
    description:
      "Monthly cost per resource appears automatically. Security is scored A–F with every misconfiguration listed by severity. One-click \"Fix All\" patches the Terraform.",
    output: "→ Cost report · Security score",
  },
  {
    number: "05",
    title: "Save and export",
    detail: "Never lose your work",
    description:
      "Every architecture auto-saves to your local history with its cost and security score. Restore any past project in one click, or export as a ZIP with Terraform and diagram.",
    output: "→ Project ZIP · History sidebar",
  },
];

const examplePrompts = [
  "SaaS project management tool — Next.js, FastAPI, PostgreSQL, Redis on AWS",
  "Video streaming platform with HLS, transcoding, and CDN delivery",
  "ML inference API with GPU instances, auto-scaling, and S3 data lake",
  "Multi-region e-commerce with Kubernetes, API gateway, and message queue",
];

export default function HomePage() {
  return (
    <div className="min-h-full bg-[#080808]">
      <Navbar />

      {/* ─── Hero ─── */}
      <section className="relative flex flex-col items-center justify-center min-h-screen px-6 pt-14 overflow-hidden">
        {/* Background glow */}
        <div
          className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] pointer-events-none"
          style={{
            background: "radial-gradient(ellipse, rgba(109,40,217,0.18) 0%, rgba(6,182,212,0.06) 50%, transparent 70%)",
            filter: "blur(80px)",
          }}
        />
        {/* Subtle grid */}
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

        <div className="relative z-10 flex flex-col items-center text-center max-w-3xl mx-auto gap-7">
          {/* Pill */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-[#1e1e1e] bg-[#111]/60 text-xs text-[#71717a]">
            <Sparkles className="h-3 w-3 text-violet-400" />
            <span>Powered by GLM-5</span>
            <span className="h-3 w-px bg-[#2a2a2a]" />
            <span className="text-[#a1a1aa]">Diagram · Terraform · Cost · Security</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl md:text-[72px] font-bold tracking-tight leading-[1.04]">
            <span className="text-[#fafafa]">From description</span>
            <br />
            <span className="gradient-text">to production infra.</span>
          </h1>

          {/* Subtitle */}
          <p className="text-base sm:text-lg text-[#52525b] max-w-lg leading-relaxed">
            Describe your app. Get an architecture diagram, production Terraform,
            monthly cost estimate, and security audit — in one conversation.
          </p>

          {/* Single CTA */}
          <Link href="/forge">
            <Button variant="glow" size="lg" className="group mt-1">
              Start Building Free
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>

          {/* Example prompts */}
          <div className="flex flex-col items-center gap-3 w-full max-w-2xl mt-2">
            <p className="text-[10px] text-[#2a2a2a] uppercase tracking-widest">Try these</p>
            <div className="flex flex-wrap justify-center gap-2">
              {examplePrompts.map((prompt, i) => (
                <Link key={i} href="/forge">
                  <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#1a1a1a] bg-[#0e0e0e] text-xs text-[#52525b] hover:text-[#a1a1aa] hover:border-[#262626] transition-all cursor-pointer">
                    <ChevronRight className="h-2.5 w-2.5 shrink-0 text-violet-700" />
                    <span>{prompt}</span>
                  </button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section id="features" className="relative py-28 px-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e1e1e] to-transparent" />
        <div className="max-w-5xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-14">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fafafa]">
              Everything from description to deploy
            </h2>
            <p className="text-sm text-[#52525b] max-w-md">
              No context switching. No stitching five tools together.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {features.map((feature, i) => {
              const Icon = feature.icon;
              return (
                <div
                  key={i}
                  className={`relative flex flex-col gap-3 p-5 rounded-2xl border bg-[#0c0c0c] transition-all duration-300 hover:bg-[#0f0f0f] ${feature.border} ${feature.soon ? "opacity-50" : ""}`}
                >
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg border ${feature.bg} ${feature.border}`}>
                    <Icon className={`h-3.5 w-3.5 ${feature.color}`} />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-[#e4e4e7]">{feature.title}</h3>
                      {feature.soon && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded border border-[#222] text-[#52525b]">Soon</span>
                      )}
                    </div>
                    <p className="text-xs text-[#52525b] leading-relaxed">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How it works ─── */}
      <section id="how-it-works" className="relative py-28 px-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e1e1e] to-transparent" />
        <div className="max-w-3xl mx-auto">
          <div className="flex flex-col items-center text-center gap-3 mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fafafa]">
              From idea to infrastructure in 5 steps
            </h2>
            <p className="text-sm text-[#52525b] max-w-sm">
              Every output is production-ready — not a starting point.
            </p>
          </div>

          <div className="relative">
            {/* Vertical connector */}
            <div className="absolute left-5 top-6 bottom-6 w-px bg-gradient-to-b from-violet-700/50 via-violet-900/20 to-transparent hidden sm:block" />

            <div className="flex flex-col gap-0">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-6 pb-10 last:pb-0">
                  {/* Circle */}
                  <div className="relative shrink-0 hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-[#2a2a2a] bg-[#0c0c0c] text-[10px] font-mono font-semibold text-violet-500 z-10">
                    {step.number}
                  </div>

                  <div className="flex flex-col gap-2 pt-2 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-[#fafafa]">{step.title}</h3>
                      <span className="text-[10px] text-[#3f3f46] border border-[#222] rounded px-1.5 py-0.5">
                        {step.detail}
                      </span>
                    </div>
                    <p className="text-sm text-[#52525b] leading-relaxed">{step.description}</p>
                    {step.output && (
                      <p className="text-[11px] text-violet-500/70 font-mono mt-0.5">{step.output}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-24 px-6">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#1e1e1e] to-transparent" />
        <div className="max-w-2xl mx-auto">
          <div className="relative flex flex-col items-center text-center gap-5 p-10 rounded-3xl border border-[#1a1a1a] bg-[#0c0c0c] overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse at 50% 120%, rgba(109,40,217,0.12), transparent 65%)" }}
            />
            <div className="relative z-10 flex flex-col items-center gap-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 shadow-lg shadow-violet-900/40">
                <Cpu className="h-5 w-5 text-white" />
              </div>
              <div className="flex flex-col gap-2">
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#fafafa]">
                  Ready to forge your infrastructure?
                </h2>
                <p className="text-sm text-[#52525b]">
                  No account required. Works in your browser. Saves locally.
                </p>
              </div>
              <Link href="/forge">
                <Button variant="glow" size="lg" className="group">
                  Open InfraForge
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative border-t border-[#1a1a1a] py-7 px-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="flex h-5 w-5 items-center justify-center rounded-md bg-violet-600">
              <Cpu className="h-3 w-3 text-white" />
            </div>
            <span className="text-xs font-medium text-[#3f3f46]">InfraForge</span>
          </div>
          <p className="text-xs text-[#2a2a2a]">Open Source · No account required</p>
        </div>
      </footer>
    </div>
  );
}
