import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, GitBranch, DollarSign, Shield, Zap, Clock } from "lucide-react";

const features = [
  {
    icon: MessageSquare,
    title: "Natural Language Input",
    description: "Describe your infrastructure in plain English. Our AI understands context and technical requirements.",
  },
  {
    icon: GitBranch,
    title: "Architecture Diagrams",
    description: "Instantly visualize your infrastructure with interactive Mermaid diagrams showing all components and connections.",
  },
  {
    icon: DollarSign,
    title: "Cost Estimation",
    description: "Get real-time cost projections across AWS, GCP, and Azure before you deploy a single resource.",
  },
  {
    icon: Shield,
    title: "Security Audits",
    description: "Built-in security scanning identifies vulnerabilities and suggests best practices for compliance.",
  },
  {
    icon: Zap,
    title: "Terraform Export",
    description: "Export production-ready Terraform code with proper modules, variables, and state management.",
  },
  {
    icon: Clock,
    title: "Version History",
    description: "Track all iterations of your infrastructure designs with full history and rollback capabilities.",
  },
];

export function Features() {
  return (
    <section id="features" className="px-6 py-20 md:py-32">
      <div className="mx-auto max-w-7xl">
        <div className="text-center">
          <h2 className="text-balance text-3xl font-bold tracking-tight md:text-4xl">
            Everything you need to build
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-muted-foreground">
            From ideation to deployment, InfraForge provides all the tools to design,
            validate, and ship cloud infrastructure with confidence.
          </p>
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <Card
              key={feature.title}
              className="group border-border/40 bg-card/50 transition-all duration-300 hover:border-primary/40 hover:bg-card"
            >
              <CardHeader>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                  <feature.icon className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
