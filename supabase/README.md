# Supabase

Ce dossier contient le socle backend Cardhéon pour Supabase.

Stack actuelle :

```txt
Supabase Auth
Postgres
Row Level Security
Edge Functions
```

Storage reste prévu pour les assets publiés, mais il n'est pas encore utilisé.

## Etat du projet distant

Projet Supabase lié :

```txt
fjbinzflrmlrtgyszgcu
```

Etat au 2026-06-24 :

```txt
Migration appliquee via MCP : 20260624122110_catalog_and_progress
Tables public creees : 12
RLS activee sur toutes les tables public creees par la migration
catalog-manifest deployee, publique
sync-progress deployee, JWT requis
```

Le `db push` local n'a pas pu etre utilise depuis cette machine parce que la connexion TCP au pooler Supabase sur le port `5432` expirait :

```txt
aws-1-eu-central-1.pooler.supabase.com:5432: i/o timeout
```

Les logs Supabase et le MCP confirmaient que le projet et Postgres etaient sains. Le probleme etait donc le chemin reseau local vers le pooler Postgres, pas l'etat du projet ni le mot de passe DB. La migration a ete appliquee directement via le MCP Supabase.

## Fonctions

```txt
catalog-manifest       retourne la version de catalogue publiée
sync-progress          synchronise une progression locale par mutations idempotentes
attempt-discovery      prévu pour la validation serveur gameplay
open-pack              prévu pour l’ouverture serveur de packs
publish-content-version prévu pour la publication de contenu
```

Fonctions deployees actuellement :

```txt
catalog-manifest
sync-progress
```

Les migrations SQL sont placees dans `supabase/migrations/`.

Le mobile reste local-first : sans URL Supabase, sans token ou hors ligne, il continue a jouer et garde les mutations dans SQLite.

## Verification

Via MCP Supabase, verifier :

```txt
list_migrations
list_tables schemas=["public"]
list_edge_functions
get_advisors security
get_advisors performance
```

Advisors connus apres la migration :

```txt
security: public.rls_auto_enable() est une fonction SECURITY DEFINER executable par anon/authenticated
performance: les policies user-owned doivent passer de auth.uid() a (select auth.uid()) pour eviter une reevaluation par ligne
performance: unused_index attendu tant que la base est vide
```
