import QuestionsList from "../questions-list";
import { getQuestionsPage } from "@/lib/questions";
import ThemeToggle from "../theme-toggle";
import Link from "next/link";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 10;

export default async function Page() {
  const { questions, hasMore } = await getQuestionsPage(0, PAGE_SIZE);

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
              <Link href="/polls" className="flex items-center gap-1.5 text-sm font-medium text-muted hover:text-foreground transition-colors duration-200">
                <span>📊</span>
                Polls
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
              Q&A Hub
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl bg-gradient-to-r from-foreground via-foreground/90 to-brand bg-clip-text text-transparent">
              Live Q&amp;A
            </h1>
            <p className="mt-2 text-sm text-muted">
              Ask questions anonymously or upvote the topics you want answered live.
            </p>
          </div>
        </header>

        <QuestionsList initialQuestions={questions} initialHasMore={hasMore} />
      </main>
    </div>
  );
}
