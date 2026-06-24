# 02 — Architecture technique

## Décision principale

Cardhéon est construit comme un **monorepo TypeScript**.

Objectif : partager les types, les schémas et le moteur de découverte entre :

- l’application mobile ;
- le backend ;
- les scripts de validation ;
- l’outil admin ;
- les simulations de contenu.

## Stack mobile

Stack implémentée pour le MVP local :

```txt
Expo
React Native
TypeScript
Expo Router
SQLite local
pnpm
Tamagui
```

Expo est choisi pour accélérer le développement mobile cross-platform. TypeScript est obligatoire pour sécuriser les modèles de cartes, de règles et de progression.

Zod reste la cible pour les schémas éditoriaux stricts. Aujourd’hui, `packages/content-schema` centralise déjà les constantes et types de contenu, mais la validation runtime est encore portée par les scripts.

## Backend

Backend cible : Supabase.

Services prévus :

```txt
Supabase Auth
Supabase Postgres
Row Level Security
Supabase Storage
Supabase Edge Functions
```

Supabase est adapté car Cardhéon repose sur beaucoup de données relationnelles : cartes, tags, personnages, relations, packs, constellations et progression utilisateur.

## Local-first

Le jeu doit rester utilisable offline.

Ce qui doit fonctionner offline :

```txt
Voir sa collection
Lire les fiches déjà téléchargées
Tenter des découvertes avec le catalogue local
Continuer une constellation
Ouvrir certains packs déjà acquis
```

Ce qui nécessite une synchronisation :

```txt
Validation définitive serveur
Packs rares ou événements live
Classements éventuels
Achats éventuels
Mise à jour du catalogue
```

## Packages internes

### `packages/game-engine`

Moteur TypeScript pur.

Responsabilités :

```txt
normaliser les cartes jouées
scorer les candidats
gérer ambiguïtés et contradictions
générer des indices
calculer les récompenses
```

### `packages/content-schema`

Contrat de contenu partagé.

Responsabilités :

```txt
centraliser les constantes de types, statuts et raretés
valider les fichiers YAML/JSON
partager les types entre scripts, app et backend
éviter les slugs cassés ou les données incohérentes
```

État actuel : constantes et types partagés. Prochaine étape : schémas Zod complets pour les cartes, figures, sources, constellations, packs et catalogue compilé.

### `packages/db`

Types, migrations et helpers liés à Supabase/Postgres.

### `packages/ui`

Composants UI partagés et thème Cardhéon.

### `packages/assets-pipeline`

Scripts futurs pour préparer les images : thumbnails, manifests, checksums, licences.

## Applications

### `apps/mobile`

Application Expo.

Écrans principaux :

```txt
Accueil
Atelier
Collection
Constellations
Profil
```

### `apps/admin`

Outil web interne Vite/React pour visualiser et auditer le graphe de contenu :

```txt
cartes
relations
sources
constellations
packs
validation
publication de catalogue
métriques de graphe
exploration de chemins
```

État actuel : une première interface de graphe existe. La publication de catalogue reste à implémenter.

## Backend Supabase

Dossier :

```txt
supabase/
  migrations/
  functions/
```

Etat actuel du projet distant `fjbinzflrmlrtgyszgcu` :

```txt
Postgres initialise
12 tables public creees
RLS activee sur les tables public Cardheon
catalog-manifest deployee sans JWT
sync-progress deployee avec JWT
```

La migration appliquee est :

```txt
20260624122110_catalog_and_progress
```

Elle a ete appliquee via le MCP Supabase, car `supabase db push` depuis la machine locale expirait sur le pooler Postgres `aws-1-eu-central-1.pooler.supabase.com:5432`.

Edge Functions :

```txt
catalog-manifest        deployee, lecture publique de la version catalogue publiee
sync-progress           deployee, synchronisation des snapshots de progression avec JWT
attempt-discovery       prevu pour la validation serveur gameplay
open-pack               prevu pour l'ouverture serveur de packs
publish-content-version prevu pour la publication de contenu
```

Le MVP reste local-first : la progression locale et le catalogue SQLite restent la source d'usage principale quand Supabase est indisponible.

## Versioning du contenu

Le contenu publié doit avoir une version stable :

```txt
2026.06.22-001
```

L’application doit connaître :

```txt
version locale
version distante
compatibilité app/contenu
checksum du catalogue
base URL des assets
```

## Architecture à terme

Au début, `content/` reste dans le monorepo pour itérer vite.

Quand le format sera stable, `content/` pourra devenir un repo séparé, puis être réintégré comme submodule Git :

```bash
git submodule add git@github.com:Charsutty/cardheon-content.git content
```

Cette extraction ne doit pas être faite trop tôt, car le schéma de contenu va beaucoup évoluer pendant le prototype.
