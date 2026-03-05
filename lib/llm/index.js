"use strict";
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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnthropicProvider = exports.OpenAIProvider = exports.GeminiProvider = void 0;
exports.createLLMProvider = createLLMProvider;
var gemini_1 = require("./gemini");
var openai_1 = require("./openai");
var anthropic_1 = require("./anthropic");
function createLLMProvider(providerName, apiKey) {
    switch (providerName) {
        case "gemini":
            return new gemini_1.GeminiProvider(apiKey);
        case "openai":
            return new openai_1.OpenAIProvider(apiKey);
        case "anthropic":
            return new anthropic_1.AnthropicProvider(apiKey);
        default:
            throw new Error("Unknown LLM provider: ".concat(providerName));
    }
}
// Re-export types and providers for convenience
var gemini_2 = require("./gemini");
Object.defineProperty(exports, "GeminiProvider", { enumerable: true, get: function () { return gemini_2.GeminiProvider; } });
var openai_2 = require("./openai");
Object.defineProperty(exports, "OpenAIProvider", { enumerable: true, get: function () { return openai_2.OpenAIProvider; } });
var anthropic_2 = require("./anthropic");
Object.defineProperty(exports, "AnthropicProvider", { enumerable: true, get: function () { return anthropic_2.AnthropicProvider; } });
