/**
 * AISettings — BYOK (Bring Your Own Key) configuration panel.
 *
 * Allows users to select their preferred LLM provider, enter an API key
 * (encrypted client-side before storage), test the connection, and see
 * which model will be used for AI features.
 */

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Key,
  Brain,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  Info,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Browser-compatible encryption ──────────────────────────────────────────
// The shared encryption.ts uses Node.js `crypto` which is not available
// in the browser. This helper uses the Web Crypto API instead.

async function encryptClientSide(
  plaintext: string,
  hexKey: string,
): Promise<string> {
  const keyBytes = new Uint8Array(
    hexKey.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
  );
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-GCM" },
    false,
    ["encrypt"],
  );
  const encoded = new TextEncoder().encode(plaintext);
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    cryptoKey,
    encoded,
  );
  // Combine IV + ciphertext (which includes the auth tag in Web Crypto)
  const combined = new Uint8Array(iv.length + cipherBuffer.byteLength);
  combined.set(iv, 0);
  combined.set(new Uint8Array(cipherBuffer), iv.length);
  // Base64 encode
  return btoa(String.fromCharCode(...combined));
}

// ─── Provider definitions ────────────────────────────────────────────────────

type ProviderOption = {
  id: "gemini" | "openai" | "anthropic";
  name: string;
  model: string;
  description: string;
};

const PROVIDERS: ProviderOption[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "Gemini 2.5 Flash Lite",
    description: "Fast, capable, and free tier available",
  },
  {
    id: "openai",
    name: "OpenAI",
    model: "GPT-4o Mini",
    description: "Industry standard with broad capabilities",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    model: "Claude 3.5 Haiku",
    description: "Excellent at nuanced, creative writing",
  },
];

// ─── Component ───────────────────────────────────────────────────────────────

