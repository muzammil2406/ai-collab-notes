"use client";

import { useState } from "react";
import api from "@/lib/api";

interface Props {
  content: string;
  onSummary: (summary: string) => void;
}

export default function AISummary({ content, onSummary }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSummarize = async () => {
    if (!content.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post("/ai/summarize", { content });
      onSummary(data.summary);
    } catch (err: any) {
      setError(
        err.response?.data?.message || "Failed to summarize. Check API key."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleSummarize}
        disabled={loading || !content.trim()}
        className="px-3 py-1.5 text-xs bg-purple-600/20 text-purple-400 border border-purple-500/30 rounded-lg hover:bg-purple-600/30 disabled:opacity-40 transition"
      >
        {loading ? (
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-purple-400 rounded-full animate-pulse" />
            Summarizing...
          </span>
        ) : (
          "Summarize with AI"
        )}
      </button>
      {error && (
        <div className="absolute top-full mt-2 right-0 z-10 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400 whitespace-nowrap max-w-xs">
          {error}
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-300"
          >
            &times;
          </button>
        </div>
      )}
    </div>
  );
}
