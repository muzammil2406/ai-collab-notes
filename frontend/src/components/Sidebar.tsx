"use client";

import { useState, useEffect, useMemo, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";

interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  updatedAt: string;
}

function escapeRegex(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function HighlightText({ text, query }: { text: string; query: string }) {
  if (!query) return <>{text}</>;
  const escaped = escapeRegex(query);
  const parts = text.split(new RegExp(`(${escaped})`, "gi"));
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <mark
            key={i}
            className="bg-yellow-500/30 text-yellow-200 rounded px-0.5"
          >
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function Sidebar() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const fetchNotes = () => {
    api
      .get("/notes")
      .then(({ data }) => {
        setNotes(data);
        setError(null);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load notes");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchNotes();
  }, []);

  const allTags = useMemo(() => {
    const tagCount: Record<string, number> = {};
    for (const note of notes) {
      for (const tag of note.tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }
    return Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }));
  }, [notes]);

  const filteredNotes = useMemo(() => {
    return notes.filter((note) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !search ||
        note.title.toLowerCase().includes(q) ||
        note.content.toLowerCase().includes(q) ||
        note.tags.some((t) => t.toLowerCase().includes(q));

      const matchesTag = !selectedTag || note.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [notes, search, selectedTag]);

  const createNote = async () => {
    try {
      const { data } = await api.post("/notes", { title: "Untitled" });
      setNotes((prev) => [data, ...prev]);
      router.push(`/notes/${data.id}`);
    } catch (error) {
      console.error("Failed to create note:", error);
    }
  };

  const deleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await api.delete(`/notes/${id}`);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      if (pathname === `/notes/${id}`) router.push("/notes");
    } catch (error) {
      console.error("Failed to delete note:", error);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/auth/login");
  };

  const formatDate = (date: string) => {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="w-72 border-r border-neutral-800 bg-[#111111] flex flex-col h-full shrink-0">
      <div className="p-4 border-b border-neutral-800">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-base font-semibold text-white">Knowledge Base</h1>
          <button
            onClick={handleLogout}
            className="text-xs text-neutral-500 hover:text-neutral-300 transition"
          >
            Logout
          </button>
        </div>
        <p className="text-xs text-neutral-600 mb-3 truncate">{user?.email}</p>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes..."
          className="w-full px-3 py-2 bg-[#1a1a1a] border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-600 focus:outline-none focus:ring-1 focus:ring-neutral-600 transition"
        />
      </div>

      {allTags.length > 0 && (
        <div className="px-4 py-2 border-b border-neutral-800 flex gap-1.5 flex-wrap">
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="px-2 py-0.5 text-xs bg-neutral-700 text-neutral-300 rounded-full hover:bg-neutral-600 transition"
            >
              Clear
            </button>
          )}
          {allTags.slice(0, 8).map(({ tag }) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedTag(selectedTag === tag ? null : tag)
              }
              className={`px-2 py-0.5 text-xs rounded-full transition ${
                selectedTag === tag
                  ? "bg-blue-600 text-white"
                  : "bg-neutral-800 text-neutral-400 hover:bg-neutral-700"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>
      )}

      <button
        onClick={createNote}
        className="mx-4 mt-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-500 transition font-medium"
      >
        + New Note
      </button>

      <div className="flex-1 overflow-y-auto mt-2 px-2">
        {loading ? (
          <p className="p-4 text-sm text-neutral-600 text-center">Loading...</p>
        ) : error ? (
          <p className="p-4 text-sm text-red-400 text-center">{error}</p>
        ) : filteredNotes.length === 0 ? (
          <p className="p-4 text-sm text-neutral-600 text-center">
            {search || selectedTag ? "No matching notes" : "No notes yet"}
          </p>
        ) : (
          filteredNotes.map((note) => (
            <div
              key={note.id}
              onClick={() => router.push(`/notes/${note.id}`)}
              className={`group mb-1 p-3 rounded-lg cursor-pointer transition ${
                pathname === `/notes/${note.id}`
                  ? "bg-neutral-800 border-l-2 border-blue-500"
                  : "hover:bg-neutral-800/50"
              }`}
            >
              <div className="flex items-start justify-between">
                <h3 className="text-sm font-medium text-neutral-200 truncate flex-1">
                  <HighlightText text={note.title} query={search} />
                </h3>
                <button
                  onClick={(e) => deleteNote(note.id, e)}
                  className="opacity-0 group-hover:opacity-100 text-neutral-600 hover:text-red-400 text-sm leading-none px-1 transition ml-2"
                >
                  &times;
                </button>
              </div>
              <p className="text-xs text-neutral-500 mt-1">
                {formatDate(note.updatedAt)}
              </p>
              {note.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {note.tags.slice(0, 3).map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 bg-neutral-800 text-neutral-500 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {note.tags.length > 3 && (
                    <span className="text-[10px] text-neutral-600">
                      +{note.tags.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
