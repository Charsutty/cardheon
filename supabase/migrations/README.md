# Migrations

Les migrations SQL Supabase sont ajoutees ici.

## Migration appliquee

```txt
20260624122110_catalog_and_progress.sql
```

Cette migration a ete appliquee au projet distant `fjbinzflrmlrtgyszgcu` via le MCP Supabase le 2026-06-24, car `supabase db push` expirait depuis la machine locale sur le port Postgres `5432`.

Elle cree :

```txt
catalog_versions
catalog_cards
catalog_relationships
catalog_constellations
catalog_packs
catalog_sources
profiles
player_cards
player_attempts
player_rewards
player_constellations
sync_events
```

RLS est activee sur toutes ces tables.

## Attention version

Le fichier local porte le meme prefixe que la migration distante :

```txt
20260624122110
```

Garder ce prefixe synchronise avec `supabase_migrations.schema_migrations` evite qu'un futur `supabase db push` tente de rejouer la meme migration.
