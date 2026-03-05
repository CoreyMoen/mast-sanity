/**
 * index.ts — LLM Provider factory.
 *
 * Creates the appropriate LLM provider instance based on the provider name.
 * This is the main entry point for the LLM abstraction layer.
 *
 * Usage:
 *   import { createLLMProvider } from "@/lib/llm";
 *   const provider = createLLMProvider("gemini", apiKey);
 *   const captions = await provider.generateCaption("Launch our new product", {
 *     platforms: ["instagram", "twitter"],
 *     tone: "casual",
 *   });
 */

import type { LLMProvider, LLMProviderName } from "./types";
import { GeminiProvider } from "./gemini";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";

export function createLLMProvider(
  providerName: LLMProviderName,
  apiKey: string,
): LLMProvider {
  switch (providerName) {
    case "gemini":
      return new GeminiProvider(apiKey);
    case "openai":
      return new OpenAIProvider(apiKey);
    case "anthropic":
      return new AnthropicProvider(apiKey);
    default:
      throw new Error(`Unknown LLM provider: ${providerName as string}`);
  }
}

// Re-export types and providers for convenience
export { GeminiProvider } from "./gemini";
export { OpenAIProvider } from "./openai";
export { AnthropicProvider } from "./anthropic";
export type {
  LLMProvider,
  LLMProviderName,
  CaptionOptions,
  Tone,
  Platform,
} from "./types";
