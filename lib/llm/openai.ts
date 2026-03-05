/**
 * openai.ts — OpenAI LLM provider implementation.
 *
 * Uses the OpenAI Chat Completions REST API directly (no SDK) to generate
 * social media captions, rewrite content, and suggest hashtags.
 * Defaults to gpt-4o-mini for cost-effective caption generation.
 */

import type { LLMProvider, CaptionOptions, Tone, Platform } from "./types";

const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
const DEFAULT_MODEL = "gpt-4o-mini";

interface OpenAIChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface OpenAIResponse {
  id?: string;
  choices?: Array<{
    message?: {
      content?: string;
    };
    finish_reason?: string;
  }>;
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
}

function buildPlatformGuidance(platforms: Platform[]): string {
  const guidance: Record<Platform, string> = {
    instagram:
      "Instagram: Use a conversational, visually descriptive tone. Emojis are welcome. Captions can be longer (up to 2,200 chars). Include a call-to-action. Leave room for hashtags at the end.",
    facebook:
      "Facebook: Write engaging, shareable content. Questions and stories perform well. Keep it moderate length (1-3 short paragraphs). Encourage comments and shares.",
    twitter:
      "X (Twitter): Be concise and punchy — 280 characters max. Use a strong hook. Abbreviations are acceptable. Threads can expand on ideas but each tweet should stand alone.",
    linkedin:
      "LinkedIn: Maintain a professional yet personable tone. Lead with insight or a thought-provoking statement. Longer posts (1,300+ chars) tend to perform well. Avoid excessive emojis.",
  };

  return platforms.map((p) => guidance[p]).join("\n");
}

function buildToneInstruction(tone: Tone): string {
  const instructions: Record<Tone, string> = {
    casual:
      "Write in a relaxed, friendly, conversational style — as if talking to a friend. Use contractions and everyday language.",
    professional:
      "Write in a polished, authoritative, and credible style. Use clear and precise language without being stiff.",
    humorous:
      "Write in a witty, playful style. Use wordplay, light sarcasm, or clever observations. Keep it fun but not forced.",
    inspirational:
      "Write in an uplifting, motivational style. Use vivid imagery and empowering language that resonates emotionally.",
    promotional:
      "Write in a persuasive, action-oriented style. Highlight benefits, create urgency, and include a compelling call-to-action.",
  };

  return instructions[tone];
}

