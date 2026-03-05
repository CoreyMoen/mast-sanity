"use client";

import { useState, KeyboardEvent } from "react";
import { X } from "lucide-react";

interface HashtagInputProps {
  hashtags: string[];
  onChange: (hashtags: string[]) => void;
}

export function HashtagInput({ hashtags, onChange }: HashtagInputProps) {
  const [inputValue, setInputValue] = useState("");

  function addHashtag(raw: string) {
    // Strip leading # and whitespace, lowercase
    const tag = raw.replace(/^#/, "").trim().toLowerCase();
    if (!tag) return;
    if (hashtags.includes(tag)) {
      setInputValue("");
      return;
    }
    onChange([...hashtags, tag]);
    setInputValue("");
  }

  function removeHashtag(tag: string) {
    onChange(hashtags.filter((h) => h !== tag));
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addHashtag(inputValue);
    }
    // Allow backspace to remove last hashtag when input is empty
    if (e.key === "Backspace" && !inputValue && hashtags.length > 0) {
      removeHashtag(hashtags[hashtags.length - 1]);
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        Hashtags
      </label>
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
        {hashtags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-medium text-indigo-700"
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeHashtag(tag)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full text-indigo-400 hover:bg-indigo-200 hover:text-indigo-600 transition-colors"
              aria-label={`Remove #${tag}`}
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={hashtags.length === 0 ? "Type a hashtag and press Enter" : "Add more..."}
          className="min-w-[120px] flex-1 border-0 bg-transparent p-0 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-0"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        Press Enter or comma to add. Backspace to remove the last tag.
      </p>
    </div>
  );
}
