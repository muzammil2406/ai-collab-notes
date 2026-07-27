"use client";

import { useState } from "react";
import api from "@/lib/api";

interface Props {
  content: string;
  existingTags: string[];
  onAddTag: (tag: string) => void;
  onClose: () => void;
}

export default function AITagSuggestions({
  content,
  existingTags,
  onAddTag,
  onClose,
}: Props) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSuggestions = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/ai/tags", { content });
      setSuggestions(data.tags || []);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to suggest tags. Check API key."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mb-4 p-4 bg-violet-500/10 border border-violet-500/20 rounded-xl">
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs font-semibold text-violet-400 uppercase tracking-wider">
          AI Tag Suggestions
        </h4>
        <button
          onClick={onClose}
          className="text-neutral-600 hover:text-neutral-300 text-sm transition"
        >
          &times;
        </button>
      </div>

      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
          {error}
        </div>
      )}

      {suggestions.length === 0 && !loading && !error && (
        <button
          onClick={fetchSuggestions}
          disabled={!content.trim()}
          className="px-3 py-1.5 text-xs bg-violet-600 text-white rounded-lg hover:bg-violet-500 disabled:opacity-40 transition"
        >
          Get AI Suggestions
        </button>
      )}

      {loading && (
        <p className="text-sm text-neutral-400 animate-pulse">
          Analyzing content...
        </p>
      )}

      {suggestions.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {suggestions.map((tag) => {
            const exists = existingTags.includes(tag);
            return (
              <button
                key={tag}
                onClick={() => !exists && onAddTag(tag)}
                disabled={exists}
                className={`px-3 py-1.5 text-xs rounded-lg transition ${
                  exists
                    ? "bg-neutral-800 text-neutral-600 cursor-default"
                    : "bg-violet-600/30 text-violet-300 hover:bg-violet-600/50 border border-violet-500/30"
                }`}
              >
                {tag} {exists ? "added" : "+ add"}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
