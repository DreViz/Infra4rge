import Anthropic from "@anthropic-ai/sdk";

export const glm = new Anthropic({
  apiKey: process.env.GLM_AUTH_TOKEN!,
  baseURL: process.env.GLM_BASE_URL ?? "https://api.z.ai/api/anthropic",
});

export const GLM_MODEL = process.env.GLM_MODEL ?? "glm-5";
