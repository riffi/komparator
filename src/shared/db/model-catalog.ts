export type CatalogImportPayload = {
  version: string;
  sourceLabel: string;
  providers: Array<{
    id: string;
    canonicalSlug: string;
    name: string;
    color: string;
    isActive?: boolean;
  }>;
  models: Array<{
    id: string;
    providerId: string;
    name: string;
    version: string;
    displayName: string;
    aliases?: string[];
    status?: "active" | "deprecated";
  }>;
  presets: Array<{
    id: string;
    title: string;
    description: string;
    modelIds: string[];
  }>;
};

export const builtInModelCatalog: CatalogImportPayload = {
  version: "2026-03-23",
  sourceLabel: "Built-in catalog fallback",
  providers: [
    { id: "catalog-provider-anthropic", canonicalSlug: "anthropic", name: "Anthropic", color: "#e8755a" },
    { id: "catalog-provider-openai", canonicalSlug: "openai", name: "OpenAI", color: "#5ec269" },
    { id: "catalog-provider-google", canonicalSlug: "google", name: "Google", color: "#4a9eed" },
    { id: "catalog-provider-minimax", canonicalSlug: "minimax", name: "MiniMax", color: "#22c55e" },
    { id: "catalog-provider-zai", canonicalSlug: "z-ai", name: "Z.ai", color: "#38bdf8" },
    { id: "catalog-provider-moonshot", canonicalSlug: "moonshot", name: "Moonshot", color: "#f97316" },
    { id: "catalog-provider-meta", canonicalSlug: "meta", name: "Meta", color: "#a578e6" },
    { id: "catalog-provider-xai", canonicalSlug: "xai", name: "xAI", color: "#9a9ca0" },
    { id: "catalog-provider-mistral", canonicalSlug: "mistral", name: "Mistral", color: "#f59e0b" },
    { id: "catalog-provider-xiaomi", canonicalSlug: "xiaomi", name: "Xiaomi", color: "#fb923c" }
  ],
  models: [
    {
      id: "catalog-model-claude-opus-4-6",
      providerId: "catalog-provider-anthropic",
      name: "Claude",
      version: "Opus 4.6",
      displayName: "Claude Opus 4.6",
      aliases: ["claude opus 4.6", "claude-opus-4-6", "opus 4.6"]
    },
    {
      id: "catalog-model-claude-opus-4-6-thinking",
      providerId: "catalog-provider-anthropic",
      name: "Claude",
      version: "Opus 4.6 Thinking",
      displayName: "Claude Opus 4.6 Thinking",
      aliases: ["claude opus 4.6 thinking", "claude-opus-4-6-thinking"]
    },
    {
      id: "catalog-model-claude-sonnet-4-6",
      providerId: "catalog-provider-anthropic",
      name: "Claude",
      version: "Sonnet 4.6",
      displayName: "Claude Sonnet 4.6",
      aliases: ["claude sonnet 4.6", "claude-sonnet-4-6", "sonnet 4.6"]
    },
    {
      id: "catalog-model-claude-opus-4-5-thinking-32k",
      providerId: "catalog-provider-anthropic",
      name: "Claude",
      version: "Opus 4.5 Thinking 32k",
      displayName: "Claude Opus 4.5 Thinking 32k",
      aliases: ["claude opus 4.5 thinking 32k", "claude-opus-4-5-20251101-thinking-32k"]
    },
    {
      id: "catalog-model-claude-opus-4-5",
      providerId: "catalog-provider-anthropic",
      name: "Claude",
      version: "Opus 4.5",
      displayName: "Claude Opus 4.5",
      aliases: ["claude opus 4.5", "claude-opus-4-5-20251101"]
    },
    {
      id: "catalog-model-gpt-5-4-high-codex-harness",
      providerId: "catalog-provider-openai",
      name: "GPT",
      version: "5.4 High (codex-harness)",
      displayName: "GPT-5.4 High (codex-harness)",
      aliases: ["gpt-5.4-high", "gpt-5.4-high (codex-harness)"]
    },
    {
      id: "catalog-model-gemini-3-1-pro-preview",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "3.1 Pro Preview",
      displayName: "Gemini 3.1 Pro Preview",
      aliases: ["gemini-3.1-pro-preview", "gemini 3.1 pro preview"]
    },
    {
      id: "catalog-model-minimax-m2-7",
      providerId: "catalog-provider-minimax",
      name: "MiniMax",
      version: "M2.7",
      displayName: "MiniMax M2.7",
      aliases: ["minimax-m2.7", "minimax m2.7"]
    },
    {
      id: "catalog-model-glm-5",
      providerId: "catalog-provider-zai",
      name: "GLM",
      version: "5",
      displayName: "GLM-5",
      aliases: ["glm-5", "glm 5"]
    },
    {
      id: "catalog-model-glm-4-7",
      providerId: "catalog-provider-zai",
      name: "GLM",
      version: "4.7",
      displayName: "GLM-4.7",
      aliases: ["glm-4.7", "glm 4.7"]
    },
    {
      id: "catalog-model-gemini-3-flash",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "3 Flash",
      displayName: "Gemini 3 Flash",
      aliases: ["gemini-3-flash", "gemini 3 flash"]
    },
    {
      id: "catalog-model-gemini-3-pro",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "3 Pro",
      displayName: "Gemini 3 Pro",
      aliases: ["gemini-3-pro", "gemini 3 pro"]
    },
    {
      id: "catalog-model-kimi-k2-5-thinking",
      providerId: "catalog-provider-moonshot",
      name: "Kimi",
      version: "K2.5 Thinking",
      displayName: "Kimi K2.5 Thinking",
      aliases: ["kimi-k2.5-thinking", "kimi k2.5 thinking"]
    },
    {
      id: "catalog-model-gpt-5-4-medium-codex-harness",
      providerId: "catalog-provider-openai",
      name: "GPT",
      version: "5.4 Medium (codex-harness)",
      displayName: "GPT-5.4 Medium (codex-harness)",
      aliases: ["gpt-5.4-medium", "gpt-5.4-medium (codex-harness)"]
    },
    {
      id: "catalog-model-minimax-m2-5",
      providerId: "catalog-provider-minimax",
      name: "MiniMax",
      version: "M2.5",
      displayName: "MiniMax M2.5",
      aliases: ["minimax-m2.5", "minimax m2.5"]
    },
    {
      id: "catalog-model-gpt-5-3-codex-codex-harness",
      providerId: "catalog-provider-openai",
      name: "GPT",
      version: "5.3 Codex (codex-harness)",
      displayName: "GPT-5.3 Codex (codex-harness)",
      aliases: ["gpt-5.3-codex", "gpt-5.3-codex (codex-harness)"]
    },
    {
      id: "catalog-model-kimi-k2-5-instant",
      providerId: "catalog-provider-moonshot",
      name: "Kimi",
      version: "K2.5 Instant",
      displayName: "Kimi K2.5 Instant",
      aliases: ["kimi-k2.5-instant", "kimi k2.5 instant"]
    },
    {
      id: "catalog-model-minimax-m2-1-preview",
      providerId: "catalog-provider-minimax",
      name: "MiniMax",
      version: "M2.1 Preview",
      displayName: "MiniMax M2.1 Preview",
      aliases: ["minimax-m2.1-preview", "minimax m2.1 preview"]
    },
    {
      id: "catalog-model-gpt-5-2",
      providerId: "catalog-provider-openai",
      name: "GPT",
      version: "5.2",
      displayName: "GPT-5.2",
      aliases: ["gpt-5.2", "gpt 5.2"]
    },
    {
      id: "catalog-model-gemini-3-flash-thinking-minimal",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "3 Flash Thinking Minimal",
      displayName: "Gemini 3 Flash (thinking-minimal)",
      aliases: ["gemini-3-flash (thinking-minimal)", "gemini 3 flash thinking minimal"]
    },
    {
      id: "catalog-model-claude-sonnet-4",
      providerId: "catalog-provider-anthropic",
      name: "Claude",
      version: "Sonnet 4",
      displayName: "Claude Sonnet 4",
      aliases: ["claude sonnet 4", "claude-sonnet-4"]
    },
    {
      id: "catalog-model-gpt-5-mini",
      providerId: "catalog-provider-openai",
      name: "GPT",
      version: "5 mini",
      displayName: "GPT-5 mini",
      aliases: ["gpt5 mini", "gpt-5-mini", "gpt 5 mini"]
    },
    {
      id: "catalog-model-gemini-2-5-pro",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "2.5 Pro",
      displayName: "Gemini 2.5 Pro",
      aliases: ["gemini-2.5-pro", "gemini 2.5 pro"]
    },
    {
      id: "catalog-model-gemini-2-5-flash",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "2.5 Flash",
      displayName: "Gemini 2.5 Flash",
      aliases: ["gemini-2.5-flash", "gemini 2.5 flash"]
    },
    {
      id: "catalog-model-gemini-1-5-pro",
      providerId: "catalog-provider-google",
      name: "Gemini",
      version: "1.5 Pro",
      displayName: "Gemini 1.5 Pro",
      aliases: ["gemini-1.5-pro", "gemini 1.5 pro"],
      status: "deprecated"
    },
    {
      id: "catalog-model-llama-3-1-405b",
      providerId: "catalog-provider-meta",
      name: "Llama",
      version: "3.1 405B",
      displayName: "Llama 3.1 405B",
      aliases: ["llama-3.1-405b", "llama 3.1 405b"]
    },
    {
      id: "catalog-model-grok-2",
      providerId: "catalog-provider-xai",
      name: "Grok",
      version: "2",
      displayName: "Grok 2",
      aliases: ["grok-2", "grok 2"]
    },
    {
      id: "catalog-model-mistral-large",
      providerId: "catalog-provider-mistral",
      name: "Mistral",
      version: "Large",
      displayName: "Mistral Large",
      aliases: ["mistral large"]
    },
    {
      id: "catalog-model-milm-preview-01",
      providerId: "catalog-provider-xiaomi",
      name: "MiLM",
      version: "Preview 01",
      displayName: "MiLM Preview 01",
      aliases: ["milm preview 01", "xiaomi milm preview 01"]
    }
  ],
  presets: [
    {
      id: "popular",
      title: "Popular",
      description: "Arena Code top 20 as of March 18, 2026.",
      modelIds: [
        "catalog-model-claude-opus-4-6",
        "catalog-model-claude-opus-4-6-thinking",
        "catalog-model-claude-sonnet-4-6",
        "catalog-model-claude-opus-4-5-thinking-32k",
        "catalog-model-claude-opus-4-5",
        "catalog-model-gpt-5-4-high-codex-harness",
        "catalog-model-gemini-3-1-pro-preview",
        "catalog-model-minimax-m2-7",
        "catalog-model-glm-5",
        "catalog-model-glm-4-7",
        "catalog-model-gemini-3-flash",
        "catalog-model-gemini-3-pro",
        "catalog-model-kimi-k2-5-thinking",
        "catalog-model-gpt-5-4-medium-codex-harness",
        "catalog-model-minimax-m2-5",
        "catalog-model-gpt-5-3-codex-codex-harness",
        "catalog-model-kimi-k2-5-instant",
        "catalog-model-minimax-m2-1-preview",
        "catalog-model-gpt-5-2",
        "catalog-model-gemini-3-flash-thinking-minimal"
      ]
    },
    {
      id: "big-three",
      title: "OpenAI / Anthropic / Google",
      description: "A broader starter set covering common frontier providers.",
      modelIds: [
        "catalog-model-claude-opus-4-6",
        "catalog-model-claude-sonnet-4-6",
        "catalog-model-claude-sonnet-4",
        "catalog-model-gpt-5-4-high-codex-harness",
        "catalog-model-gpt-5-2",
        "catalog-model-gpt-5-mini",
        "catalog-model-gemini-3-1-pro-preview",
        "catalog-model-gemini-3-flash"
      ]
    }
  ]
};
