-- Day 5 schema — run this once in the Supabase SQL Editor.
-- It resets to a clean slate (drops the previous experiment), creates the
-- tables in the shape the guide uses (votes as ROWS, not a column), adds the
-- indexes, and seeds 25 questions so pagination and search have volume.

-- ── reset ──────────────────────────────────────────────────────────────────
drop table if exists votes;
drop table if exists poll_votes cascade;
drop table if exists poll_options cascade;
drop table if exists polls cascade;
drop table if exists questions cascade;
drop function if exists increment_question_votes(uuid);

-- ── questions (Feature 1) ────────────────────────────────────────────────────
create table questions (
  id          uuid primary key default gen_random_uuid(),
  body        text not null,
  author      text,
  category    text not null check (category in ('What', 'Why', 'When', 'Where', 'Who', 'Which', 'Whose', 'How')),
  created_at  timestamptz default now()
);

-- ── votes (Feature 3) ────────────────────────────────────────────────────────
-- one row per vote; the FK guarantees a vote points at a real question, and
-- the unique constraint enforces one vote per voter per question.
create table votes (
  id           uuid primary key default gen_random_uuid(),
  question_id  uuid not null references questions(id) on delete cascade,
  voter_id     text not null,
  created_at   timestamptz default now(),
  unique (question_id, voter_id)
);

create index votes_question_id_idx on votes (question_id);

-- ── full-text search index (Feature 5) ───────────────────────────────────────
-- GIN = Generalized INverted index: the word → documents map behind search.
create index questions_fts_idx on questions using gin (to_tsvector('english', body));

-- ── seed (~25 questions, spaced out in time so ordering is stable) ───────────
insert into questions (body, author, category, created_at)
select body, author, category, now() - (n || ' minutes')::interval
from (
  values
    (1,  'How do I deploy to Vercel?', 'Priya', 'How'),
    (2,  'What''s the difference between server and client components?', 'Marcus', 'What'),
    (3,  'When should I add a database index?', 'Aisha', 'When'),
    (4,  'How does Postgres full-text search work?', 'Diego', 'How'),
    (5,  'Why did my in-memory data vanish on restart?', 'Lena', 'Why'),
    (6,  'Should I store a vote count or count vote rows?', 'Sam', 'Which'),
    (7,  'What is a unique constraint good for?', 'Priya', 'What'),
    (8,  'How do I prevent double voting?', 'Noah', 'How'),
    (9,  'What''s the difference between SSR and hydration?', 'Aisha', 'What'),
    (10, 'How does optimistic UI actually work?', 'Marcus', 'How'),
    (11, 'When do I really need pagination?', 'Ravi', 'When'),
    (12, 'Offset vs cursor pagination — which one?', 'Lena', 'Which'),
    (13, 'How do I debounce a search input?', 'Diego', 'How'),
    (14, 'Why must secrets stay on the server?', 'Sam', 'Why'),
    (15, 'What is row-level security in Supabase?', 'Noah', 'What'),
    (16, 'How does connection pooling help on Vercel?', 'Priya', 'How'),
    (17, 'What is a GIN index and when do I use it?', 'Ravi', 'What'),
    (18, 'How do foreign keys protect my data?', 'Aisha', 'How'),
    (19, 'When should I move counts into Redis?', 'Marcus', 'When'),
    (20, 'How do I run a database migration safely?', 'Lena', 'How'),
    (21, 'What does on delete cascade actually do?', 'Diego', 'What'),
    (22, 'How do I seed test data quickly?', 'Sam', 'How'),
    (23, 'Why is my Vercel function cold starting?', 'Noah', 'Why'),
    (24, 'How do I scale reads with replicas?', 'Ravi', 'How'),
    (25, 'What''s the best way to add auth later?', 'Priya', 'What')
) as seed(n, body, author, category);

-- ── polls (Feature 6) ────────────────────────────────────────────────────────
create table polls (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  author      text,
  created_at  timestamptz default now()
);

-- ── poll_options ─────────────────────────────────────────────────────────────
create table poll_options (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references polls(id) on delete cascade,
  option_text  text not null
);

create index poll_options_poll_id_idx on poll_options (poll_id);

-- ── poll_votes ───────────────────────────────────────────────────────────────
create table poll_votes (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references polls(id) on delete cascade,
  option_id    uuid not null references poll_options(id) on delete cascade,
  voter_id     text not null,
  created_at   timestamptz default now(),
  unique (poll_id, voter_id)
);

create index poll_votes_poll_id_idx on poll_votes (poll_id);
create index poll_votes_option_id_idx on poll_votes (option_id);
