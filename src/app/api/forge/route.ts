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

    const stream = glm.messages.stream({
      model: GLM_MODEL,
      max_tokens: 32000,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const response = await stream.finalMessage();

    const raw =
      response.content[0]?.type === "text" ? response.content[0].text : "";
    const stopReason = response.stop_reason;

    console.log("[forge/route] stop_reason:", stopReason, "| raw length:", raw.length);

    if (stopReason === "max_tokens") {
      console.warn("[forge/route] response was truncated at", raw.length, "chars");
      // Try to salvage terraform from truncated response
      const salvaged = trySalvageTerraform(raw);
      if (salvaged) {
        console.log("[forge/route] salvaged terraform from truncated response, length:", salvaged.length);
        return NextResponse.json({ type: "terraform", terraform: salvaged, raw });
      }
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

  // Handle code fences — pick the largest one (likely terraform)
  const allFences = [...text.matchAll(/```(?:json|hcl|terraform)?\s*([\s\S]*?)```/g)];
  if (allFences.length > 0) {
    const largest = allFences.reduce((a, b) =>
      (a[1]?.length ?? 0) >= (b[1]?.length ?? 0) ? a : b
    );
    const extracted = largest[1]?.trim() ?? "";

    if (looksLikeTerraform(extracted)) {
      console.log("[forge/route] detected terraform in code fence, length:", extracted.length);
      return { type: "terraform", terraform: extracted };
    }

    text = extracted;
  }

  // Strip language hint prefix
  if (/^hcl\n/.test(text)) text = text.slice(4);

  // Raw terraform (no JSON wrapper)
  if (looksLikeTerraform(text)) {
    console.log("[forge/route] detected raw terraform content, length:", text.length);
    return { type: "terraform", terraform: text };
  }

  // Attempt 1: Parse raw JSON
  try {
    return handleParsedJSON(JSON.parse(text));
  } catch {}

  // Attempt 2: Extract JSON object from surrounding text
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return handleParsedJSON(JSON.parse(jsonMatch[0]));
    } catch {}
  }

  // Attempt 3: Extract terraform from inside broken JSON
  const tfSalvage = trySalvageTerraform(text);
  if (tfSalvage) {
    console.log("[forge/route] salvaged terraform from broken JSON, length:", tfSalvage.length);
    return { type: "terraform", terraform: tfSalvage };
  }

  console.error("[forge/route] all parse attempts failed, raw length:", text.length);

  if (text.startsWith("{")) {
    return {
      type: "error",
      content: "The response was cut off before it could be parsed. Try saying \"generate terraform without comments\" to keep the output shorter.",
    };
  }

  return { type: "question", content: text };
}

/**
 * Try to extract terraform from a broken or truncated JSON response.
 * Looks for the terraform field value by finding HCL patterns.
 */
function trySalvageTerraform(text: string): string | null {
  // Strategy 1: Find "terraform": "..." and extract the HCL inside
  const tfFieldMatch = text.match(/"terraform"\s*:\s*"([\s\S]*)/);
  if (tfFieldMatch) {
    let tf = tfFieldMatch[1];
    // Remove trailing JSON artifacts (unfinished string)
    tf = tf.replace(/"\s*[}\]]*\s*$/, "");
    // Unescape JSON string escapes
    tf = tf
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\"/g, '"')
      .replace(/\\\\/g, "\\");
    tf = tf.trim();
    if (looksLikeTerraform(tf)) return tf;
  }

  // Strategy 2: Find raw HCL patterns in the text (resource blocks, etc.)
  const resourceBlocks = text.match(/resource\s+"[\w_]+"\s+"[\w_-]+"\s*\{[\s\S]*?(?=\nresource|\nprovider|\nvariable|\noutput|\nmodule|$)/g);
  if (resourceBlocks && resourceBlocks.length >= 2) {
    const combined = resourceBlocks.join("\n\n");
    if (looksLikeTerraform(combined)) return combined;
  }

  // Strategy 3: Look for terraform block start to end
  const hclMatch = text.match(/(terraform\s*\{[\s\S]*|(?:resource|provider|variable|module)\s+"[\s\S]*)/);
  if (hclMatch) {
    let tf = hclMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();
    // Remove trailing JSON artifacts
    tf = tf.replace(/"\s*[}\]]*\s*$/, "");
    if (looksLikeTerraform(tf)) return tf;
  }

  return null;
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

function handleParsedJSON(parsed: Record<string, unknown>): ForgeResponse {
  const type: string = (parsed.type as string) ?? "";
  const normalizedType = type.startsWith("question") ? "question" : type;

  let content: string | undefined = parsed.content as string;
  if (!content && Array.isArray(parsed.questions)) {
    content = (parsed.questions as string[])
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
  }
  if (!content && Array.isArray(parsed.content)) {
    content = (parsed.content as string[])
      .map((q, i) => `${i + 1}. ${q}`)
      .join("\n");
  }

  if (normalizedType === "question") return { type: "question", content };
  if (normalizedType === "diagram") return { type: "diagram", summary: parsed.summary as string, diagram: parsed.diagram as string };
  if (normalizedType === "terraform") {
    const tf = ((parsed.terraform as string) ?? "").replace(/^hcl\n/, "");
    return { type: "terraform", terraform: tf };
  }

  return { type: "question", content: content ?? "" };
}
