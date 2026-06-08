"use client";
import { useState, useEffect } from "react";
import { getVoterId } from "@/lib/voter";

type Option = {
  id: string;
  option_text: string;
  votes: number;
};

type Poll = {
  id: string;
  question: string;
  author: string | null;
  created_at: string;
  options: Option[];
};

export default function PollsList({ initialPolls }: { initialPolls: Poll[] }) {
  const [polls, setPolls] = useState<Poll[]>(initialPolls);
  const [userVotes, setUserVotes] = useState<{ [pollId: string]: string }>({});
  
  // Selection state for radio buttons: pollId -> optionId
  const [selectedOptions, setSelectedOptions] = useState<{ [pollId: string]: string }>({});
  
  // Override state to view results without voting: pollId -> boolean
  const [showResultsOverride, setShowResultsOverride] = useState<{ [pollId: string]: boolean }>({});
  
  // Loading state for voting: pollId -> boolean
  const [votingLoading, setVotingLoading] = useState<{ [pollId: string]: boolean }>({});

  const [isCreating, setIsCreating] = useState(false);

  // New poll form state
  const [newQuestion, setNewQuestion] = useState("");
  const [newOptions, setNewOptions] = useState<string[]>(["", ""]);
  const [newAuthor, setNewAuthor] = useState("");
  const [creatingLoading, setCreatingLoading] = useState(false);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const id = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(id);
    }
  }, [toast]);

  // Fetch initial user votes and register periodic background updates
  useEffect(() => {
    async function fetchUserVotesAndSync() {
      try {
        const res = await fetch(`/api/polls?voterId=${getVoterId()}`);
        const data = await res.json();
        if (data.polls) setPolls(data.polls);
        if (data.userVotes) setUserVotes(data.userVotes);
      } catch {
        // Silently catch background errors
      }
    }
    fetchUserVotesAndSync();

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/polls?voterId=${getVoterId()}`);
        const data = await res.json();
        if (data.polls) setPolls(data.polls);
        if (data.userVotes) setUserVotes(data.userVotes);
      } catch {
        // Silently catch background errors
      }
    }, 5000); // sync every 5 seconds

    return () => clearInterval(interval);
  }, []);

  const handleAddOption = () => {
    if (newOptions.length < 5) {
      setNewOptions([...newOptions, ""]);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (newOptions.length > 2) {
      const opts = [...newOptions];
      opts.splice(index, 1);
      setNewOptions(opts);
    }
  };

  const handleOptionChange = (index: number, val: string) => {
    const opts = [...newOptions];
    opts[index] = val;
    setNewOptions(opts);
  };

  async function createPoll() {
    if (!newQuestion.trim()) {
      showToast("Poll question is required", "error");
      return;
    }

    const validOptions = newOptions.map(o => o.trim()).filter(Boolean);
    if (validOptions.length < 2) {
      showToast("At least two options are required", "error");
      return;
    }

    setCreatingLoading(true);
    try {
      const res = await fetch("/api/polls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: newQuestion,
          options: validOptions,
          author: newAuthor,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create poll");

      setPolls((prev) => [data, ...prev]);
      setNewQuestion("");
      setNewOptions(["", ""]);
      setNewAuthor("");
      setIsCreating(false);
      showToast("Poll created successfully!");
    } catch (err: any) {
      showToast(err.message || "Failed to create poll", "error");
    } finally {
      setCreatingLoading(false);
    }
  }

  async function handleVoteSubmit(pollId: string) {
    const optionId = selectedOptions[pollId];
    if (!optionId) {
      showToast("Please select an option to vote!", "error");
      return;
    }

    setVotingLoading((prev) => ({ ...prev, [pollId]: true }));

    try {
      const res = await fetch(`/api/polls/${pollId}/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voterId: getVoterId(),
          optionId,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to submit vote", "error");
      } else {
        setUserVotes((prev) => ({ ...prev, [pollId]: optionId }));
        setPolls((prevPolls) =>
          prevPolls.map((p) => {
            if (p.id !== pollId) return p;
            return {
              ...p,
              options: p.options.map((o) =>
                o.id === optionId ? { ...o, votes: o.votes + 1 } : o
              ),
            };
          })
        );
        showToast("Vote registered successfully!");
      }
    } catch {
      showToast("Error connecting to server", "error");
    } finally {
      setVotingLoading((prev) => ({ ...prev, [pollId]: false }));
    }
  }

  const toggleResultsOverride = (pollId: string) => {
    setShowResultsOverride((prev) => ({ ...prev, [pollId]: !prev[pollId] }));
  };

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

      {/* Trigger or Poll Creation Box */}
      {!isCreating ? (
        <button
          onClick={() => setIsCreating(true)}
          className="w-full flex items-center justify-between rounded-2xl border border-dashed border-border bg-card/40 hover:bg-card p-5 hover:border-brand transition-all cursor-pointer group"
        >
          <div className="text-left">
            <h3 className="text-sm font-bold text-foreground group-hover:text-brand transition-colors">
              Have a question for the group?
            </h3>
            <p className="text-xs text-muted mt-1">
              Create a quick multiple-choice poll to gather votes.
            </p>
          </div>
          <span className="h-10 w-10 flex items-center justify-center rounded-xl bg-brand/10 text-brand text-xl group-hover:scale-105 transition-transform">
            ➕
          </span>
        </button>
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm space-y-4 animate-float-none">
          <div className="flex justify-between items-center pb-2 border-b border-border/40">
            <h3 className="text-sm font-bold text-foreground">Create New Poll</h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-xs text-muted hover:text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-muted mb-1">
                Poll Question
              </label>
              <input
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                placeholder="E.g., Which Next.js feature is your favorite?"
                disabled={creatingLoading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-hidden placeholder:text-muted focus:border-brand text-foreground"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-muted mb-1">
                Options (2 to 5)
              </label>
              {newOptions.map((opt, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    value={opt}
                    onChange={(e) => handleOptionChange(index, e.target.value)}
                    placeholder={`Option ${index + 1}`}
                    disabled={creatingLoading}
                    className="flex-1 rounded-xl border border-border bg-background px-4 py-2 text-xs outline-hidden placeholder:text-muted focus:border-brand text-foreground"
                  />
                  {newOptions.length > 2 && (
                    <button
                      onClick={() => handleRemoveOption(index)}
                      title="Remove option"
                      className="px-2.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg text-sm cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}

              {newOptions.length < 5 && (
                <button
                  onClick={handleAddOption}
                  disabled={creatingLoading}
                  className="text-2xs font-bold text-brand hover:underline pt-1 cursor-pointer"
                >
                  + Add option
                </button>
              )}
            </div>

            <div>
              <label className="block text-2xs font-extrabold uppercase tracking-wider text-muted mb-1">
                Your Name (optional)
              </label>
              <input
                value={newAuthor}
                onChange={(e) => setNewAuthor(e.target.value)}
                placeholder="E.g., Marcus (defaults to Anonymous)"
                disabled={creatingLoading}
                className="w-full rounded-xl border border-border bg-background px-4 py-2 text-xs outline-hidden placeholder:text-muted focus:border-brand text-foreground"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={createPoll}
              disabled={creatingLoading || !newQuestion.trim()}
              className="flex-1 rounded-xl bg-brand py-2.5 text-xs font-bold text-white shadow-xs hover:bg-brand-strong transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
            >
              {creatingLoading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : (
                "Create Poll"
              )}
            </button>
            <button
              onClick={() => setIsCreating(false)}
              disabled={creatingLoading}
              className="rounded-xl border border-border px-4 py-2.5 text-xs font-semibold hover:bg-accent hover:text-accent-foreground text-foreground cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Active Polls List */}
      <div className="space-y-4">
        {polls.map((p) => {
          const votedOptionId = userVotes[p.id];
          const hasVoted = !!votedOptionId;
          const isViewingResults = hasVoted || !!showResultsOverride[p.id];
          const totalVotes = p.options.reduce((sum, opt) => sum + opt.votes, 0);
          
          const selectedOptionId = selectedOptions[p.id];
          const isVoteButtonDisabled = !selectedOptionId || votingLoading[p.id];

          return (
            <div
              key={p.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-xs transition-all duration-200 hover:shadow-md"
            >
              {/* Poll Header */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h3 className="font-bold text-foreground text-base leading-snug">
                    {p.question}
                  </h3>
                  {p.author && (
                    <span className="text-3xs text-muted block mt-1">
                      created by <span className="font-semibold">{p.author}</span>
                    </span>
                  )}
                </div>
                {hasVoted && (
                  <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 text-3xs font-extrabold uppercase">
                    Voted ✓
                  </span>
                )}
              </div>

              {/* Poll Options / Results */}
              <div className="space-y-2.5">
                {p.options.map((opt) => {
                  const percentage = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                  const isUserSelection = votedOptionId === opt.id;

                  if (isViewingResults) {
                    // Results Mode (Visible progress bar)
                    return (
                      <div key={opt.id} className="relative group">
                        <div className="absolute inset-0 rounded-xl bg-secondary/50" />
                        <div
                          style={{ width: `${percentage}%` }}
                          className={`absolute inset-y-0 left-0 rounded-xl transition-all duration-500 ${
                            isUserSelection
                              ? "bg-brand/20 border-l-2 border-brand"
                              : "bg-muted/10"
                          }`}
                        />

                        {/* Text Content */}
                        <div className="relative flex items-center justify-between px-4 py-3 text-xs font-semibold text-foreground/90">
                          <span className="flex items-center gap-1.5 min-w-0 pr-2">
                            {isUserSelection && <span className="text-brand text-xs font-extrabold">✓</span>}
                            <span className="truncate">{opt.option_text}</span>
                          </span>
                          <span className="shrink-0 tabular-nums">
                            {percentage}% <span className="text-muted font-normal text-3xs ml-1">({opt.votes})</span>
                          </span>
                        </div>
                      </div>
                    );
                  } else {
                    // Interactive Voting Mode with Radio buttons
                    const isSelected = selectedOptionId === opt.id;
                    return (
                      <label
                        key={opt.id}
                        onClick={() => setSelectedOptions((prev) => ({ ...prev, [p.id]: opt.id }))}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-xs font-semibold cursor-pointer transition-all hover:bg-accent select-none ${
                          isSelected
                            ? "border-brand bg-brand-soft/30 text-brand"
                            : "border-border bg-background text-foreground"
                        }`}
                      >
                        <span className={`h-4.5 w-4.5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                          isSelected ? "border-brand text-brand" : "border-border"
                        }`}>
                          {isSelected && <span className="h-2 w-2 rounded-full bg-brand" />}
                        </span>
                        <span>{opt.option_text}</span>
                      </label>
                    );
                  }
                })}
              </div>

              {/* Vote controls (only visible if user hasn't voted yet) */}
              {!hasVoted && (
                <div className="mt-4 pt-3 border-t border-border/40 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex gap-2">
                    {!isViewingResults ? (
                      <>
                        <button
                          onClick={() => handleVoteSubmit(p.id)}
                          disabled={isVoteButtonDisabled}
                          className="rounded-xl bg-brand hover:bg-brand-strong px-5 py-2 text-xs font-bold text-white shadow-xs transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center gap-1.5"
                        >
                          {votingLoading[p.id] ? (
                            <>
                              <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Voting...
                            </>
                          ) : (
                            "Vote"
                          )}
                        </button>
                        <button
                          onClick={() => toggleResultsOverride(p.id)}
                          className="rounded-xl border border-border hover:bg-accent hover:text-accent-foreground px-4 py-2 text-xs font-semibold text-foreground cursor-pointer"
                        >
                          View Results
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => toggleResultsOverride(p.id)}
                        className="rounded-xl border border-border hover:bg-accent hover:text-accent-foreground px-4 py-2 text-xs font-semibold text-foreground cursor-pointer"
                      >
                        Back to Vote
                      </button>
                    )}
                  </div>

                  <span className="text-3xs text-muted">
                    Total votes: {totalVotes}
                  </span>
                </div>
              )}

              {/* Vote count for already-voted users */}
              {hasVoted && (
                <div className="mt-4 pt-3 border-t border-border/40 flex items-center justify-between text-3xs text-muted">
                  <span>Total votes: {totalVotes}</span>
                  <span>Live updating...</span>
                </div>
              )}
            </div>
          );
        })}

        {polls.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center max-w-sm mx-auto space-y-3">
            <div className="text-4xl">📊</div>
            <h3 className="text-sm font-bold text-foreground">No polls launched yet</h3>
            <p className="text-xs text-muted">
              Be the first to gather feedback! Click above to create a multiple-choice poll.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
