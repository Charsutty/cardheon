# 05 — Roadmap

## État actuel

Le dépôt n’est plus en préproduction pure. Une première boucle locale existe déjà :

```txt
Expo + React Native + TypeScript
moteur TypeScript pur de découverte pondérée
catalogue local versionné
SQLite local
Atelier jouable
Collection
progression locale
scripts de validation, simulation et découvrabilité
admin Vite pour le graphe de contenu
```

La priorité actuelle est donc de stabiliser ce MVP local, pas de réinitialiser le projet.

## Phase 0 — Préproduction socle

Objectif : valider le modèle de données et le gameplay avant de construire trop d’interface.

Livrables :

```txt
types de cartes
moteur TypeScript pur
simulateur CLI
premiers tests de découvrabilité
catalogue de test
```

Critère de réussite :

```txt
On peut lancer une simulation et vérifier que les personnages test sont découvrables par plusieurs chemins.
```

Statut : réalisé pour le socle local. À renforcer avec des schémas de contenu plus stricts et davantage de tests moteur.

## Phase 1 — MVP local

Objectif : rendre le jeu local fiable, testable et agréable avant d’ajouter le backend.

Livrables :

```txt
30 personnages équilibrés
100 cartes-outils utiles
10 constellations
catalogue local construit depuis des sources éditoriales
SQLite local robuste
Atelier avec feedback pédagogique
Collection avec fiches cartes
Packs basiques
progression locale
tests moteur obligatoires
validation de contenu bloquante
analyse de découvrabilité bloquante
```

Critère de réussite :

```txt
Un joueur peut installer l’app, faire le tutoriel, découvrir des personnages et compléter une première constellation offline.
```

## Phase 2 — Backend et synchronisation

Objectif : permettre la progression persistante et la validation serveur.

Livrables :

```txt
Supabase Auth
Supabase Postgres
Row Level Security
Supabase Storage
Edge Function attempt-discovery
Edge Function sync-progress
Edge Function open-pack
catalogue versionné
sync de progression
```

Critère de réussite :

```txt
Un utilisateur peut retrouver sa progression après réinstallation ou changement d’appareil.
```

## Phase 3 — V1 100 personnages

Objectif : vraie première version publiable.

Livrables :

```txt
100 personnages
250 à 400 cartes-outils
800 à 1 500 relations
30 à 50 constellations
packs thématiques
onboarding complet
analytics de gameplay
admin minimal
```

Critère de réussite :

```txt
Le jeu offre plusieurs heures de découverte, une collection cohérente et une vraie richesse pédagogique.
```

## Phase 4 — Live ops

Objectif : rendre Cardhéon vivant après la V1.

Livrables possibles :

```txt
événements temporaires
saisons pédagogiques
nouveaux packs
nouveaux personnages
localisation
notifications
contenu régulier
classements optionnels
```

## Priorité actuelle

La stabilisation de base du MVP local a été faite côté code : persistance SQLite des déblocages, application unique des rewards, tests moteur renforcés, validation de contenu enrichie et commandes qualité exécutables.

La prochaine étape concrète est :

```txt
1. transformer progressivement le contenu en fichiers source éditoriaux ;
2. durcir `packages/content-schema` avec de vrais schémas Zod ;
3. créer les fiches détaillées de collection ;
4. améliorer le feedback pédagogique de l’Atelier ;
5. ajouter un tutoriel local ;
6. élargir le catalogue vers 30 figures équilibrées ;
7. garder `validate:content` et `analyze:discoverability` bloquants avant chaque palier.
```
