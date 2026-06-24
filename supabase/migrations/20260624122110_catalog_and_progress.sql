create extension if not exists "pgcrypto";

create table if not exists public.catalog_versions (
  id text primary key,
  status text not null check (status in ('draft', 'published', 'deprecated')),
  minimum_app_version text not null default '0.0.0',
  catalog_checksum text not null,
  asset_base_url text,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists public.catalog_cards (
  catalog_version_id text not null references public.catalog_versions(id) on delete cascade,
  id text not null,
  slug text not null,
  kind text not null,
  status text not null,
  rarity text,
  localization jsonb not null,
  tags jsonb not null default '[]'::jsonb,
  discovery jsonb,
  unlocks_tool_card_ids text[] not null default '{}',
  source_ids text[] not null default '{}',
  constellation_ids text[] not null default '{}',
  primary key (catalog_version_id, id),
  unique (catalog_version_id, slug)
);

create table if not exists public.catalog_relationships (
  catalog_version_id text not null references public.catalog_versions(id) on delete cascade,
  source_card_id text not null,
  predicate text not null,
  target_card_id text not null,
  weight integer,
  source_ids text[] not null default '{}',
  primary key (catalog_version_id, source_card_id, predicate, target_card_id)
);

create table if not exists public.catalog_constellations (
  catalog_version_id text not null references public.catalog_versions(id) on delete cascade,
  id text not null,
  slug text not null,
  localization jsonb not null,
  card_ids text[] not null,
  reward jsonb,
  primary key (catalog_version_id, id)
);

create table if not exists public.catalog_packs (
  catalog_version_id text not null references public.catalog_versions(id) on delete cascade,
  id text not null,
  slug text not null,
  localization jsonb not null,
  starter_card_ids text[] not null default '{}',
  card_pool_ids text[] not null default '{}',
  primary key (catalog_version_id, id)
);

create table if not exists public.catalog_sources (
  catalog_version_id text not null references public.catalog_versions(id) on delete cascade,
  id text not null,
  title text not null,
  type text not null,
  url text,
  primary key (catalog_version_id, id)
);

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  xp integer not null default 0,
  attempts integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.player_cards (
  user_id uuid not null references auth.users(id) on delete cascade,
  card_id text not null,
  state text not null,
  usable_in_atelier boolean not null default false,
  unlocked_at timestamptz,
  discovered_at timestamptz,
  mastered_at timestamptz,
  source_reason text,
  updated_at timestamptz not null default now(),
  primary key (user_id, card_id)
);

create table if not exists public.player_attempts (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_attempt_id text not null,
  input_card_ids text[] not null,
  result_type text not null,
  result_card_id text,
  score integer,
  created_at timestamptz not null,
  primary key (user_id, client_attempt_id)
);

create table if not exists public.player_rewards (
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id text not null,
  reward_type text not null,
  reward_value text not null,
  claimed_at timestamptz not null default now(),
  primary key (user_id, reward_id)
);

create table if not exists public.player_constellations (
  user_id uuid not null references auth.users(id) on delete cascade,
  constellation_id text not null,
  state text not null,
  progress integer not null default 0,
  total integer not null default 0,
  reward_claimed_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (user_id, constellation_id)
);

create table if not exists public.sync_events (
  user_id uuid not null references auth.users(id) on delete cascade,
  client_mutation_id text not null,
  mutation_type text not null,
  payload jsonb not null,
  accepted_at timestamptz not null default now(),
  primary key (user_id, client_mutation_id)
);

alter table public.catalog_versions enable row level security;
alter table public.catalog_cards enable row level security;
alter table public.catalog_relationships enable row level security;
alter table public.catalog_constellations enable row level security;
alter table public.catalog_packs enable row level security;
alter table public.catalog_sources enable row level security;
alter table public.profiles enable row level security;
alter table public.player_cards enable row level security;
alter table public.player_attempts enable row level security;
alter table public.player_rewards enable row level security;
alter table public.player_constellations enable row level security;
alter table public.sync_events enable row level security;

create policy "published catalog versions are readable"
  on public.catalog_versions for select
  using (status = 'published');

create policy "published catalog cards are readable"
  on public.catalog_cards for select
  using (exists (
    select 1 from public.catalog_versions version
    where version.id = catalog_version_id and version.status = 'published'
  ));

create policy "published catalog relationships are readable"
  on public.catalog_relationships for select
  using (exists (
    select 1 from public.catalog_versions version
    where version.id = catalog_version_id and version.status = 'published'
  ));

create policy "published catalog constellations are readable"
  on public.catalog_constellations for select
  using (exists (
    select 1 from public.catalog_versions version
    where version.id = catalog_version_id and version.status = 'published'
  ));

create policy "published catalog packs are readable"
  on public.catalog_packs for select
  using (exists (
    select 1 from public.catalog_versions version
    where version.id = catalog_version_id and version.status = 'published'
  ));

create policy "published catalog sources are readable"
  on public.catalog_sources for select
  using (exists (
    select 1 from public.catalog_versions version
    where version.id = catalog_version_id and version.status = 'published'
  ));

create policy "profiles are user-owned"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "player cards are user-owned"
  on public.player_cards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "player attempts are user-owned"
  on public.player_attempts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "player rewards are user-owned"
  on public.player_rewards for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "player constellations are user-owned"
  on public.player_constellations for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "sync events are user-owned"
  on public.sync_events for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index if not exists idx_catalog_cards_kind on public.catalog_cards (catalog_version_id, kind);
create index if not exists idx_player_cards_user_updated on public.player_cards (user_id, updated_at);
create index if not exists idx_sync_events_user_accepted on public.sync_events (user_id, accepted_at);
