-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ─── subjects ────────────────────────────────────────────────────────────────
create table subjects (
  id         uuid primary key default uuid_generate_v4(),
  user_id    uuid references auth.users(id) on delete cascade not null,
  name       text not null,
  color      text default '#ef4444',
  created_at timestamptz default now()
);
alter table subjects enable row level security;
create policy "Users manage own subjects" on subjects
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── questions ───────────────────────────────────────────────────────────────
create table questions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  subject_id        uuid references subjects(id) on delete set null,
  type              text not null default 'solution',   -- choice|fill|solution|essay
  content           text not null,
  my_answer         text,
  correct_answer    text,
  analysis          text,
  image_url         text,
  mastery           int default 0,                      -- 0=未掌握 1=学习中 2=基本掌握 3=完全掌握
  wrong_count       int default 1,
  last_practiced_at timestamptz,
  ai_analysis       text,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);
alter table questions enable row level security;
create policy "Users manage own questions" on questions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;
create trigger questions_updated_at before update on questions
  for each row execute function update_updated_at();

-- ─── tags ────────────────────────────────────────────────────────────────────
create table tags (
  id      uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name    text not null,
  unique (user_id, name)
);
alter table tags enable row level security;
create policy "Users manage own tags" on tags
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── question_tags ────────────────────────────────────────────────────────────
create table question_tags (
  question_id uuid references questions(id) on delete cascade,
  tag_id      uuid references tags(id) on delete cascade,
  primary key (question_id, tag_id)
);
alter table question_tags enable row level security;
create policy "Users manage own question_tags" on question_tags
  using (
    exists (select 1 from questions q where q.id = question_id and q.user_id = auth.uid())
  )
  with check (
    exists (select 1 from questions q where q.id = question_id and q.user_id = auth.uid())
  );

-- ─── practice_records ────────────────────────────────────────────────────────
create table practice_records (
  id           uuid primary key default uuid_generate_v4(),
  user_id      uuid references auth.users(id) on delete cascade not null,
  question_id  uuid references questions(id) on delete cascade,
  result       text,          -- correct|wrong|skip
  practiced_at timestamptz default now()
);
alter table practice_records enable row level security;
create policy "Users manage own records" on practice_records
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── generated_questions ─────────────────────────────────────────────────────
create table generated_questions (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  weak_point     text,
  subject_id     uuid references subjects(id) on delete set null,
  type           text default 'solution',
  content        text not null,
  correct_answer text,
  analysis       text,
  is_saved       bool default false,
  created_at     timestamptz default now()
);
alter table generated_questions enable row level security;
create policy "Users manage own generated_questions" on generated_questions
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ─── Storage bucket for question images ──────────────────────────────────────
insert into storage.buckets (id, name, public) values ('question-images', 'question-images', true)
  on conflict do nothing;
create policy "Authenticated upload" on storage.objects
  for insert to authenticated with check (bucket_id = 'question-images');
create policy "Public read" on storage.objects
  for select using (bucket_id = 'question-images');
create policy "Owner delete" on storage.objects
  for delete to authenticated using (bucket_id = 'question-images' and auth.uid()::text = (storage.foldername(name))[1]);
