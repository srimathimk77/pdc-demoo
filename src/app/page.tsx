"use client";
import Link from "next/link";
import ThemeToggle from "./theme-toggle";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex flex-col">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-brand/10 rounded-full blur-3xl -z-10 animate-float" />
      <div className="absolute bottom-1/4 right-[10%] w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -z-10 animate-float [animation-delay:2s]" />

      <header className="sticky top-0 z-50 glass-nav shadow-xs">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/" className="flex items-center gap-2 text-brand font-bold text-xl group transition-all duration-200">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-white shadow-md shadow-brand/20 group-hover:scale-105 transition-transform duration-200">
                  💬
                </span>
                InteractLive
              </Link>
            </div>
            
            <nav className="flex items-center gap-6">
              <Link href="/qa" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
                <span>💬</span> Q&A
              </Link>
              <Link href="/polls" className="flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
                <span>📊</span> Polls
              </Link>
              <div className="h-4 w-px bg-border" />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="max-w-3xl space-y-8">
          <div className="inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-4 py-1.5 text-xs font-semibold text-brand ring-1 ring-brand/10 animate-pulse-slow">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Next-Gen Audience Engagement
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Engage Your Audience in{" "}
            <span className="bg-gradient-to-r from-brand via-indigo-600 to-indigo-400 bg-clip-text text-transparent animate-gradient-x">
              Real-Time
            </span>
          </h1>

          <p className="mx-auto max-w-xl text-lg sm:text-xl text-muted leading-relaxed">
            The ultimate Live Q&A and Polling platform for presentations, meetups, and conferences. Ask questions, host interactive polls, and see results live.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              href="/qa"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-8 py-4 text-base font-bold text-white shadow-lg shadow-brand/25 transition-all duration-200 hover:bg-brand-strong hover:shadow-brand/35 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
            >
              Questions
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2.5"
                stroke="currentColor"
                className="w-5 h-5 animate-pulse-slow"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>

            <Link
              href="/polls"
              className="w-full sm:w-auto inline-flex items-center justify-center rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold text-foreground shadow-xs transition-all duration-200 hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 active:translate-y-0 active:scale-98 cursor-pointer"
            >
              Explore Polls
            </Link>
          </div>
        </div>

        <div className="mt-20 max-w-5xl mx-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <div className="glass rounded-2xl p-6 text-left shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand/30">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 text-2xl mb-5 shadow-xs">
              💬
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Live Q&A</h3>
            <p className="text-sm text-muted leading-relaxed">
              Ask questions anonymously or with your name. Upvote topics to bubble the most important ones to the top.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 text-left shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand/30">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-2xl mb-5 shadow-xs">
              📊
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Interactive Polls</h3>
            <p className="text-sm text-muted leading-relaxed">
              Create multi-option polls instantly. Watch vote counts and percentages update live in real-time as users vote.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 text-left shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand/30">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 text-2xl mb-5 shadow-xs">
              ✨
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">AI Prep Assistance</h3>
            <p className="text-sm text-muted leading-relaxed">
              Refine your queries using Gemini AI. Enhance grammar, spelling, and professionalism at the touch of a button.
            </p>
          </div>

          <div className="glass rounded-2xl p-6 text-left shadow-xs transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-brand/30">
            <div className="flex items-center justify-center h-12 w-12 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 text-2xl mb-5 shadow-xs">
              🏷️
            </div>
            <h3 className="text-lg font-bold text-foreground mb-2">Smart Categorization</h3>
            <p className="text-sm text-muted leading-relaxed">
              Questions are automatically categorized into What, Why, How, etc., making filtration and moderation straightforward.
            </p>
          </div>
        </div>
      </main>

      <footer className="py-8 text-center text-xs text-muted border-t border-border/40 mt-auto">
        <p>&copy; {new Date().getFullYear()} InteractLive. Built with Next.js, Supabase, and Tailwind CSS.</p>
      </footer>
    </div>
  );
}