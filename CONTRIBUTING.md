# Contribution

Cardhéon est encore en préproduction. Les contributions doivent préserver deux objectifs :

1. construire une architecture scalable ;
2. garantir un contenu historique sourcé et nuancé.

## Workflow recommandé

```txt
main       version stable
feature/*  développement technique
content/*  ajout ou correction de contenu
fix/*      correction ciblée
```

## Avant une pull request

À terme, lancer :

```bash
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:content
pnpm simulate:discoveries
```

## Contenu historique

Chaque personnage doit avoir :

- des tags cohérents ;
- des relations explicites ;
- au moins une constellation ;
- des sources ;
- une note de sensibilité si nécessaire.

Une IA peut proposer du contenu, mais une review humaine doit valider les éléments historiques avant publication.
