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

  if (/^hcl\n/.test(text)) text = text.slice(4);

  if (looksLikeTerraform(text)) {
    console.log("[forge/route] detected raw terraform content, length:", text.length);
    return { type: "terraform", terraform: text };
  }

  const mermaidResult = tryExtractMermaid(text);
  if (mermaidResult) {
    console.log("[forge/route] extracted raw mermaid diagram, length:", (mermaidResult.diagram ?? "").length);
    return mermaidResult;
  }

  try {
    return handleParsedJSON(JSON.parse(text));
  } catch {}

  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return handleParsedJSON(JSON.parse(jsonMatch[0]));
    } catch {}
  }

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

function trySalvageTerraform(text: string): string | null {
  const tfFieldMatch = text.match(/"terraform"\s*:\s*"([\s\S]*)/);
  if (tfFieldMatch) {
    let tf = tfFieldMatch[1];
    tf = tf.replace(/"\s*[}\]]*\s*$/, "");
    tf = tf
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\"/g, '"')
      .replace(/\\\\/g, "\\");
    tf = tf.trim();
    if (looksLikeTerraform(tf)) return tf;
  }

  const resourceBlocks = text.match(/resource\s+"[\w_]+"\s+"[\w_-]+"\s*\{[\s\S]*?(?=\nresource|\nprovider|\nvariable|\noutput|\nmodule|$)/g);
  if (resourceBlocks && resourceBlocks.length >= 2) {
    const combined = resourceBlocks.join("\n\n");
    if (looksLikeTerraform(combined)) return combined;
  }

  const hclMatch = text.match(/(terraform\s*\{[\s\S]*|(?:resource|provider|variable|module)\s+"[\s\S]*)/);
  if (hclMatch) {
    let tf = hclMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\\"/g, '"')
      .replace(/\\\\/g, "\\")
      .trim();
    tf = tf.replace(/"\s*[}\]]*\s*$/, "");
    if (looksLikeTerraform(tf)) return tf;
  }

  return null;
}

function tryExtractMermaid(text: string): ForgeResponse | null {
  const mermaidStartPatterns = [
    /Mermaid diagram:\s*\n/gi,
    /```mermaid\s*\n/gi,
  ];

  for (const pattern of mermaidStartPatterns) {
    const match = pattern.exec(text);
    if (!match) continue;

    const afterMatch = text.slice(match.index + match[0].length);

    const mermaidMatch = afterMatch.match(
      /([\s\S]*?)(?:```|\n\n[A-Z]|\n\d+\.|$)/
    );
    if (!mermaidMatch) continue;

    let diagram = mermaidMatch[1].trim();
    if (diagram.length < 50) {
      diagram = afterMatch.trim();
    }

    if (!looksLikeMermaid(diagram)) continue;

    const summary = text.slice(0, match.index).trim();

    return {
      type: "diagram",
      summary: summary || "Architecture designed.",
      diagram,
    };
  }

  const rawGraphMatch = text.match(/^(graph\s+(?:TB|BT|LR|RL|TD)\s*\n[\s\S]{50,})/m);
  if (rawGraphMatch && looksLikeMermaid(rawGraphMatch[1])) {
    const diagram = rawGraphMatch[1].trim();
    const summary = text.slice(0, text.indexOf(rawGraphMatch[0])).trim();
    return {
      type: "diagram",
      summary: summary || "Architecture designed.",
      diagram,
    };
  }

  return null;
}

function looksLikeMermaid(text: string): boolean {
  if (text.length < 30) return false;
  const patterns = [
    /^graph\s+(TB|BT|LR|RL|TD)/m,
    /^flowchart\s+(TB|BT|LR|RL|TD)/m,
    /^sequenceDiagram/m,
    /^\s*\w+\[.*?\]\s*-->/m,
    /^\s*\w+.*?-->.*?\w+/m,
    /^classDef\s/m,
  ];
  return patterns.some((p) => p.test(text));
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
  if (normalizedType === "diagram") {
    let summary = (parsed.summary as string) ?? "";
    const diagram = (parsed.diagram as string) ?? "";
    if (summary.includes("Mermaid diagram:") || summary.match(/^graph\s+(TB|BT|LR|RL|TD)/m)) {
      summary = summary.split(/Mermaid diagram:/i)[0].trim();
    }
    return { type: "diagram", summary: summary || "Architecture designed.", diagram };
  }
  if (normalizedType === "terraform") {
    const tf = ((parsed.terraform as string) ?? "").replace(/^hcl\n/, "");
    return { type: "terraform", terraform: tf };
  }

  return { type: "question", content: content ?? "" };
}
