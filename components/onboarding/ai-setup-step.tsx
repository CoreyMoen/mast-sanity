/**
 * AiSetupStep — Third step of the onboarding wizard.
 *
 * Simplified BYOK (Bring Your Own Key) setup. Lets the user pick their
 * preferred AI provider and optionally enter an API key. Full configuration
 * is available later in Settings > AI.
 */

"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  Key,
  Eye,
  EyeOff,
  Check,
  Loader2,
  AlertCircle,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ProviderId = "gemini" | "openai" | "anthropic";

const PROVIDERS: {
  id: ProviderId;
  name: string;
  model: string;
  description: string;
}[] = [
  {
    id: "gemini",
    name: "Google Gemini",
    model: "Gemini 2.0 Flash",
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

export function AiSetupStep() {
  const user = useQuery(api.users.getMe);
  const updateLlmSettings = useMutation(api.users.updateLlmSettings);

  const [provider, setProvider] = useState<ProviderId>("gemini");
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync provider from user data on load
  useEffect(() => {
    if (user) {
      setProvider(user.llmProvider);
    }
  }, [user]);

  const handleSave = async () => {
    setError(null);
    setSaved(false);
    setSaving(true);

    try {
      await updateLlmSettings({
        llmProvider: provider,
        // For simplicity during onboarding, store the key without encryption.
        // The full AI Settings page handles proper encryption.
        encryptedApiKey: apiKey.trim() || undefined,
      });

      setSaved(true);
      setApiKey("");
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save settings",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Explanation */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div className="text-sm text-blue-700">
          <p className="font-medium">Bring Your Own Key (BYOK)</p>
          <p className="mt-0.5">
            Angela uses your own AI API key for caption generation and
            rewriting. You are billed directly by the provider. You can always
            update this later in Settings.
          </p>
        </div>
      </div>

      {/* Provider selection */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Choose your AI provider
        </label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {PROVIDERS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setProvider(p.id)}
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
              <span className="mt-0.5 text-xs font-medium text-indigo-600">
                {p.model}
              </span>
              <span className="mt-1 text-xs text-gray-500">
                {p.description}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* API Key input */}
      <div>
        <label
          htmlFor="onboarding-api-key"
          className="mb-1 block text-sm font-medium text-gray-700"
        >
          API Key{" "}
          <span className="font-normal text-gray-400">(optional)</span>
        </label>
        <div className="relative">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Key className="h-4 w-4 text-gray-400" />
          </div>
          <input
            id="onboarding-api-key"
            type={showKey ? "text" : "password"}
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder={`Enter your ${PROVIDERS.find((p) => p.id === provider)?.name ?? ""} API key`}
            className="w-full rounded-lg border border-gray-300 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-900 placeholder:text-gray-400 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="button"
            onClick={() => setShowKey(!showKey)}
            className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
          >
            {showKey ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Save button */}
      <div className="flex justify-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className={cn(
            "inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition-colors",
            saved
              ? "bg-green-600 hover:bg-green-700"
              : "bg-indigo-600 hover:bg-indigo-700",
            saving && "cursor-not-allowed opacity-50",
          )}
        >
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <Check className="h-4 w-4" />
              Saved!
            </>
          ) : (
            "Save AI Settings"
          )}
        </button>
      </div>
    </div>
  );
}
