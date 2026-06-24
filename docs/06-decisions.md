# 06 — Décisions structurantes

Ce document résume les choix déjà faits pour que le projet reste compréhensible dans le temps.

## Référence produit canonique

Décision : utiliser [`00-product-reference.md`](00-product-reference.md) comme synthèse canonique du concept, des objectifs et des invariants.

Raison :

- permettre une reprise du projet sans contexte conversationnel ;
- éviter que la vision soit dispersée entre le code et plusieurs documents ;
- distinguer l’intention produit de l’état temporaire de l’implémentation ;
- obliger toute évolution structurante à être documentée explicitement.

## Nom du projet

Décision : utiliser **Cardhéon**.

Raison : le nom combine l’idée de cartes et de Panthéon, tout en gardant une identité originale.

## Format produit

Décision : construire une application mobile.

Raison : le jeu repose sur des sessions courtes, de la collection, des gestes tactiles et une progression régulière. Le mobile est donc le format naturel.

## Stack mobile

Décision : utiliser Expo + React Native + TypeScript.

Raison :

- développement cross-platform ;
- rapidité de prototypage ;
- intégration facile avec Expo Router, SQLite, assets et builds ;
- TypeScript indispensable pour sécuriser le modèle de données.

## Backend

Décision : utiliser Supabase à moyen terme.

Raison :

- Postgres convient très bien au graphe de contenu ;
- Auth, Storage, Edge Functions et RLS sont intégrés ;
- pas besoin de construire un backend complet au départ.

## Local-first

Décision : l’app doit fonctionner offline autant que possible.

Raison :

- meilleure expérience mobile ;
- le contenu historique se prête bien au cache local ;
- les découvertes peuvent être simulées localement puis synchronisées.

## Contenu dans le monorepo au départ

Décision : garder `content/` dans le monorepo pendant la phase MVP.

Raison :

- le schéma va évoluer souvent ;
- le moteur et le contenu doivent être modifiés ensemble ;
- les PR seront plus simples au début.

## Submodule plus tard

Décision : envisager un submodule `cardheon-content` quand le format sera stable.

Raison :

- séparation claire code / contenu ;
- historique éditorial indépendant ;
- meilleure collaboration avec rédacteurs, historiens ou IA de contenu ;
- publication versionnée du corpus.

## Catalogue local en SQLite

Décision : le catalogue embarqué est seedé dans SQLite et relu depuis la base locale quand elle est disponible.

Raison :

- tester dès le MVP les chemins de persistance offline ;
- préparer la future synchronisation de versions de catalogue ;
- garder le jeu utilisable avec un catalogue embarqué de secours.

Conséquence : les champs qui influencent les récompenses, comme `unlocksToolCardIds`, doivent être persistés et relus depuis SQLite, pas seulement présents dans le JSON.

## Moteur non basé sur des recettes fixes

Décision : utiliser un moteur de scoring pondéré.

Raison :

- plusieurs chemins de découverte ;
- meilleure scalabilité ;
- personnages découverts réutilisables ;
- feedback plus intelligent ;
- meilleure profondeur pédagogique.

## Recettes limitées aux cartes-outils

Décision : conserver `attemptCraft` pour fabriquer quelques cartes-outils, sans l’utiliser comme mécanique principale de découverte des figures.

Raison :

- utile pour synthétiser des civilisations, concepts ou outils intermédiaires ;
- évite de transformer Cardhéon en table de recettes rigides ;
- laisse les personnages au moteur pondéré, qui gère mieux ambiguïtés, contradictions et chemins multiples.

## Constellations

Décision : utiliser des constellations comme collections thématiques.

Raison :

- guider le joueur ;
- structurer la progression ;
- rendre les liens historiques visibles ;
- créer des objectifs sans spoiler toute la collection.

## Packs

Décision : utiliser des packs comme récompenses de progression, pas comme mécanique agressive de monétisation.

Raison : Cardhéon doit rester éducatif et éviter une logique de pay-to-win ou de loot boxes frustrantes.

## Qualité historique

Décision : chaque personnage doit avoir des sources et une note de sensibilité si nécessaire.

Raison : le jeu peut être ludique, mais il doit rester responsable et éviter les biographies simplistes ou hagiographiques.

## Garde-fous avant élargissement du contenu

Décision : avant chaque palier de contenu, exécuter les commandes de qualité locales.

```bash
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm validate:content
corepack pnpm analyze:discoverability
```

Raison :

- empêcher les figures bloquées ;
- détecter les ambiguïtés involontaires ;
- protéger les régressions du moteur ;
- éviter que le contenu publié diverge du contrat technique.
