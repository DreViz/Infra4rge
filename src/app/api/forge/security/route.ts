import { NextRequest, NextResponse } from "next/server";
import { glm, GLM_MODEL } from "@/lib/glm";
import { SECURITY_SYSTEM_PROMPT } from "@/lib/security-prompt";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type Grade = "A" | "B" | "C" | "D" | "F";

export interface SecurityFinding {
  id: string;
  title: string;
  severity: Severity;
  resource: string;
  description: string;
  fix: string;
}

export interface SecurityPassed {
  id: string;
  title: string;
  resource: string;
}

export interface SecurityAudit {
  score: number;
  grade: Grade;
  summary: string;
  findings: SecurityFinding[];
  passed: SecurityPassed[];
  fixAllInstruction: string;
}

export interface SecurityResponse {
  audit?: SecurityAudit;
  error?: string;
}

export async function POST(req: NextRequest) {
  try {
    const { terraform }: { terraform: string } = await req.json();

    if (!terraform?.trim()) {
      return NextResponse.json({ error: "No Terraform provided" }, { status: 400 });
    }

    console.log("[security/route] auditing terraform, length:", terraform.length);

    const stream = glm.messages.stream({
      model: GLM_MODEL,
      max_tokens: 8000,
      system: SECURITY_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Perform a security audit on this Terraform configuration:\n\n${terraform}`,
        },
      ],
    });

    const response = await stream.finalMessage();

    const raw = response.content[0]?.type === "text" ? response.content[0].text : "";
    console.log("[security/route] raw response length:", raw.length);

    const audit = parseSecurityResponse(raw);
    return NextResponse.json({ audit });

  } catch (err: unknown) {
    console.error("[security/route] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function parseSecurityResponse(raw: string): SecurityAudit | undefined {
  let text = raw.trim();
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  try {
    const parsed = JSON.parse(text);
    parsed.score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
    parsed.findings = (parsed.findings ?? []).map((f: SecurityFinding) => ({
      ...f,
      severity: (["CRITICAL", "HIGH", "MEDIUM", "LOW"].includes(f.severity)
        ? f.severity
        : "MEDIUM") as Severity,
    }));
    parsed.passed = parsed.passed ?? [];
    return parsed as SecurityAudit;
  } catch (e) {
    console.error("[security/route] JSON parse failed:", e);
    return undefined;
  }
}
