"use client";

import { useState, useEffect, useCallback, FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Brain,
  Tag,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock,
  Zap,
} from "lucide-react";
import clsx from "clsx";

/* ---------- types ---------- */
interface RetrieveResult {
  title?: string;
  text: string;
  source?: string;
  page?: number;
  score?: number;
  tags?: string[];
}

interface AgentStep {
  thought?: string;
  action?: string;
  observation?: string;
}

interface AgentResponse {
  answer: string;
  steps?: AgentStep[];
  sources?: string[];
}

/* ---------- helpers ---------- */
async function ragFetch(body: Record<string, unknown>) {
  const res = await fetch("/api/rag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || `Request failed (${res.status})`);
  }
  return res.json();
}

function truncate(text: string, max = 220) {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + "…";
}

function scoreColor(score: number) {
  if (score >= 0.85) return "bg-green-500/20 text-green-400";
  if (score >= 0.7) return "bg-yellow-500/20 text-yellow-400";
  return "bg-gray-500/20 text-gray-400";
}

/* ---------- sub-components ---------- */
function TagPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        "inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium transition-colors whitespace-nowrap",
        active
          ? "bg-blue-500/30 text-blue-300 border border-blue-500/50"
          : "bg-gray-700/50 text-gray-400 border border-gray-600 hover:border-gray-500 hover:text-gray-300"
      )}
    >
      <Tag className="w-3 h-3" />
      {label}
    </button>
  );
}

function ResultCard({ r, index }: { r: RetrieveResult; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ delay: index * 0.04 }}
      className="bg-gray-800/60 border border-gray-700 rounded-lg p-4 hover:border-gray-600 transition-colors"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <h4 className="text-sm font-semibold text-white leading-snug line-clamp-1 flex items-center gap-2">
          <FileText className="w-4 h-4 text-blue-400 shrink-0" />
          {r.title || r.source?.split("/").pop() || "Untitled"}
        </h4>
        {r.score != null && (
          <span
            className={clsx(
              "text-[11px] font-mono px-2 py-0.5 rounded-full shrink-0",
              scoreColor(r.score)
            )}
          >
            {(r.score * 100).toFixed(1)}%
          </span>
        )}
      </div>

      <p className="text-sm text-gray-300 leading-relaxed mb-3">
        {truncate(r.text)}
      </p>

      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
        {r.source && (
          <span className="flex items-center gap-1 max-w-[220px] truncate">
            <FileText className="w-3 h-3" />
            {r.source}
          </span>
        )}
        {r.page != null && (
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" /> p.{r.page}
          </span>
        )}
        {r.tags?.map((t) => (
          <span
            key={t}
            className="bg-gray-700/60 text-gray-400 px-2 py-0.5 rounded-full"
          >
            {t}
          </span>
        ))}
      </div>
    </motion.div>
  );
}

