-- 100 Pompes — schéma de synchronisation cloud (optionnel)
--
-- À exécuter une seule fois dans l'éditeur SQL de ton projet Supabase
-- (Dashboard -> SQL Editor -> New query -> coller -> Run).
--
-- Une seule ligne par utilisateur : on réutilise tel quel le blob AppData
-- déjà versionné/migré côté client (schemaVersion), aucun schéma à dupliquer
-- côté serveur. RLS strict : chaque utilisateur ne voit et ne modifie que
-- sa propre ligne — indispensable puisque la clé "anon" est publique.

create table if not exists public.app_data (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  data       jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.app_data enable row level security;

create policy "app_data_select_own"
  on public.app_data for select
  using (auth.uid() = user_id);

create policy "app_data_insert_own"
  on public.app_data for insert
  with check (auth.uid() = user_id);

create policy "app_data_update_own"
  on public.app_data for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "app_data_delete_own"
  on public.app_data for delete
  using (auth.uid() = user_id);
