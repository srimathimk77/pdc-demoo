-- ── Migration for Q&A Categorization & Polling System ──────────────────────
-- Run this in your Supabase SQL Editor to apply changes to an existing database.

-- 1. Add category column to questions table (initially nullable to avoid errors)
alter table questions add column category text check (category in ('What', 'Why', 'When', 'Where', 'Who', 'Which', 'Whose', 'How'));

-- 2. Update existing questions with categorized values (regex classification / seed values)
update questions set category = 'How' where body ilike 'how%';
update questions set category = 'What' where body ilike 'what%';
update questions set category = 'When' where body ilike 'when%';
update questions set category = 'Why' where body ilike 'why%';
update questions set category = 'Which' where body ilike '%which%';
update questions set category = 'Where' where body ilike 'where%';
update questions set category = 'Who' where body ilike 'who%';
update questions set category = 'Whose' where body ilike 'whose%';

-- Fallback for any seed question not caught by direct ilike (e.g. "Offset vs cursor...")
update questions set category = 'Which' where id in (select id from questions where category is null and body ilike '%or%');
update questions set category = 'What' where category is null;

-- Make category NOT NULL once all rows are populated
alter table questions alter column category set not null;

-- 3. Create Polls Table
create table polls (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  author      text,
  created_at  timestamptz default now()
);

-- 4. Create Poll Options Table
create table poll_options (
  id           uuid primary key default gen_random_uuid(),
  poll_id      uuid not null references polls(id) on delete cascade,
  option_text  text not null
);

create index poll_options_poll_id_idx on poll_options (poll_id);

-- 5. Create Poll Votes Table
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
