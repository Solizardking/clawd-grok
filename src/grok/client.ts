import { createXai, type XaiProvider } from "@ai-sdk/xai";
import { generateText, type CoreMessage, type ModelMessage } from "ai";
import { getModelInfo, type ModelDefinition } from "./models";

export type { XaiProvider };

const DEFAULT_TITLE_MODEL = "gpt-4o-mini";
const DEFAULT_RECAP_MODEL = "gpt-4o-mini";

export interface ResolvedModelRuntime {
  model: ReturnType<XaiProvider["chat"]> | ReturnType<XaiProvider["responses"]>;
  modelId: string;
  modelInfo: ModelDefinition | undefined;
  providerOptions?: Record<string, unknown>;
}

export function createProvider(apiKey: string, baseURL?: string): XaiProvider {
  return createXai({
    apiKey,
    baseURL: baseURL || process.env.AI_BASE_URL || process.env.GROK_BASE_URL || "https://api.x.ai/v1",
  });
}

export function resolveModelRuntime(provider: XaiProvider, modelId: string): ResolvedModelRuntime {
  const info = getModelInfo(modelId);
  const chatModel = provider.chat(modelId);

  return {
    model: chatModel,
    modelId,
    modelInfo: info,
    providerOptions: undefined,
  };
}

export interface TitleResult {
  title: string;
  modelId: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

export async function generateTitle(
  provider: XaiProvider,
  userMessage: string,
  modelId = DEFAULT_TITLE_MODEL,
): Promise<TitleResult> {
  try {
    const result = await generateText({
      model: provider.chat(modelId),
      system: "Generate a short, descriptive title (max 6 words) for this conversation. Return only the title.",
      messages: [{ role: "user", content: userMessage.slice(0, 500) }],
      maxOutputTokens: 32,
    });

    return {
      title: result.text?.trim() || "New session",
      modelId,
      usage: result.usage ? {
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
    };
  } catch {
    return { title: "New session", modelId };
  }
}

export interface RecapResult {
  recap?: string;
  modelId: string;
  usage?: { inputTokens?: number; outputTokens?: number; totalTokens?: number };
}

export async function generateRecap(
  provider: XaiProvider,
  prompt: string,
  signal?: AbortSignal,
  modelId = DEFAULT_RECAP_MODEL,
): Promise<RecapResult> {
  try {
    const result = await generateText({
      model: provider.chat(modelId),
      system: "You generate concise session recaps. Summarize the conversation in 2-3 sentences.",
      messages: [{ role: "user", content: prompt }],
      maxOutputTokens: 200,
      abortSignal: signal,
    });

    return {
      recap: result.text?.trim() || undefined,
      modelId,
      usage: result.usage ? {
        inputTokens: result.usage.promptTokens,
        outputTokens: result.usage.completionTokens,
        totalTokens: result.usage.totalTokens,
      } : undefined,
    };
  } catch {
    return { modelId };
  }
}