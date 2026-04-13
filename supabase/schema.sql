-- ─────────────────────────────────────────────────────────────────────────────
-- Bindery Pro — Supabase Schema
-- Run this in your Supabase project's SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- books -----------------------------------------------------------------------

create table if not exists books (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  title      text not null,
  author     text,
  style      text default 'classic',
  cover      jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table books enable row level security;

create policy "Users can view their own books"
  on books for select
  using (auth.uid() = user_id);

create policy "Users can insert their own books"
  on books for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own books"
  on books for update
  using (auth.uid() = user_id);

create policy "Users can delete their own books"
  on books for delete
  using (auth.uid() = user_id);

-- chapters --------------------------------------------------------------------

create table if not exists chapters (
  id         uuid primary key default gen_random_uuid(),
  book_id    uuid references books on delete cascade,
  title      text,
  content    text,
  position   integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table chapters enable row level security;

create policy "Users can view chapters of their books"
  on chapters for select
  using (
    exists (
      select 1 from books
      where books.id = chapters.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can insert chapters into their books"
  on chapters for insert
  with check (
    exists (
      select 1 from books
      where books.id = chapters.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can update chapters of their books"
  on chapters for update
  using (
    exists (
      select 1 from books
      where books.id = chapters.book_id
        and books.user_id = auth.uid()
    )
  );

create policy "Users can delete chapters of their books"
  on chapters for delete
  using (
    exists (
      select 1 from books
      where books.id = chapters.book_id
        and books.user_id = auth.uid()
    )
  );

-- infographics ----------------------------------------------------------------

create table if not exists infographics (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid references auth.users not null,
  book_id    uuid references books on delete cascade,
  title      text,
  data       jsonb,
  created_at timestamptz default now()
);

alter table infographics enable row level security;

create policy "Users can view their own infographics"
  on infographics for select
  using (auth.uid() = user_id);

create policy "Users can insert their own infographics"
  on infographics for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own infographics"
  on infographics for update
  using (auth.uid() = user_id);

create policy "Users can delete their own infographics"
  on infographics for delete
  using (auth.uid() = user_id);
