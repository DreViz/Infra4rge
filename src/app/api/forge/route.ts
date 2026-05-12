import { NextRequest, NextResponse } from "next/server";
import { glm, GLM_MODEL } from "@/lib/glm";
import { SYSTEM_PROMPT } from "@/lib/prompts";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ForgeRequest {
  messages: ChatMessage[];
}

export interface ForgeResponse {
  type: "question" | "diagram" | "terraform" | "error";
  content?: string;
  summary?: string;
  diagram?: string;
  terraform?: string;
  raw?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: ForgeRequest = await req.json();
    const { messages } = body;

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { type: "error", content: "No messages provided" },
        { status: 400 }
      );
    }

    const response = await glm.messages.create({
      model: GLM_MODEL,
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const raw =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const stopReason = response.stop_reason;

    console.log("[forge/route] stop_reason:", stopReason, "| raw length:", raw.length);

    // Warn if the model hit the token limit mid-response
    if (stopReason === "max_tokens") {
      console.warn("[forge/route] response was truncated — increase max_tokens or simplify prompt");
      return NextResponse.json({
        type: "error",
        content: "The response was too long and got cut off. Try asking for a simpler architecture, or say \"generate terraform without comments\" to reduce output size.",
      });
    }

    const parsed = parseAIResponse(raw);
    return NextResponse.json({ ...parsed, raw });

  } catch (err: unknown) {
    console.error("[forge/route] error:", err);
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json(
      { type: "error", content: `AI request failed: ${message}` },
      { status: 500 }
    );
  }
}

function parseAIResponse(raw: string): ForgeResponse {
  let text = raw.trim();

  // Handle multiple code fences — pick the largest one (likely terraform)
  const allFences = [...text.matchAll(/```(?:json|hcl|terraform)?\s*([\s\S]*?)```/g)];
  if (allFences.length > 0) {
    const largest = allFences.reduce((a, b) =>
      (a[1]?.length ?? 0) >= (b[1]?.length ?? 0) ? a : b
    );
    const extracted = largest[1]?.trim() ?? "";

    // If extracted content looks like HCL/Terraform, return it directly
    if (looksLikeTerraform(extracted)) {
      console.log("[forge/route] detected terraform in code fence, length:", extracted.length);
      return { type: "terraform", terraform: extracted };
    }

    text = extracted;
  }

  // Strip language hint prefix like "hcl\n" that sometimes leaks in
  if (/^hcl\n/.test(text)) text = text.slice(4);

  // If the raw text itself looks like terraform (no JSON wrapper at all)
  if (looksLikeTerraform(text)) {
    console.log("[forge/route] detected raw terraform content, length:", text.length);
    return { type: "terraform", terraform: text };
  }

  try {
    const parsed = JSON.parse(text);

    const type: string = parsed.type ?? "";
    const normalizedType = type.startsWith("question") ? "question" : type;

    let content: string | undefined = parsed.content;
    if (!content && Array.isArray(parsed.questions)) {
      content = parsed.questions
        .map((q: string, i: number) => `${i + 1}. ${q}`)
        .join("\n");
    }
    if (!content && Array.isArray(parsed.content)) {
      content = (parsed.content as string[])
        .map((q, i) => `${i + 1}. ${q}`)
        .join("\n");
    }

    if (normalizedType === "question") return { type: "question", content };
    if (normalizedType === "diagram") return { type: "diagram", summary: parsed.summary, diagram: parsed.diagram };
    if (normalizedType === "terraform") {
      // Strip "hcl\n" prefix from terraform field if present
      const tf = (parsed.terraform ?? "").replace(/^hcl\n/, "");
      return { type: "terraform", terraform: tf };
    }

  } catch (e) {
    console.error("[forge/route] JSON parse failed:", e);

    // Detect truncated JSON — give a helpful message instead of dumping raw text
    if (text.startsWith("{")) {
      return {
        type: "error",
        content: "The response was cut off before it could be parsed. Try saying \"generate terraform without comments\" to keep the output shorter.",
      };
    }
  }

  return { type: "question", content: text };
}

function looksLikeTerraform(text: string): boolean {
  if (text.length < 50) return false;
  const terraformPatterns = [
    /^terraform\s*\{/m,
    /^resource\s+"aws_/m,
    /^resource\s+"google_/m,
    /^resource\s+"azurerm_/m,
    /^provider\s+"aws"/m,
    /^variable\s+"/m,
    /^output\s+"/m,
  ];
  return terraformPatterns.some((p) => p.test(text));
}
