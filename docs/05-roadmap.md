# 05 — Roadmap

## Phase 0 — Préproduction

Objectif : valider le modèle de données et le gameplay avant de construire trop d’interface.

Livrables :

```txt
10 personnages test
40 cartes-outils test
5 constellations test
schémas Zod
moteur TypeScript pur
simulateur CLI
premiers tests de découvrabilité
```

Critère de réussite :

```txt
On peut lancer une simulation et vérifier que les personnages test sont découvrables par plusieurs chemins.
```

## Phase 1 — MVP local

Objectif : rendre le jeu jouable sans backend.

Livrables :

```txt
30 personnages
100 cartes-outils
10 constellations
catalogue local
SQLite local
Atelier
Collection
Fiches cartes
Packs basiques
progression locale
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

La prochaine étape concrète est :

```txt
1. initialiser l’app Expo ;
2. définir les premiers types de cartes ;
3. écrire les schémas de contenu ;
4. créer 10 personnages test ;
5. implémenter le premier moteur de scoring ;
6. créer un simulateur CLI.
```