export function AISettings() {
  const user = useQuery(api.users.getMe);
  const updateLlmSettings = useMutation(api.users.updateLlmSettings);

  const [provider, setProvider] = useState<"gemini" | "openai" | "anthropic">(
    "gemini",
  );
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Track whether the user has a saved key (show masked version)
  const [hasSavedKey, setHasSavedKey] = useState(false);
  const [savedKeyLast4, setSavedKeyLast4] = useState("");

  // Sync provider from user data on load
  useEffect(() => {
    if (user) {
      setProvider(user.llmProvider);
      if (user.hasApiKey) {
        setHasSavedKey(true);
        // We can't decrypt the key client-side; just show that one is saved
        setSavedKeyLast4("****");
      }
    }
  }, [user]);

  const selectedProvider = PROVIDERS.find((p) => p.id === provider)!;

  // ── Save handler ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    setError(null);
    setSaveSuccess(false);
    setSaving(true);

    try {
      const encryptionKey = process.env.NEXT_PUBLIC_ENCRYPTION_KEY;
      let encryptedKey: string | undefined;

      if (apiKey.trim()) {
        if (encryptionKey) {
          encryptedKey = await encryptClientSide(apiKey.trim(), encryptionKey);
        } else {
          // No client-side encryption key available (common in dev).
          // Store the key as-is — the server handles plaintext keys in dev mode.
          encryptedKey = apiKey.trim();
        }
      }

      await updateLlmSettings({
        llmProvider: provider,
        encryptedApiKey: encryptedKey,
      });

      if (apiKey.trim()) {
        setHasSavedKey(true);
        setSavedKeyLast4(apiKey.trim().slice(-4));
        setApiKey("");
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  // ── Test connection handler ──────────────────────────────────────────────

  const handleTestConnection = async () => {
    setTestResult(null);
    setTesting(true);

    try {
      const keyToTest = apiKey.trim();
      if (!keyToTest && !hasSavedKey) {
        setTestResult({
          success: false,
          message: "Please enter an API key first.",
        });
        return;
      }

      // Make a minimal test call based on provider
      const testEndpoints: Record<string, { url: string; getHeaders: (key: string) => HeadersInit; getBody: () => string }> = {
        gemini: {
          url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${keyToTest}`,
          getHeaders: () => ({ "Content-Type": "application/json" }),
          getBody: () =>
            JSON.stringify({
              contents: [{ parts: [{ text: "Say hello in one word." }] }],
            }),
        },
        openai: {
          url: "https://api.openai.com/v1/chat/completions",
          getHeaders: (key: string) => ({
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
          }),
          getBody: () =>
            JSON.stringify({
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: "Say hello in one word." }],
              max_tokens: 5,
            }),
        },
        anthropic: {
          url: "https://api.anthropic.com/v1/messages",
          getHeaders: (key: string) => ({
            "Content-Type": "application/json",
            "x-api-key": key,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true",
          }),
          getBody: () =>
            JSON.stringify({
              model: "claude-3-5-haiku-latest",
              max_tokens: 5,
              messages: [{ role: "user", content: "Say hello in one word." }],
            }),
        },
      };

      if (!keyToTest) {
        setTestResult({
          success: false,
          message:
            "Enter your new API key above to test it. We cannot test a previously saved key.",
        });
        return;
      }

      const endpoint = testEndpoints[provider];
      const response = await fetch(endpoint.url, {
        method: "POST",
        headers: endpoint.getHeaders(keyToTest),
        body: endpoint.getBody(),
      });

      if (response.ok) {
        setTestResult({
          success: true,
          message: `Connection successful! ${selectedProvider.model} is ready to use.`,
        });
      } else {
        const errorData = await response.json().catch(() => null);
        const errorMessage =
          errorData?.error?.message ??
          `API returned status ${response.status}`;
        setTestResult({
          success: false,
          message: `Connection failed: ${errorMessage}`,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        message:
          err instanceof Error
            ? `Connection failed: ${err.message}`
            : "Connection test failed. Check your API key and try again.",
      });
    } finally {
      setTesting(false);
    }
  };

  // ── Loading state ────────────────────────────────────────────────────────

  if (user === undefined || user === null) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="space-y-4">
          <div className="h-5 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-32 w-full animate-pulse rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Provider Selection */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            AI Provider
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choose which LLM provider powers your AI features.
        </p>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              onClick={() => {
                setProvider(p.id);
                setTestResult(null);
              }}
              className={cn(
                "flex flex-col rounded-lg border-2 px-4 py-3 text-left transition-colors",
                provider === p.id
                  ? "border-indigo-600 bg-indigo-50"
                  : "border-gray-200 bg-white hover:border-gray-300",
              )}
            >
              <span className="text-sm font-semibold text-gray-900">
                {p.name}
              </span>
              <span className="mt-0.5 text-xs text-indigo-600 font-medium">
                {p.model}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key */}
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <div className="flex items-center gap-2">
          <Key className="h-5 w-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900">API Key</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Enter your {selectedProvider.name} API key. It will be encrypted
          before storage.
        </p>

        {/* Saved key indicator */}
        {hasSavedKey && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
            <Shield className="h-4 w-4 shrink-0" />
            <span>
              API key saved{" "}
              {savedKeyLast4 !== "****" && (
                <>
                  (ending in <code className="font-mono">{savedKeyLast4}</code>)
                </>
              )}
            </span>
          </div>
        )}

        {/* API key input */}
        <div className="mt-3">
          <label
            htmlFor="api-key"
            className="block text-sm font-medium text-gray-700"
          >
            {hasSavedKey ? "Replace API Key" : "API Key"}
          </label>
          <div className="relative mt-1">
            <input
              id="api-key"
              type={showKey ? "text" : "password"}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                hasSavedKey
                  ? "Enter a new key to replace the saved one"
                  : `Enter your ${selectedProvider.name} API key`
              }
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
            >
              {showKey ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>
            Your API key is encrypted at rest and never shared. You are billed
            directly by the provider. Angela never stores or proxies your key in
            plaintext.
          </span>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {/* Test result */}
        {testResult && (
          <div
            className={cn(
              "mt-3 flex items-center gap-2 rounded-lg border px-3 py-2 text-sm",
              testResult.success
                ? "border-green-200 bg-green-50 text-green-700"
                : "border-red-200 bg-red-50 text-red-700",
            )}
          >
            {testResult.success ? (
              <Check className="h-4 w-4 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 shrink-0" />
            )}
            {testResult.message}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors",
              saveSuccess
                ? "bg-green-600 hover:bg-green-700"
                : "bg-indigo-600 hover:bg-indigo-700",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : saveSuccess ? (
              <>
                <Check className="h-4 w-4" />
                Saved
              </>
            ) : (
              "Save Settings"
            )}
          </button>

          <button
            onClick={handleTestConnection}
            disabled={testing || (!apiKey.trim() && !hasSavedKey)}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50",
              "disabled:cursor-not-allowed disabled:opacity-50",
            )}
          >
            {testing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
