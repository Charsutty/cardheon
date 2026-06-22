# Documentation Cardhéon

Ce dossier permet à un développeur, designer, rédacteur historique ou agent de programmation de comprendre Cardhéon sans reprendre les conversations ayant précédé le projet.

## Ordre de lecture

1. [`00-product-reference.md`](00-product-reference.md) — **référence canonique** du concept, des objectifs et des invariants.
2. [`00-project-context.md`](00-project-context.md) — origine, positionnement et ambition.
3. [`01-product-design.md`](01-product-design.md) — boucle de jeu, écrans, progression et expérience.
4. [`02-technical-architecture.md`](02-technical-architecture.md) — monorepo, mobile, backend et offline-first.
5. [`03-content-system.md`](03-content-system.md) — cartes, relations, sources et workflow éditorial.
6. [`04-discovery-engine.md`](04-discovery-engine.md) — scoring pondéré, ambiguïtés et indices.
7. [`05-roadmap.md`](05-roadmap.md) — étapes du prototype à la V1.
8. [`06-decisions.md`](06-decisions.md) — décisions structurantes et leurs raisons.
9. [`07-local-v1.md`](07-local-v1.md) — état réellement implémenté de la version locale.

## Principe général

Cardhéon est un **graphe historique jouable** :

- les cartes sont des nœuds ;
- les relations historiques sont des arêtes typées et pondérées ;
- une découverte résout un ensemble d’indices ;
- les figures découvertes deviennent de nouveaux outils d’exploration ;
- le contenu est sourcé, versionné et validé comme du code.

## Maintenir la documentation

- Une évolution du concept ou de ses invariants modifie `00-product-reference.md`.
- Une décision qui change une direction existante est aussi inscrite dans `06-decisions.md`.
- Un changement technique met à jour le document spécialisé correspondant.
- `07-local-v1.md` décrit l’état réel, pas l’ambition finale.
- Les documents doivent distinguer clairement ce qui est **implémenté**, **décidé** et **envisagé**.
- Le contenu historique source reste dans `content/` et ne doit pas être dupliqué dans l’interface.
