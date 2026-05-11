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
  content?: string;    // question
  summary?: string;    // diagram
  diagram?: string;    // diagram
  terraform?: string;  // terraform
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
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const raw =
      response.content[0]?.type === "text" ? response.content[0].text : "";

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

  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) text = fenceMatch[1].trim();

  try {
    const parsed = JSON.parse(text);
    if (["question", "diagram", "terraform"].includes(parsed.type)) {
      return parsed as ForgeResponse;
    }
  } catch {
    // fallthrough
  }

  return { type: "question", content: text };
}
