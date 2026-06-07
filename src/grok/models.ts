/**
 * AI model definitions and metadata.
 * Model-agnostic — supports any OpenAI-compatible provider.
 */

export interface ModelDefinition {
  id: string;
  name: string;
  description: string;
  contextWindow: number;
  inputPrice: number; // per 1M tokens
  outputPrice: number; // per 1M tokens
  reasoning?: boolean;
  multiAgent?: boolean;
  aliases?: string[];
}

export const MODELS: ModelDefinition[] = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    description: "OpenAI flagship multimodal model — fast, capable, great for agent reasoning",
    contextWindow: 128_000,
    inputPrice: 2.5,
    outputPrice: 10.0,
    aliases: ["4o", "gpt4o"],
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o Mini",
    description: "Cost-effective small model for simple tasks and batch processing",
    contextWindow: 128_000,
    inputPrice: 0.15,
    outputPrice: 0.6,
    aliases: ["4o-mini", "gpt4o-mini", "mini"],
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    description: "Anthropic's balanced model — strong reasoning with excellent tool use",
    contextWindow: 200_000,
    inputPrice: 3.0,
    outputPrice: 15.0,
    reasoning: true,
    aliases: ["sonnet", "sonnet4", "claude-sonnet"],
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    description: "Anthropic's most capable model — best for complex multi-step agent tasks",
    contextWindow: 200_000,
    inputPrice: 15.0,
    outputPrice: 75.0,
    reasoning: true,
    aliases: ["opus", "opus4", "claude-opus"],
  },
  {
    id: "claude-haiku-4-5-20250514",
    name: "Claude Haiku 4.5",
    description: "Fastest Anthropic model — good for quick market lookups and simple tasks",
    contextWindow: 200_000,
    inputPrice: 0.8,
    outputPrice: 4.0,
    aliases: ["haiku", "haiku4", "claude-haiku"],
  },
  {
    id: "gpt-4.1",
    name: "GPT-4.1",
    description: "OpenAI's latest — excellent instruction following and tool calling",
    contextWindow: 1_000_000,
    inputPrice: 2.0,
    outputPrice: 8.0,
    aliases: ["4.1", "gpt4.1"],
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    description: "Google's most capable model — strong reasoning, 1M context",
    contextWindow: 1_000_000,
    inputPrice: 1.25,
    outputPrice: 10.0,
    reasoning: true,
    aliases: ["gemini", "gemini-pro"],
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    description: "Fast, cost-effective Google model — great for quick tasks",
    contextWindow: 1_000_000,
    inputPrice: 0.15,
    outputPrice: 0.6,
    aliases: ["gemini-flash", "flash"],
  },
];

const MODEL_BY_ID = new Map<string, ModelDefinition>();
const ALIAS_MAP = new Map<string, string>();

for (const m of MODELS) {
  MODEL_BY_ID.set(m.id, m);
  for (const alias of m.aliases ?? []) {
    ALIAS_MAP.set(alias.toLowerCase(), m.id);
  }
  ALIAS_MAP.set(m.id.toLowerCase(), m.id);
}

export function getModel(id: string): ModelDefinition | undefined {
  const canonical = ALIAS_MAP.get(id.toLowerCase());
  return canonical ? MODEL_BY_ID.get(canonical) : MODEL_BY_ID.get(id);
}

export function normalizeModelId(id: string): string {
  const canonical = ALIAS_MAP.get(id.toLowerCase());
  return canonical ?? id;
}

export function listModelIds(): string[] {
  return MODELS.map((m) => m.id);
}