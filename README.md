# InfraForge

AI-powered cloud infrastructure generator. Describe what you want to build in plain English, and get production-ready Terraform code with architecture diagrams, cost estimates, and security audits — all in your browser, no account required.

## What it does

**Describe** your infrastructure in natural language. InfraForge's AI architect asks clarifying questions, designs an architecture, and generates everything you need to deploy it.

- **Architecture Diagrams** — Interactive Mermaid diagrams showing all components and their connections
- **Terraform Code** — Production-ready HCL for AWS, GCP, and Azure with proper modules, variables, and state management
- **Cost Estimation** — Monthly cost breakdown by resource type with optimization suggestions
- **Security Audits** — Automated vulnerability scanning with severity ratings, fix recommendations, and an overall security score
- **Iterative Refinement** — Modify the architecture through conversation. Add caching, switch to serverless, make it multi-region — just say it
- **Project History** — Saves up to 20 projects locally in your browser. Export any project as a ZIP with Terraform code, diagram, and README
- **Mobile Friendly** — Responsive interface that works on phone, tablet, and desktop

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org) (App Router), [React 19](https://react.dev), [TypeScript](https://www.typescriptlang.org) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com), custom "Midnight Obsidian" dark theme with oklch colors |
| UI Components | [shadcn/ui](https://ui.shadcn.com) (Base Nova style), [Radix UI](https://www.radix-ui.com), [Lucide](https://lucide.dev) icons |
| AI | [GLM-5](https://z.ai) via Anthropic-compatible API, streaming responses |
| Diagrams | [Mermaid.js](https://mermaid.js.org) for architecture visualization |
| Export | [JSZip](https://stuk.github.io/jszip/) for project ZIP downloads |

## Getting Started

### Prerequisites

- Node.js 18+
- A [z.ai](https://z.ai) API token for the GLM-5 model

### Install

```bash
git clone https://github.com/DreViz/Infra4rge.git
cd Infra4rge
npm install
```

### Environment Variables

Create a `.env.local` file in the project root:

```env
GLM_AUTH_TOKEN=your_zai_api_token
GLM_BASE_URL=https://api.z.ai/api/anthropic
GLM_MODEL=glm-5
```

> `GLM_BASE_URL` and `GLM_MODEL` are optional — they default to the values shown above.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Hit **"Start Building"** to open the Forge workspace.

## Project Structure

```
src/
├── app/
│   ├── api/forge/
│   │   ├── route.ts          # Main AI chat endpoint (streaming)
│   │   ├── cost/route.ts     # Cost estimation endpoint
│   │   └── security/route.ts # Security audit endpoint
│   ├── forge/page.tsx        # Forge workspace page
│   ├── page.tsx              # Landing page
│   ├── layout.tsx            # Root layout
│   └── globals.css           # Theme, custom utilities
├── components/
│   ├── forge/                # Workspace components
│   │   ├── workspace.tsx     # Main workspace orchestrator
│   │   ├── chat-panel.tsx    # AI chat interface
│   │   ├── diagram-panel.tsx # Mermaid diagram renderer
│   │   ├── code-panel.tsx    # Terraform code viewer
│   │   ├── cost-panel.tsx    # Cost breakdown display
│   │   ├── security-panel.tsx# Security audit display
│   │   ├── forge-toolbar.tsx # Top toolbar
│   │   └── history-sidebar.tsx # Project history sidebar
│   ├── landing/              # Landing page sections
│   ├── layout/               # Navbar
│   └── ui/                   # shadcn/ui primitives
└── lib/
    ├── glm.ts                # AI client (Anthropic SDK)
    ├── prompts.ts            # System prompt & Mermaid rules
    ├── cost-prompt.ts        # Cost estimation prompt
    ├── security-prompt.ts    # Security audit prompt
    ├── storage.ts            # LocalStorage project management
    └── utils.ts              # Utility functions
```


