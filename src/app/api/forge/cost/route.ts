import { NextRequest, NextResponse } from "next/server";
import { glm, GLM_MODEL } from "@/lib/glm";
import { COST_SYSTEM_PROMPT } from "@/lib/cost-prompt";

export interface CostResource {
  name: string;
  resource: string;
  type: string;
  category: "compute" | "database" | "network" | "storage" | "other";
  monthlyCost: number;
  details: string;
}

export interface CostOptimization {
  title: string;
  saving: number;
  description: string;
}

export interface CostEstimate {
  currency: string;
  region: string;
  assumptions: string[];
  resources: CostResource[];
  totalMonthly: number;
  totalYearly: number;
  optimizations: CostOptimization[];
}

export interface CostResponse {
  estimate?: CostEstimate;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { terraform }: { terraform: string } = await req.json();

    if (!terraform?.trim()) {
      return NextResponse.json({ error: "No Terraform provided" }, { status: 400 });
    }

    console.log("[cost/route] estimating cost for terraform, length:", terraform.length);

    const stream = glm.messages.stream({
      model: GLM_MODEL,
      max_tokens: 6000,
      system: COST_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Estimate the monthly cost for this Terraform configuration:\n\n${terraform}`,
        },
      ],
    });

    const response = await stream.finalMessage();

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "";
    console.log("[cost/route] raw response length:", raw.length);

    const estimate = parseCostResponse(raw);
    return NextResponse.json({ estimate });

  } catch (err: unknown) {
    console.error("[cost/route] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseCostResponse(raw: string): CostEstimate | undefined {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  try {
    const parsed = JSON.parse(text);
    if (parsed.resources) {
      parsed.resources = parsed.resources.map((r: CostResource) => ({
        ...r,
        monthlyCost: Number(r.monthlyCost) || 0,
      }));
    }
    if (parsed.optimizations) {
      parsed.optimizations = parsed.optimizations.map((o: CostOptimization) => ({
        ...o,
        saving: Number(o.saving) || 0,
      }));
    }
    parsed.totalMonthly = Number(parsed.totalMonthly) || 0;
    parsed.totalYearly = Number(parsed.totalYearly) || parsed.totalMonthly * 12;
    return parsed as CostEstimate;
  } catch (e) {
    console.error("[cost/route] JSON parse failed:", e);
    return undefined;
  }
}
