import { supabase } from "@/lib/supabase";
import PollsList from "./polls-list";
import ThemeToggle from "../theme-toggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PollsPage() {
  const { data, error } = await supabase
    .from("polls")
    .select(`
      id,
      question,
      author,
      created_at,
      poll_options (
        id,
        option_text,
        poll_votes (count)
      )
    `)
    .order("created_at", { ascending: false });

  const initialPolls = (data ?? []).map((p) => {
    const options = (p.poll_options ?? []).map((o: any) => ({
      id: o.id,
      option_text: o.option_text,
      votes: o.poll_votes?.[0]?.count ?? 0,
    }));

    return {
      id: p.id,
      question: p.question,
      author: p.author,
      created_at: p.created_at,
      options,
    };
  });

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 glass-nav shadow-xs">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
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
              <Link href="/" className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
                Home
              </Link>
              <Link href="/qa" className="text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
                Q&A
              </Link>
              <div className="h-4 w-px bg-border" />
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <header className="mb-8">
          <div>
            <span className="mb-2.5 inline-flex items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1 text-xs font-semibold text-brand ring-1 ring-brand/10">
              <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
              Real-time Polls
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground via-foreground/90 to-brand bg-clip-text text-transparent">
              Audience Polls
            </h1>
            <p className="mt-2 text-sm text-muted">
              Create instant polls, vote, and watch live results update in real-time.
            </p>
          </div>
        </header>

        <PollsList initialPolls={initialPolls} />
      </main>
    </div>
  );
}
