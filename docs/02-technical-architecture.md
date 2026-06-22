# 02 — Architecture technique

## Décision principale

Cardhéon est construit comme un **monorepo TypeScript**.

Objectif : partager les types, les schémas et le moteur de découverte entre :

- l’application mobile ;
- le backend ;
- les scripts de validation ;
- le futur outil admin ;
- les simulations de contenu.

## Stack mobile

Stack cible :

```txt
Expo
React Native
TypeScript
Expo Router
SQLite local
Zod
pnpm
```

Expo est choisi pour accélérer le développement mobile cross-platform. TypeScript est obligatoire pour sécuriser les modèles de cartes, de règles et de progression.

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

Schémas Zod et types de contenu.

Responsabilités :

```txt
valider les fichiers YAML/JSON
partager les types entre scripts, app et backend
éviter les slugs cassés ou les données incohérentes
```

### `packages/db`

Types, migrations et helpers liés à Supabase/Postgres.

### `packages/ui`

Composants UI partagés éventuels entre l’app mobile et l’admin.

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

Futur outil web interne pour gérer le contenu :

```txt
cartes
relations
sources
constellations
packs
validation
publication de catalogue
```

L’admin peut rester vide au début.

## Backend Supabase

Dossier :

```txt
supabase/
  migrations/
  functions/
```

Edge Functions prévues :

```txt
attempt-discovery
sync-progress
open-pack
publish-content-version
```

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
