"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import api from "@/lib/api";
import AISummary from "./AISummary";
import AITagSuggestions from "./AITagSuggestions";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), {
  ssr: false,
});

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [summary, setSummary] = useState<string | null>(null);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const titleRef = useRef(title);
  const contentRef = useRef(content);
  const tagsRef = useRef(tags);
  titleRef.current = title;
  contentRef.current = content;
  tagsRef.current = tags;

  useEffect(() => {
    api
      .get(`/notes/${id}`)
      .then(({ data }) => {
        setTitle(data.title);
        setContent(data.content);
        setTags(data.tags || []);
        setSummary(data.summary || null);
        setLastSaved(new Date(data.updatedAt));
      })
      .catch((err) => {
        if (err.response?.status === 404) {
          router.push("/notes");
        } else {
          setError("Failed to load note. Please try again.");
        }
      })
      .finally(() => setLoading(false));
  }, [id, router]);

  const saveNote = useCallback(
    async (
      newTitle: string,
      newContent: string,
      newTags: string[],
      newSummary?: string | null
    ) => {
      try {
        setSaving(true);
        const payload: any = {
          title: newTitle,
          content: newContent,
          tags: newTags,
        };
        if (newSummary !== undefined) payload.summary = newSummary;
        await api.put(`/notes/${id}`, payload);
        setLastSaved(new Date());
      } catch (error) {
        console.error("Failed to save:", error);
      } finally {
        setSaving(false);
      }
    },
    [id]
  );

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      api
        .put(`/notes/${id}`, {
          title: titleRef.current,
          content: contentRef.current,
          tags: tagsRef.current,
        })
        .catch(() => {});
    };
  }, [id]);

  const scheduleSave = (
    newTitle: string,
    newContent: string,
    newTags: string[],
    newSummary?: string | null
  ) => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      saveNote(newTitle, newContent, newTags, newSummary);
    }, 2000);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(val, contentRef.current, tagsRef.current);
  };

  const handleContentChange = (val: string | undefined) => {
    const v = val || "";
    setContent(v);
    scheduleSave(titleRef.current, v, tagsRef.current);
  };

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase();
    if (trimmed && !tagsRef.current.includes(trimmed)) {
      const newTags = [...tagsRef.current, trimmed];
      setTags(newTags);
      scheduleSave(titleRef.current, contentRef.current, newTags);
    }
  };

  const removeTag = (tag: string) => {
    const newTags = tagsRef.current.filter((t) => t !== tag);
    setTags(newTags);
    scheduleSave(titleRef.current, contentRef.current, newTags);
  };

  const handleSummary = (newSummary: string) => {
    setSummary(newSummary);
    scheduleSave(
      titleRef.current,
      contentRef.current,
      tagsRef.current,
      newSummary
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-neutral-500 animate-pulse">Loading note...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-red-400 mb-3">{error}</p>
          <button
            onClick={() => router.push("/notes")}
            className="text-sm text-neutral-400 hover:text-white transition"
          >
            Back to notes
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between px-6 py-3 border-b border-neutral-800 shrink-0">
        <div className="text-sm text-neutral-500">
          {saving ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full animate-pulse" />
              Saving...
            </span>
          ) : lastSaved ? (
            <span className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              Saved{" "}
              {lastSaved.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          ) : (
            "Not yet saved"
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowTagSuggestions(!showTagSuggestions)}
            className="px-3 py-1.5 text-xs bg-violet-600/20 text-violet-400 border border-violet-500/30 rounded-lg hover:bg-violet-600/30 transition"
          >
            Suggest Tags
          </button>
          <AISummary content={content} onSummary={handleSummary} />
        </div>
      </div>

      <div className="flex-1 overflow-auto px-8 py-6">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note title..."
          className="w-full text-3xl font-bold text-white placeholder-neutral-700 border-none outline-none mb-4 bg-transparent"
        />

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2.5 py-1 bg-neutral-800 text-neutral-300 text-xs rounded-lg"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="text-neutral-600 hover:text-red-400 transition text-sm leading-none"
              >
                &times;
              </button>
            </span>
          ))}
          <input
            type="text"
            value={tagInput}
            placeholder="Add tag..."
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && tagInput.trim()) {
                addTag(tagInput);
                setTagInput("");
              }
            }}
            className="px-2 py-1 bg-transparent text-xs text-neutral-400 placeholder-neutral-700 border-none outline-none w-20"
          />
        </div>

        {showTagSuggestions && (
          <AITagSuggestions
            content={content}
            existingTags={tags}
            onAddTag={addTag}
            onClose={() => setShowTagSuggestions(false)}
          />
        )}

        {summary && (
          <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <h4 className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-2">
              AI Summary
            </h4>
            <div className="text-sm text-neutral-300 whitespace-pre-line leading-relaxed">
              {summary}
            </div>
          </div>
        )}

        <div data-color-mode="dark" className="min-h-[400px]">
          <MDEditor
            value={content}
            onChange={handleContentChange}
            height={500}
            preview="live"
          />
        </div>
      </div>
    </div>
  );
}
