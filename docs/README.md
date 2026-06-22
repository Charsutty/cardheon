# Documentation Cardhéon

Ce dossier documente les décisions prises pour Cardhéon afin qu’un développeur, un designer, un rédacteur historique ou une IA de programmation puisse comprendre le projet sans reprendre toute la conversation initiale.

## Documents

1. [`00-project-context.md`](00-project-context.md) — contexte, vision et objectifs.
2. [`01-product-design.md`](01-product-design.md) — gameplay, progression, UI et expérience joueur.
3. [`02-technical-architecture.md`](02-technical-architecture.md) — stack, monorepo, mobile, backend et offline-first.
4. [`03-content-system.md`](03-content-system.md) — modèle de contenu, cartes, personnages, relations, sources.
5. [`04-discovery-engine.md`](04-discovery-engine.md) — moteur de découverte par scoring pondéré.
6. [`05-roadmap.md`](05-roadmap.md) — roadmap MVP, backend, V1 et live ops.
7. [`06-decisions.md`](06-decisions.md) — décisions structurantes et raisons.

## Principe général

Cardhéon est construit comme un **graphe historique jouable** :

- les cartes sont des nœuds ;
- les relations historiques sont des arêtes ;
- la découverte d’un personnage est une résolution par indices pondérés ;
- le contenu est versionné et validé comme du code.