export class OpenAIProvider implements LLMProvider {
  private apiKey: string;
  private model: string;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    if (!apiKey) {
      throw new Error(
        "OpenAI API key is required. Provide a valid API key from the OpenAI dashboard.",
      );
    }
    this.apiKey = apiKey;
    this.model = model;
  }

  private async callOpenAI(
    systemPrompt: string,
    userPrompt: string,
    temperature: number = 0.8,
    maxTokens: number = 1024,
  ): Promise<string> {
    const messages: OpenAIChatMessage[] = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ];

    let response: Response;
    try {
      response = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature,
          max_tokens: maxTokens,
        }),
      });
    } catch (error) {
      throw new Error(
        `OpenAI API request failed: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }

    if (response.status === 429) {
      throw new Error(
        "OpenAI API rate limit exceeded. Please wait a moment and try again.",
      );
    }

    if (response.status === 401) {
      throw new Error(
        "OpenAI API authentication failed. Please check your API key.",
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `OpenAI API returned status ${response.status}: ${errorText}`,
      );
    }

    let data: OpenAIResponse;
    try {
      data = (await response.json()) as OpenAIResponse;
    } catch {
      throw new Error("Failed to parse OpenAI API response as JSON.");
    }

    if (data.error) {
      throw new Error(
        `OpenAI API error: ${data.error.message ?? "Unknown error"}`,
      );
    }

    const text = data.choices?.[0]?.message?.content;
    if (!text) {
      throw new Error(
        "OpenAI API returned an empty response. The model may have refused the request.",
      );
    }

    return text.trim();
  }

  async generateCaption(
    prompt: string,
    options: CaptionOptions,
  ): Promise<string[]> {
    const count = options.maxSuggestions ?? 3;

    const systemParts = [
      "You are an expert social media marketing copywriter with years of experience crafting high-engagement content.",
      "Your task is to generate compelling social media captions based on the user's topic or brief.",
    ];

    if (options.platforms && options.platforms.length > 0) {
      systemParts.push(
        "Optimize the captions for the following platform(s):",
        buildPlatformGuidance(options.platforms),
      );
    }

    if (options.tone) {
      systemParts.push("Tone direction:", buildToneInstruction(options.tone));
    }

    if (options.language && options.language !== "en") {
      systemParts.push(
        `Write the captions in the language with ISO 639-1 code: "${options.language}".`,
      );
    }

    systemParts.push(
      `Generate exactly ${count} distinct caption suggestions. Each caption should take a different creative angle on the topic.`,
      "Format your response as a numbered list (1., 2., 3., etc.) with each caption on its own line.",
      "Do NOT include any additional commentary, headers, or explanation — only the numbered captions.",
    );

    const systemPrompt = systemParts.join("\n\n");
    const userPrompt = `Topic/Brief: ${prompt}`;

    const result = await this.callOpenAI(systemPrompt, userPrompt, 0.9, 1500);
    return this.parseNumberedList(result, count);
  }

  async rewriteCaption(text: string, tone: Tone): Promise<string[]> {
    const systemPrompt = [
      "You are an expert social media copywriter specializing in tone adaptation.",
      "Your task is to rewrite the given social media caption in a different tone while preserving the core message and key information.",
      `Target tone: ${buildToneInstruction(tone)}`,
      "Generate exactly 3 rewritten versions, each taking a slightly different approach to the tone.",
      "Format your response as a numbered list (1., 2., 3.) with each rewritten caption on its own line.",
      "Do NOT include any additional commentary, headers, or explanation — only the numbered captions.",
    ].join("\n\n");

    const userPrompt = `Original caption:\n${text}`;

    const result = await this.callOpenAI(systemPrompt, userPrompt, 0.85, 1500);
    return this.parseNumberedList(result, 3);
  }

  async suggestHashtags(content: string): Promise<string[]> {
    const systemPrompt = [
      "You are a social media hashtag strategist who understands trending topics, discoverability, and audience targeting.",
      "Analyze the given content and suggest 10 to 15 relevant hashtags.",
      "Include a mix of:",
      "- High-volume popular hashtags (broad reach)",
      "- Medium-volume niche hashtags (targeted communities)",
      "- Specific long-tail hashtags (highly relevant)",
      'Respond with ONLY a JSON array of strings — no # prefix, no explanation. Example: ["marketing", "socialmedia", "contentcreation"]',
    ].join("\n");

    const userPrompt = `Content:\n${content}`;

    const result = await this.callOpenAI(systemPrompt, userPrompt, 0.7, 500);
    return this.parseHashtagResponse(result);
  }

  /**
   * Parse a numbered list response into an array of strings.
   */
  private parseNumberedList(text: string, expectedCount: number): string[] {
    const numberedPattern = /^\d+\.\s*/;
    const lines = text.split("\n").filter((line) => line.trim().length > 0);

    const items: string[] = [];
    let currentItem = "";

    for (const line of lines) {
      if (numberedPattern.test(line.trim())) {
        if (currentItem.trim()) {
          items.push(currentItem.trim());
        }
        currentItem = line.trim().replace(numberedPattern, "");
      } else {
        currentItem += " " + line.trim();
      }
    }
    if (currentItem.trim()) {
      items.push(currentItem.trim());
    }

    if (items.length === 0) {
      return text
        .split(/\n\n+/)
        .map((s) => s.trim())
        .filter((s) => s.length > 0)
        .slice(0, expectedCount);
    }

    return items.slice(0, expectedCount);
  }

  /**
   * Parse a hashtag response, expecting a JSON array of strings.
   */
  private parseHashtagResponse(text: string): string[] {
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]) as unknown;
        if (Array.isArray(parsed)) {
          return parsed
            .filter((item): item is string => typeof item === "string")
            .map((tag) => tag.replace(/^#/, "").trim())
            .filter((tag) => tag.length > 0)
            .slice(0, 15);
        }
      } catch {
        // Fall through to fallback parsing
      }
    }

    const hashtagPattern = /#?(\w[\w]*)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = hashtagPattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 1) {
        matches.push(match[1]);
      }
    }

    return Array.from(new Set(matches)).slice(0, 15);
  }
}
