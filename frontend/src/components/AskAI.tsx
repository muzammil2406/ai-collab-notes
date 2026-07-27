"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

export default function AskAI() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [sourceId, setSourceId] = useState<string | null>(null);
  const [sourceTitle, setSourceTitle] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    try {
      const { data } = await api.post("/ai/ask", { question });
      setAnswer(data.answer);
      setSourceId(data.sourceNoteId);
      setSourceTitle(data.sourceNoteTitle);
    } catch (error: any) {
      setAnswer(
        error.response?.data?.message || "Failed to get answer. Check API key."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-b border-neutral-800 bg-[#111111]">
      <form onSubmit={handleAsk} className="flex items-center gap-3 px-6 py-3">
        <span className="text-purple-400 text-sm shrink-0">Ask AI</span>
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about your notes..."
          className="flex-1 px-3 py-2 bg-[#1a1a1a] border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 focus:border-purple-500/50 transition"
        />
        <button
          type="submit"
          disabled={loading || !question.trim()}
          className="px-4 py-2 bg-purple-600 text-white text-sm rounded-lg hover:bg-purple-500 disabled:opacity-40 transition font-medium shrink-0"
        >
          {loading ? "Thinking..." : "Ask"}
        </button>
      </form>

      {answer && (
        <div className="px-6 pb-4">
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <p className="text-sm text-neutral-300 leading-relaxed whitespace-pre-line">
              {answer}
            </p>
            {sourceId && sourceTitle && (
              <button
                onClick={() => router.push(`/notes/${sourceId}`)}
                className="mt-3 text-xs text-purple-400 hover:text-purple-300 transition"
              >
                Source: {sourceTitle} &rarr;
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
