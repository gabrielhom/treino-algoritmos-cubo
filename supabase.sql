-- Treino de algoritmos: tabela de tentativas (append-only) com RLS por usuário.
-- Rode no SQL Editor do projeto Supabase.

create table if not exists public.attempts (
  id             uuid primary key,
  user_id        uuid not null default auth.uid() references auth.users (id) on delete cascade,
  set_id         text not null,
  case_id        text not null,
  mirrored       boolean not null default false,
  auf            text,
  recognition_ms integer not null check (recognition_ms >= 0),
  rating         text not null check (rating in ('easy', 'ok', 'hard')),
  created_at     timestamptz not null,
  -- carimbo do servidor: cursor de sincronização (created_at é do aparelho e pode chegar atrasado)
  synced_at      timestamptz not null default now()
);

create index if not exists attempts_user_synced_idx on public.attempts (user_id, synced_at);

alter table public.attempts enable row level security;

create policy "attempts: ler as próprias" on public.attempts
  for select using (auth.uid() = user_id);

create policy "attempts: inserir as próprias" on public.attempts
  for insert with check (auth.uid() = user_id);

-- Sem update nem delete: tentativas são append-only. case_state é derivado no cliente.
