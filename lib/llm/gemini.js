"use strict";
/**
 * gemini.ts — Google Gemini LLM provider implementation.
 *
 * Uses the Gemini REST API directly (no SDK) to generate social media captions,
 * rewrite content, and suggest hashtags.
 */
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiProvider = void 0;
var GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
function buildPlatformGuidance(platforms) {
    var guidance = {
        instagram: "Instagram: Use a conversational, visually descriptive tone. Emojis are welcome. Captions can be longer (up to 2,200 chars). Include a call-to-action. Leave room for hashtags at the end.",
        facebook: "Facebook: Write engaging, shareable content. Questions and stories perform well. Keep it moderate length (1-3 short paragraphs). Encourage comments and shares.",
        twitter: "X (Twitter): Be concise and punchy — 280 characters max. Use a strong hook. Abbreviations are acceptable. Threads can expand on ideas but each tweet should stand alone.",
        linkedin: "LinkedIn: Maintain a professional yet personable tone. Lead with insight or a thought-provoking statement. Longer posts (1,300+ chars) tend to perform well. Avoid excessive emojis.",
    };
    return platforms.map(function (p) { return guidance[p]; }).join("\n");
}
function buildToneInstruction(tone) {
    var instructions = {
        casual: "Write in a relaxed, friendly, conversational style — as if talking to a friend. Use contractions and everyday language.",
        professional: "Write in a polished, authoritative, and credible style. Use clear and precise language without being stiff.",
        humorous: "Write in a witty, playful style. Use wordplay, light sarcasm, or clever observations. Keep it fun but not forced.",
        inspirational: "Write in an uplifting, motivational style. Use vivid imagery and empowering language that resonates emotionally.",
        promotional: "Write in a persuasive, action-oriented style. Highlight benefits, create urgency, and include a compelling call-to-action.",
    };
    return instructions[tone];
}
var GeminiProvider = /** @class */ (function () {
    function GeminiProvider(apiKey) {
        if (!apiKey) {
            throw new Error("Gemini API key is required. Provide a valid API key from Google AI Studio.");
        }
        this.apiKey = apiKey;
    }
    GeminiProvider.prototype.callGemini = function (prompt_1) {
        return __awaiter(this, arguments, void 0, function (prompt, temperature, maxOutputTokens) {
            var url, response, error_1, errorText, data, _a, text;
            var _b, _c, _d, _e, _f, _g;
            if (temperature === void 0) { temperature = 0.8; }
            if (maxOutputTokens === void 0) { maxOutputTokens = 1024; }
            return __generator(this, function (_h) {
                switch (_h.label) {
                    case 0:
                        url = "".concat(GEMINI_API_URL, "?key=").concat(this.apiKey);
                        _h.label = 1;
                    case 1:
                        _h.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, fetch(url, {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    contents: [{ parts: [{ text: prompt }] }],
                                    generationConfig: {
                                        temperature: temperature,
                                        maxOutputTokens: maxOutputTokens,
                                    },
                                }),
                            })];
                    case 2:
                        response = _h.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _h.sent();
                        throw new Error("Gemini API request failed: ".concat(error_1 instanceof Error ? error_1.message : "Network error"));
                    case 4:
                        if (response.status === 429) {
                            throw new Error("Gemini API rate limit exceeded. Please wait a moment and try again.");
                        }
                        if (response.status === 401 || response.status === 403) {
                            throw new Error("Gemini API authentication failed. Please check your API key.");
                        }
                        if (!!response.ok) return [3 /*break*/, 6];
                        return [4 /*yield*/, response.text().catch(function () { return "Unknown error"; })];
                    case 5:
                        errorText = _h.sent();
                        throw new Error("Gemini API returned status ".concat(response.status, ": ").concat(errorText));
                    case 6:
                        _h.trys.push([6, 8, , 9]);
                        return [4 /*yield*/, response.json()];
                    case 7:
                        data = (_h.sent());
                        return [3 /*break*/, 9];
                    case 8:
                        _a = _h.sent();
                        throw new Error("Failed to parse Gemini API response as JSON.");
                    case 9:
                        if (data.error) {
                            throw new Error("Gemini API error: ".concat((_b = data.error.message) !== null && _b !== void 0 ? _b : "Unknown error"));
                        }
                        text = (_g = (_f = (_e = (_d = (_c = data.candidates) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.content) === null || _e === void 0 ? void 0 : _e.parts) === null || _f === void 0 ? void 0 : _f[0]) === null || _g === void 0 ? void 0 : _g.text;
                        if (!text) {
                            throw new Error("Gemini API returned an empty response. The model may have filtered the content.");
                        }
                        return [2 /*return*/, text.trim()];
                }
            });
        });
    };
    GeminiProvider.prototype.generateCaption = function (prompt, options) {
        return __awaiter(this, void 0, void 0, function () {
            var count, systemParts, fullPrompt, result;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        count = (_a = options.maxSuggestions) !== null && _a !== void 0 ? _a : 3;
                        systemParts = [
                            "You are an expert social media marketing copywriter with years of experience crafting high-engagement content.",
                            "Your task is to generate compelling social media captions based on the user's topic or brief.",
                        ];
                        if (options.platforms && options.platforms.length > 0) {
                            systemParts.push("Optimize the captions for the following platform(s):", buildPlatformGuidance(options.platforms));
                        }
                        if (options.tone) {
                            systemParts.push("Tone direction:", buildToneInstruction(options.tone));
                        }
                        if (options.language && options.language !== "en") {
                            systemParts.push("Write the captions in the language with ISO 639-1 code: \"".concat(options.language, "\"."));
                        }
                        systemParts.push("Generate exactly ".concat(count, " distinct caption suggestions. Each caption should take a different creative angle on the topic."), "Format your response as a numbered list (1., 2., 3., etc.) with each caption on its own line.", "Do NOT include any additional commentary, headers, or explanation — only the numbered captions.");
                        fullPrompt = "".concat(systemParts.join("\n\n"), "\n\nTopic/Brief: ").concat(prompt);
                        return [4 /*yield*/, this.callGemini(fullPrompt, 0.9, 1500)];
                    case 1:
                        result = _b.sent();
                        return [2 /*return*/, this.parseNumberedList(result, count)];
                }
            });
        });
    };
    GeminiProvider.prototype.rewriteCaption = function (text, tone) {
        return __awaiter(this, void 0, void 0, function () {
            var systemParts, fullPrompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemParts = [
                            "You are an expert social media copywriter specializing in tone adaptation.",
                            "Your task is to rewrite the following social media caption in a different tone while preserving the core message and key information.",
                            "Target tone: ".concat(buildToneInstruction(tone)),
                            "Generate exactly 3 rewritten versions, each taking a slightly different approach to the tone.",
                            "Format your response as a numbered list (1., 2., 3.) with each rewritten caption on its own line.",
                            "Do NOT include any additional commentary, headers, or explanation — only the numbered captions.",
                        ];
                        fullPrompt = "".concat(systemParts.join("\n\n"), "\n\nOriginal caption:\n").concat(text);
                        return [4 /*yield*/, this.callGemini(fullPrompt, 0.85, 1500)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.parseNumberedList(result, 3)];
                }
            });
        });
    };
    GeminiProvider.prototype.suggestHashtags = function (content) {
        return __awaiter(this, void 0, void 0, function () {
            var systemParts, fullPrompt, result;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        systemParts = [
                            "You are a social media hashtag strategist who understands trending topics, discoverability, and audience targeting.",
                            "Analyze the following content and suggest 10 to 15 relevant hashtags.",
                            "Include a mix of:",
                            "- High-volume popular hashtags (broad reach)",
                            "- Medium-volume niche hashtags (targeted communities)",
                            "- Specific long-tail hashtags (highly relevant)",
                            'Respond with ONLY a JSON array of strings — no # prefix, no explanation. Example: ["marketing", "socialmedia", "contentcreation"]',
                        ];
                        fullPrompt = "".concat(systemParts.join("\n"), "\n\nContent:\n").concat(content);
                        return [4 /*yield*/, this.callGemini(fullPrompt, 0.7, 500)];
                    case 1:
                        result = _a.sent();
                        return [2 /*return*/, this.parseHashtagResponse(result)];
                }
            });
        });
    };
    /**
     * Parse a numbered list response (e.g. "1. Caption one\n2. Caption two") into
     * an array of strings. Falls back to splitting on double newlines if numbered
     * pattern is not detected.
     */
    GeminiProvider.prototype.parseNumberedList = function (text, expectedCount) {
        // Try to match numbered items (1. ... 2. ... 3. ...)
        var numberedPattern = /^\d+\.\s*/;
        var lines = text.split("\n").filter(function (line) { return line.trim().length > 0; });
        var items = [];
        var currentItem = "";
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            if (numberedPattern.test(line.trim())) {
                if (currentItem.trim()) {
                    items.push(currentItem.trim());
                }
                currentItem = line.trim().replace(numberedPattern, "");
            }
            else {
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
                .map(function (s) { return s.trim(); })
                .filter(function (s) { return s.length > 0; })
                .slice(0, expectedCount);
        }
        return items.slice(0, expectedCount);
    };
    /**
     * Parse a hashtag response, expecting a JSON array of strings. Falls back to
     * extracting words from the response if JSON parsing fails.
     */
    GeminiProvider.prototype.parseHashtagResponse = function (text) {
        // Try to extract JSON array from the response
        var jsonMatch = text.match(/\[[\s\S]*?\]/);
        if (jsonMatch) {
            try {
                var parsed = JSON.parse(jsonMatch[0]);
                if (Array.isArray(parsed)) {
                    return parsed
                        .filter(function (item) { return typeof item === "string"; })
                        .map(function (tag) { return tag.replace(/^#/, "").trim(); })
                        .filter(function (tag) { return tag.length > 0; })
                        .slice(0, 15);
                }
            }
            catch (_a) {
                // Fall through to fallback parsing
            }
        }
        // Fallback: extract hashtag-like words from the response
        var hashtagPattern = /#?(\w[\w]*)/g;
        var matches = [];
        var match;
        while ((match = hashtagPattern.exec(text)) !== null) {
            if (match[1] && match[1].length > 1) {
                matches.push(match[1]);
            }
        }
        // Deduplicate and return
        return Array.from(new Set(matches)).slice(0, 15);
    };
    return GeminiProvider;
}());
exports.GeminiProvider = GeminiProvider;
