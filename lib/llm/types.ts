export type Tone =
  | "casual"
  | "professional"
  | "humorous"
  | "inspirational"
  | "promotional";

export type Platform = "instagram" | "facebook" | "twitter" | "linkedin";

export interface CaptionOptions {
  /** Target platforms for platform-specific optimization */
  platforms?: Platform[];
  /** Desired tone of the caption */
  tone?: Tone;
  /** Language for the generated caption (ISO 639-1 code) */
  language?: string;
  /** Maximum number of suggestions to return */
  maxSuggestions?: number;
}

export interface LLMProvider {
  /** Generate captions from a topic or prompt */
  generateCaption(prompt: string, options: CaptionOptions): Promise<string[]>;
  /** Rewrite/improve existing text with a specific tone */
  rewriteCaption(text: string, tone: Tone): Promise<string[]>;
  /** Suggest relevant hashtags based on content */
  suggestHashtags(content: string): Promise<string[]>;
}

export type LLMProviderName = "gemini" | "openai" | "anthropic";
