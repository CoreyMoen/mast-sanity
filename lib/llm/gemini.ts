/**
 * gemini.ts — Google Gemini LLM provider implementation.
 *
 * Uses the Gemini REST API directly (no SDK) to generate social media captions,
 * rewrite content, and suggest hashtags.
 */

import type { LLMProvider, CaptionOptions, Tone, Platform } from "./types";

const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
    finishReason?: string;
  }>;
  error?: {
    code?: number;
    message?: string;
    status?: string;
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

export class GeminiProvider implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    if (!apiKey) {
      throw new Error(
        "Gemini API key is required. Provide a valid API key from Google AI Studio.",
      );
    }
    this.apiKey = apiKey;
  }

  private async callGemini(
    prompt: string,
    temperature: number = 0.8,
    maxOutputTokens: number = 1024,
  ): Promise<string> {
    const url = `${GEMINI_API_URL}?key=${this.apiKey}`;

    let response: Response;
    try {
      response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature,
            maxOutputTokens,
          },
        }),
      });
    } catch (error) {
      throw new Error(
        `Gemini API request failed: ${error instanceof Error ? error.message : "Network error"}`,
      );
    }

    if (response.status === 429) {
      throw new Error(
        "Gemini API rate limit exceeded. Please wait a moment and try again.",
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new Error(
        "Gemini API authentication failed. Please check your API key.",
      );
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Unknown error");
      throw new Error(
        `Gemini API returned status ${response.status}: ${errorText}`,
      );
    }

    let data: GeminiResponse;
    try {
      data = (await response.json()) as GeminiResponse;
    } catch {
      throw new Error("Failed to parse Gemini API response as JSON.");
    }

    if (data.error) {
      throw new Error(
        `Gemini API error: ${data.error.message ?? "Unknown error"}`,
      );
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) {
      throw new Error(
        "Gemini API returned an empty response. The model may have filtered the content.",
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

    const fullPrompt = `${systemParts.join("\n\n")}\n\nTopic/Brief: ${prompt}`;

    const result = await this.callGemini(fullPrompt, 0.9, 1500);
    return this.parseNumberedList(result, count);
  }

  async rewriteCaption(text: string, tone: Tone): Promise<string[]> {
    const systemParts = [
      "You are an expert social media copywriter specializing in tone adaptation.",
      "Your task is to rewrite the following social media caption in a different tone while preserving the core message and key information.",
      `Target tone: ${buildToneInstruction(tone)}`,
      "Generate exactly 3 rewritten versions, each taking a slightly different approach to the tone.",
      "Format your response as a numbered list (1., 2., 3.) with each rewritten caption on its own line.",
      "Do NOT include any additional commentary, headers, or explanation — only the numbered captions.",
    ];

    const fullPrompt = `${systemParts.join("\n\n")}\n\nOriginal caption:\n${text}`;

    const result = await this.callGemini(fullPrompt, 0.85, 1500);
    return this.parseNumberedList(result, 3);
  }

  async suggestHashtags(content: string): Promise<string[]> {
    const systemParts = [
      "You are a social media hashtag strategist who understands trending topics, discoverability, and audience targeting.",
      "Analyze the following content and suggest 10 to 15 relevant hashtags.",
      "Include a mix of:",
      "- High-volume popular hashtags (broad reach)",
      "- Medium-volume niche hashtags (targeted communities)",
      "- Specific long-tail hashtags (highly relevant)",
      'Respond with ONLY a JSON array of strings — no # prefix, no explanation. Example: ["marketing", "socialmedia", "contentcreation"]',
    ];

    const fullPrompt = `${systemParts.join("\n")}\n\nContent:\n${content}`;

    const result = await this.callGemini(fullPrompt, 0.7, 500);
    return this.parseHashtagResponse(result);
  }

  /**
   * Parse a numbered list response (e.g. "1. Caption one\n2. Caption two") into
   * an array of strings. Falls back to splitting on double newlines if numbered
   * pattern is not detected.
   */
  private parseNumberedList(text: string, expectedCount: number): string[] {
    // Try to match numbered items (1. ... 2. ... 3. ...)
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
        // Continuation of current item
        currentItem += " " + line.trim();
      }
    }
    if (currentItem.trim()) {
      items.push(currentItem.trim());
    }

    // If numbered parsing didn't work, fall back to splitting on double newlines
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
   * Parse a hashtag response, expecting a JSON array of strings. Falls back to
   * extracting words from the response if JSON parsing fails.
   */
  private parseHashtagResponse(text: string): string[] {
    // Try to extract JSON array from the response
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

    // Fallback: extract hashtag-like words from the response
    const hashtagPattern = /#?(\w[\w]*)/g;
    const matches: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = hashtagPattern.exec(text)) !== null) {
      if (match[1] && match[1].length > 1) {
        matches.push(match[1]);
      }
    }

    // Deduplicate and return
    return Array.from(new Set(matches)).slice(0, 15);
  }
}
