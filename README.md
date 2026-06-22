# Cardhéon

**Cardhéon** est un jeu mobile éducatif de collection de cartes historiques.

Le joueur découvre des figures historiques en combinant des cartes-outils : époques, lieux, domaines, rôles, concepts, événements, œuvres, civilisations et personnages déjà découverts.

Le projet vise une première version mobile construite avec **Expo + React Native + TypeScript**, puis une architecture scalable avec un contenu versionné, un moteur de découverte data-driven, une progression locale-first et un backend Supabase.

---

## Lecture rapide

Les documents importants sont dans [`docs/`](docs/README.md).

- [`docs/00-project-context.md`](docs/00-project-context.md) — contexte, vision et objectifs du jeu.
- [`docs/01-product-design.md`](docs/01-product-design.md) — boucle de jeu, progression, packs, constellations et UI.
- [`docs/02-technical-architecture.md`](docs/02-technical-architecture.md) — architecture monorepo, Expo, TypeScript, Supabase et offline-first.
- [`docs/03-content-system.md`](docs/03-content-system.md) — système de données, cartes, personnages, liens, sources et workflow éditorial.
- [`docs/04-discovery-engine.md`](docs/04-discovery-engine.md) — moteur de découverte par scoring pondéré.
- [`docs/05-roadmap.md`](docs/05-roadmap.md) — phases de développement MVP → V1.
- [`docs/06-decisions.md`](docs/06-decisions.md) — décisions structurantes prises pendant la conception.

---

## Objectifs V1

La première vraie version doit viser :

- **100 personnages historiques** ;
- **250 à 400 cartes-outils** ;
- **800 à 1 500 relations historiques** ;
- **30 à 50 constellations** ;
- une progression locale-first ;
- un premier backend Supabase ;
- un système de contenu validé automatiquement ;
- une interface mobile claire et agréable.

---

## Stack cible

- **Mobile** : Expo, React Native, TypeScript, Expo Router.
- **Local data** : SQLite local.
- **Validation** : Zod.
- **Backend** : Supabase Auth, Postgres, RLS, Storage, Edge Functions.
- **Workspace** : pnpm monorepo.
- **Contenu** : fichiers YAML ou JSON versionnés, validés et compilés.

---

## Architecture du repository

```txt
cardheon/
  apps/
    mobile/
    admin/
  packages/
    game-engine/
    content-schema/
    db/
    ui/
    assets-pipeline/
  content/
    figures/
    tools/
    constellations/
    packs/
    sources/
    assets-manifest/
  scripts/
  supabase/
    migrations/
    functions/
  docs/
```

---

## Commandes prévues

Ces commandes sont posées dès maintenant comme contrat de projet. Elles seront implémentées progressivement.

```bash
pnpm install
pnpm dev
pnpm mobile
pnpm validate:content
pnpm simulate:discoveries
pnpm build:catalog
pnpm lint
pnpm typecheck
pnpm test
```

---

## Statut

Cardhéon est en phase de conception / préproduction.

Priorité actuelle :

1. créer le monorepo ;
2. définir les schémas de contenu ;
3. construire le moteur de découverte ;
4. créer 10 personnages test ;
5. valider le gameplay local ;
6. étendre vers 100 personnages.