function StepAccordion({ steps }: { steps: AgentStep[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-4 border border-gray-700 rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-800/60 hover:bg-gray-800/80 transition-colors text-sm font-medium text-gray-300"
      >
        <span className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          Reasoning Steps ({steps.length})
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4" />
        ) : (
          <ChevronDown className="w-4 h-4" />
        )}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="divide-y divide-gray-700">
              {steps.map((step, i) => (
                <div key={i} className="px-4 py-3 space-y-1.5 text-sm">
                  <div className="flex items-start gap-2">
                    <span className="shrink-0 bg-blue-500/20 text-blue-300 text-[11px] font-mono px-1.5 py-0.5 rounded">
                      Step {i + 1}
                    </span>
                  </div>
                  {step.thought && (
                    <p className="text-gray-300">
                      <span className="text-blue-400 font-medium">
                        Thought:{" "}
                      </span>
                      {step.thought}
                    </p>
                  )}
                  {step.action && (
                    <p className="text-gray-300">
                      <span className="text-yellow-400 font-medium">
                        Action:{" "}
                      </span>
                      <code className="text-xs bg-gray-900/60 px-1.5 py-0.5 rounded">
                        {step.action}
                      </code>
                    </p>
                  )}
                  {step.observation && (
                    <p className="text-gray-400 text-xs leading-relaxed">
                      <span className="text-green-400 font-medium">
                        Observation:{" "}
                      </span>
                      {step.observation}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ---------- main component ---------- */
export default function SemanticSearch() {
  const [mode, setMode] = useState<"search" | "agent">("search");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // tags
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // results
  const [searchResults, setSearchResults] = useState<RetrieveResult[]>([]);
  const [agentResult, setAgentResult] = useState<AgentResponse | null>(null);

  // fetch tags on mount
//   useEffect(() => {
//     ragFetch({ action: "tags" })
//       .then((data) => {
//         const tags: string[] = Array.isArray(data)
//           ? data
//           : Array.isArray(data.tags)
//           ? data.tags
//           : [];
//         setAvailableTags(tags);
//       })
//       .catch(() => {
//         /* silently ignore – tags are optional */
//       });
//   }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const handleSubmit = useCallback(
    async (e?: FormEvent) => {
      e?.preventDefault();
      const trimmed = query.trim();
      if (!trimmed) return;

      setError(null);
      setLoading(true);
      setSearchResults([]);
      setAgentResult(null);

      try {
        if (mode === "search") {
          const data = await ragFetch({
            action: "retrieve",
            question: trimmed,
            top_k: 8,
            tags: selectedTags.length > 0 ? selectedTags : undefined,
          });
          const results: RetrieveResult[] = Array.isArray(data)
            ? data
            : Array.isArray(data.results)
            ? data.results
            : [];
          setSearchResults(results);
        } else {
          const data = await ragFetch({
            action: "agent",
            question: trimmed,
            max_steps: 5,
          });
          setAgentResult(data);
        }
      } catch (err: unknown) {
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    },
    [query, mode, selectedTags]
  );

  return (
    <section className="bg-gray-800/40 backdrop-blur-sm rounded-lg border border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 bg-gray-800/60 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white flex items-center gap-2">
          <Search className="w-4 h-4 text-blue-500" />
          Semantic Search
        </h3>

        {/* Mode toggle */}
        <div className="flex items-center bg-gray-900/60 rounded-full p-0.5 border border-gray-700">
          <button
            type="button"
            onClick={() => setMode("search")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
              mode === "search"
                ? "bg-blue-500/20 text-blue-300"
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            <Search className="w-3 h-3" />
            Search
          </button>
          <button
            type="button"
            onClick={() => setMode("agent")}
            className={clsx(
              "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-colors",
              mode === "agent"
                ? "bg-purple-500/20 text-purple-300"
                : "text-gray-400 hover:text-gray-300"
            )}
          >
            <Brain className="w-3 h-3" />
            Agent
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Search bar */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={
                mode === "search"
                  ? "Search your documents…"
                  : "Ask the AI agent a question…"
              }
              className="w-full bg-gray-900/60 border border-gray-700 rounded-lg pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/30 transition-colors"
            />
            {mode === "search" ? (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            ) : (
              <Brain className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            )}
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className={clsx(
              "px-5 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center gap-2",
              mode === "search"
                ? "bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/40 text-white"
                : "bg-purple-600 hover:bg-purple-500 disabled:bg-purple-600/40 text-white"
            )}
          >
            {loading ? (
              <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
            ) : mode === "search" ? (
              <Search className="w-4 h-4" />
            ) : (
              <Zap className="w-4 h-4" />
            )}
            {mode === "search" ? "Search" : "Ask"}
          </button>
        </form>

        {/* Tag filter */}
        {availableTags.length > 0 && mode === "search" && (
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-gray-700">
            <span className="text-xs text-gray-500 shrink-0">Filter:</span>
            {availableTags.map((tag) => (
              <TagPill
                key={tag}
                label={tag}
                active={selectedTags.includes(tag)}
                onClick={() => toggleTag(tag)}
              />
            ))}
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3 text-sm text-red-400"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-3">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500/30 border-t-blue-500" />
              <span className="text-xs text-gray-500">
                {mode === "search"
                  ? "Searching documents…"
                  : "Agent is thinking…"}
              </span>
            </div>
          </div>
        )}

        {/* Search results */}
        {!loading && mode === "search" && searchResults.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-3"
          >
            <p className="text-xs text-gray-500">
              {searchResults.length} result
              {searchResults.length !== 1 ? "s" : ""} found
            </p>
            <AnimatePresence mode="popLayout">
              {searchResults.map((r, i) => (
                <ResultCard key={`${r.source}-${r.page}-${i}`} r={r} index={i} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Agent result */}
        {!loading && mode === "agent" && agentResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* Answer card */}
            <div className="bg-gray-800/60 border border-purple-500/30 rounded-lg p-5">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs font-medium text-purple-400 uppercase tracking-wider">
                  Agent Answer
                </span>
              </div>
              <div className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">
                {agentResult.answer}
              </div>
              {/* Source citations */}
              {agentResult.sources && agentResult.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-gray-700">
                  <p className="text-xs text-gray-500 mb-2 flex items-center gap-1">
                    <FileText className="w-3 h-3" /> Sources
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {agentResult.sources.map((src, i) => (
                      <span
                        key={i}
                        className="text-xs bg-gray-700/60 text-gray-400 px-2 py-1 rounded"
                      >
                        {src}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Reasoning steps */}
            {agentResult.steps && agentResult.steps.length > 0 && (
              <StepAccordion steps={agentResult.steps} />
            )}
          </motion.div>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          searchResults.length === 0 &&
          !agentResult &&
          query.trim() === "" && (
            <div className="text-center py-8">
              <Search className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-sm text-gray-500">
                {mode === "search"
                  ? "Search across your ingested documents"
                  : "Ask the AI agent to research and answer questions"}
              </p>
            </div>
          )}
      </div>
    </section>
  );
}
