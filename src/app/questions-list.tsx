"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Question = {
  id: string;
  body: string;
  author: string | null;
  category: "What" | "Why" | "When" | "Where" | "Who" | "Which" | "Whose" | "How";
  votes: number;
};

const CATEGORIES = [
  { name: "All", icon: "🌐" },
  { name: "What", icon: "❓" },
  { name: "Why", icon: "💡" },
  { name: "When", icon: "🕒" },
  { name: "Where", icon: "📍" },
  { name: "Who", icon: "👤" },
  { name: "Which", icon: "🔀" },
  { name: "Whose", icon: "🏷️" },
  { name: "How", icon: "⚙️" },
];

export default function QuestionsList({
  initialQuestions,
  initialHasMore,
}: {
  initialQuestions: Question[];
  initialHasMore: boolean;
}) {
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [draft, setDraft] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [showFilters, setShowFilters] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [improving, setImproving] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // Debounced search & filter
  useEffect(() => {
    if (!hydrated) return;
    const id = setTimeout(async () => {
      setLoading(true);
      try {
        let url = "/api/questions?";
        if (query) url += `q=${encodeURIComponent(query)}&`;
        if (activeCategory !== "All") url += `category=${activeCategory}&`;

        const res = await fetch(url);
        const data = await res.json();
        setQuestions(data.questions || []);
        setHasMore(data.hasMore || false);
      } catch (err) {
        showToast("Error retrieving questions", "error");
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(id);
  }, [query, activeCategory, hydrated]);

  async function submit() {
    if (!draft.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          body: draft,
          author: authorName.trim() || "Anonymous",
        }),
      });

      if (!res.ok) throw new Error("Failed to submit question");
      const created = await res.json();

      setQuestions((qs) => [{ ...created, votes: 0 }, ...qs]);
      setDraft("");
      setAuthorName("");
      showToast("Question posted successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to submit question", "error");
    } finally {
      setSubmitting(false);
    }
  }

  async function improveQuestion() {
    if (!draft.trim()) {
      showToast("Please type a question to improve first!", "error");
      return;
    }
    setImproving(true);
    try {
      const res = await fetch("/api/improve-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: draft }),
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to improve question");

      setDraft(data.improved);
      showToast("Question enhanced by Gemini AI!");
    } catch (err: any) {
      showToast(err.message || "Could not improve question. Try again.", "error");
    } finally {
      setImproving(false);
    }
  }

  async function upvote(id: string) {
    // Optimistic UI update
    setQuestions((qs) =>
      qs.map((q) => (q.id === id ? { ...q, votes: q.votes + 1 } : q))
    );

    try {
      const res = await fetch(`/api/questions/${id}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ voterId: getVoterId() }),
      });

      if (!res.ok) {
        // Rollback
        setQuestions((qs) =>
          qs.map((q) => (q.id === id ? { ...q, votes: q.votes - 1 } : q))
        );
        if (res.status === 409) {
          showToast("You have already upvoted this question!", "error");
        } else {
          throw new Error();
        }
      } else {
        showToast("Upvoted question!");
      }
    } catch {
      showToast("Error processing vote", "error");
    }
  }

  async function loadMore() {
    if (loadingMore) return;
    setLoadingMore(true);
    try {
      let url = `/api/questions?offset=${questions.length}`;
      if (activeCategory !== "All") url += `&category=${activeCategory}`;
      if (query) url += `&q=${encodeURIComponent(query)}`;

      const res = await fetch(url);
      const data = await res.json();
      setQuestions((qs) => [...qs, ...(data.questions || [])]);
      setHasMore(data.hasMore || false);
    } catch {
      showToast("Failed to load more questions", "error");
    } finally {
      setLoadingMore(false);
    }
  }

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-[100] px-4 py-3 rounded-xl shadow-lg flex items-center gap-2 border text-sm font-semibold transition-all duration-300 transform translate-y-0 scale-100 ${
            toast.type === "success"
              ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900"
              : "bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-900"
          }`}
        >
          <span>{toast.type === "success" ? "✓" : "⚠"}</span>
          {toast.message}
        </div>
      )}

      {/* Ask Question Form */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !submitting && !improving && submit()}
            placeholder="What is your question? Ask something constructive..."
            disabled={submitting || improving}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-hidden placeholder:text-muted focus:border-brand focus:ring-1 focus:ring-brand disabled:opacity-60"
          />
          
          <button
            onClick={improveQuestion}
            disabled={improving || submitting || !draft.trim()}
            title="Improve question with Gemini AI"
            className="flex items-center justify-center rounded-xl border border-border bg-card hover:bg-accent text-foreground hover:text-accent-foreground px-3.5 py-3 text-sm font-semibold transition-all hover:border-indigo-400 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            {improving ? (
              <svg className="animate-spin h-5 w-5 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <span>✨ Improve</span>
            )}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name (optional, defaults to Anonymous)"
            disabled={submitting || improving}
            className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs outline-hidden placeholder:text-muted focus:border-brand disabled:opacity-60"
          />
          <button
            onClick={submit}
            disabled={submitting || improving || !draft.trim()}
            className="rounded-xl bg-brand px-6 py-2.5 text-sm font-bold text-white shadow-xs hover:bg-brand-strong transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {submitting ? "Posting..." : "Ask Question"}
          </button>
        </div>
      </div>

      {/* Control bar: Search + Categorization toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search questions..."
            className="w-full rounded-xl border border-border bg-card px-4 py-2.5 pl-10 text-sm outline-hidden placeholder:text-muted focus:border-brand"
          />
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted text-sm">🔍</span>
        </div>

        <div className="flex items-center gap-2 justify-between shrink-0">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-1.5 rounded-xl border px-4 py-2.5 text-sm font-semibold transition-all cursor-pointer ${
              showFilters || activeCategory !== "All"
                ? "border-brand bg-brand-soft text-brand"
                : "border-border bg-card hover:bg-accent hover:text-accent-foreground text-foreground"
            }`}
          >
            <span>🎛️</span>
            <span>Filter Categories</span>
            {activeCategory !== "All" && (
              <span className="ml-1 rounded-full bg-brand px-2 py-0.5 text-2xs font-extrabold text-white">
                1
              </span>
            )}
          </button>

          <span className="text-2xs font-medium text-muted pl-2 select-none border-l border-border h-6 flex items-center">
            {hydrated ? "Active ✓" : "Loading..."}
          </span>
        </div>
      </div>

      {/* Categories Bar */}
      {showFilters && (
        <div className="rounded-2xl border border-border bg-card/50 p-4 shadow-xs flex flex-wrap gap-2 transition-all duration-200 animate-float-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.name}
              onClick={() => setActiveCategory(cat.name)}
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-semibold transition-all cursor-pointer ${
                activeCategory === cat.name
                  ? "bg-brand text-white shadow-xs"
                  : "bg-background hover:bg-accent hover:text-accent-foreground text-foreground border border-border"
              }`}
            >
              <span>{cat.icon}</span>
              <span>{cat.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Main Questions List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-24 rounded-2xl border border-border bg-card/40 animate-pulse" />
          ))}
        </div>
      ) : (
        <ul className="space-y-3">
          {questions.map((q) => (
            <li
              key={q.id}
              className="flex items-start gap-4 rounded-2xl border border-border bg-card p-4 shadow-xs transition-all duration-200 hover:shadow-md hover:border-brand/20 group"
            >
              {/* Upvote Button */}
              <button
                onClick={() => upvote(q.id)}
                className="flex shrink-0 flex-col items-center gap-0.5 rounded-xl border border-border px-3.5 py-2.5 text-brand bg-background/50 hover:bg-brand hover:text-white hover:border-brand transition-all active:scale-95 cursor-pointer"
              >
                <span className="text-xs leading-none">▲</span>
                <span className="text-sm font-extrabold leading-none tabular-nums mt-1">
                  {q.votes}
                </span>
              </button>

              <div className="min-w-0 flex-1 pt-0.5">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 rounded-md bg-secondary text-secondary-foreground px-2 py-0.5 text-3xs font-extrabold tracking-wide uppercase">
                    {q.category}
                  </span>
                  {q.author && (
                    <span className="text-2xs text-muted">
                      by <span className="font-semibold">{q.author}</span>
                    </span>
                  )}
                </div>
                <p className="leading-relaxed text-sm text-foreground/90 font-medium whitespace-pre-line break-words">
                  {q.body}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Empty State */}
      {!loading && questions.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-12 text-center max-w-lg mx-auto space-y-3">
          <div className="text-4xl">💭</div>
          <h3 className="text-base font-bold text-foreground">Questions</h3>
          <p className="text-xs text-muted max-w-xs mx-auto">
            {activeCategory !== "All"
              ? `There are no questions categorized under "${activeCategory}" yet. Be the first to ask!`
              : "No questions match your query. Try searching for something else or submit a new question."}
          </p>
        </div>
      )}

      {/* Load More Button */}
      {hasMore && !loading && (
        <div className="flex justify-center pt-2">
          <button
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-semibold hover:border-brand hover:text-brand hover:bg-brand-soft transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loadingMore ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin h-4 w-4 text-brand" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Loading more...
              </span>
            ) : (
              "Load more questions"
            )}
          </button>
        </div>
      )}
    </div>
  );
}