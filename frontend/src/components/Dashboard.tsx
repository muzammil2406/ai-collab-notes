"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface Stats {
  totalNotes: number;
  notesThisWeek: number;
  topTags: { tag: string; count: number }[];
  recentNotes: { id: string; title: string; updatedAt: string }[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    api
      .get("/notes/stats")
      .then(({ data }) => {
        setStats(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500 animate-pulse">Loading dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!stats) return null;

  const maxTagCount = Math.max(stats.topTags[0]?.count ?? 1, 1);

  return (
    <div className="h-full overflow-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-white mb-1">Dashboard</h1>
        <p className="text-sm text-neutral-500 mb-8">
          Overview of your knowledge base
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="p-5 bg-[#141414] border border-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Total Notes</p>
            <p className="text-3xl font-bold text-white">{stats.totalNotes}</p>
          </div>
          <div className="p-5 bg-[#141414] border border-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Created This Week</p>
            <p className="text-3xl font-bold text-blue-400">
              {stats.notesThisWeek}
            </p>
          </div>
          <div className="p-5 bg-[#141414] border border-neutral-800 rounded-xl">
            <p className="text-sm text-neutral-500 mb-1">Unique Tags</p>
            <p className="text-3xl font-bold text-violet-400">
              {stats.topTags.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 bg-[#141414] border border-neutral-800 rounded-xl">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Tag Cloud
            </h2>
            {stats.topTags.length === 0 ? (
              <p className="text-sm text-neutral-600">No tags yet</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.topTags.map(({ tag, count }) => {
                  const scale = 0.75 + (count / maxTagCount) * 0.5;
                  const opacity = 0.4 + (count / maxTagCount) * 0.6;
                  return (
                    <span
                      key={tag}
                      className="px-3 py-1.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-lg cursor-default"
                      style={{
                        fontSize: `${scale}rem`,
                        opacity,
                      }}
                    >
                      {tag}
                      <span className="ml-1 text-neutral-600 text-xs">
                        {count}
                      </span>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="p-6 bg-[#141414] border border-neutral-800 rounded-xl">
            <h2 className="text-sm font-semibold text-neutral-400 uppercase tracking-wider mb-4">
              Recent Activity
            </h2>
            {stats.recentNotes.length === 0 ? (
              <p className="text-sm text-neutral-600">No notes yet</p>
            ) : (
              <div className="space-y-2">
                {stats.recentNotes.slice(0, 8).map((note) => (
                  <button
                    key={note.id}
                    onClick={() => router.push(`/notes/${note.id}`)}
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-neutral-800/50 transition text-left"
                  >
                    <span className="text-sm text-neutral-300 truncate">
                      {note.title}
                    </span>
                    <span className="text-xs text-neutral-600 shrink-0 ml-3">
                      {new Date(note.updatedAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <button
            onClick={() => router.push("/notes")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition font-medium"
          >
            Open Notes Editor &rarr;
          </button>
        </div>
      </div>
    </div>
  );
}
