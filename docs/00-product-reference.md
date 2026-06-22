# Référence produit canonique

Ce document est le point d’entrée de référence pour comprendre Cardhéon sans contexte préalable. Il fixe le concept, les objectifs et les invariants à préserver. Les autres documents de `docs/` approfondissent chaque domaine.

En cas d’écart involontaire avec l’implémentation, ce document décrit l’intention produit. Toute modification de cette intention doit également être inscrite dans `06-decisions.md`.

## Résumé en une phrase

**Cardhéon est un jeu mobile de collection et d’exploration historique dans lequel le joueur découvre des figures en combinant des cartes-indices au sein d’un graphe historique pondéré.**

## Promesse

Cardhéon doit donner le sentiment que l’Histoire est un monde vivant à explorer, et non une liste de dates à mémoriser.

Le plaisir repose sur quatre actions :

1. formuler une hypothèse avec des cartes-indices ;
2. voir les liens historiques produire une découverte ;
3. enrichir une collection qui ouvre de nouveaux chemins ;
4. apprendre par les relations, le contexte et la curiosité.

Le jeu réunit la satisfaction d’un jeu de combinaison, la progression d’un jeu de collection et la profondeur d’un graphe de connaissances.

## Modèle mental fondamental

Cardhéon est un **graphe historique jouable** :

- chaque carte est un nœud ;
- chaque relation historique est une arête typée et pondérée ;
- chaque tentative est une requête interprétée sur ce graphe ;
- chaque personnage découvert agrandit la collection et le vocabulaire de jeu.

Le produit ne doit jamais devenir une table de recettes rigides. Une même figure doit pouvoir être découverte par plusieurs chemins cohérents. Une combinaison ambiguë produit un retour utile, jamais un résultat arbitraire.

## Piliers

- **Ludique** : collection, raretés, packs, quêtes, constellations, animations et progression.
- **Pédagogique** : contexte, relations, sources, nuances et explication des résultats.
- **Data-driven** : cartes, règles et contenus sont des données validées, jamais des conditions enfouies dans React.
- **Scalable** : le moteur doit évoluer de quelques figures à plus de 1 000 sans réécriture.
- **Local-first** : la boucle principale et la consultation restent utiles sans connexion.
- **Cross-platform** : Expo, React Native et TypeScript.
- **Responsable** : contenu sourcé, nuancé et relu humainement.

## Les cartes

### Personnages

Les figures historiques sont l’objectif principal de collection. Une fiche contient notamment :

- identité et dates avec leur précision ;
- régions, lieux, périodes, domaines et rôles ;
- concepts, événements, œuvres et inventions ;
- relations avec d’autres cartes ;
- résumé, contexte, importance et anecdote utile ;
- avertissement contre les simplifications si nécessaire ;
- sources, rareté, constellations et chemins de découverte ;
- illustration avec licence, attribution et provenance.

### Cartes-outils

Elles forment le vocabulaire de l’Atelier :

```txt
period        époque
region        région géographique
place         lieu précis
civilization  civilisation, culture, royaume ou empire
role          rôle social ou historique
domain        domaine d’activité
concept       idée, discipline, invention ou notion
event         événement historique
work          œuvre, texte, invention ou découverte
movement      mouvement politique, artistique, religieux ou scientifique
relation      lien humain ou historique
symbol        symbole visuel ou culturel
```

Les concepts abstraits — démocratie, exil, transmission, résistance, égalité — relient des figures éloignées et évitent les associations superficielles.

### Personnages comme indices

Une figure découverte devient elle-même utilisable dans l’Atelier :

```txt
Socrate → Platon → Aristote
Pierre Curie → Marie Curie → Irène Joliot-Curie
Rosa Parks → Martin Luther King Jr.
```

La collection est donc un outil de progression, pas un album passif.

## Boucle principale

```txt
Recevoir des cartes-outils
→ choisir 2 à 5 indices dans l’Atelier
→ lancer une tentative
→ obtenir une découverte ou un retour intelligent
→ lire et relier la nouvelle connaissance
→ gagner de l’XP, des cartes, un pack ou une constellation
→ utiliser la collection pour ouvrir de nouveaux chemins
```

Un mode avancé pourra autoriser jusqu’à sept indices.

## Moteur de découverte

Chaque indice apporte des preuves positives ou négatives aux candidats. Le moteur applique :

1. validation et normalisation des cartes ;
2. extraction des tags et relations ;
3. scoring des figures ;
4. bonus de synergie ;
5. pénalités de contradiction ;
6. conditions minimales ;
7. seuil de découverte et marge d’ambiguïté ;
8. génération d’explications, d’indices et de récompenses.

Résultats possibles :

```txt
new_figure
already_discovered
near_miss
ambiguous
invalid
```

Les retours peuvent signaler une période, une région, un domaine ou une relation manquante, une piste trop large ou une contradiction. L’échec doit toujours nourrir le raisonnement.

## Progression

### Révélation progressive

La collection protège le mystère avec les états :

```txt
hidden
silhouette
rarity_only
one_hint
three_hints
name_revealed
discovered
mastered
```

### Constellations

Ce sont des sous-collections thématiques et des vues du graphe : Femmes de science, Égypte ancienne, Transmission philosophique, Calcul, code et machines, Droits civiques et résistances, etc. Elles guident le joueur et distribuent des récompenses.

### Packs et récompenses

Les packs sont liés à une période, région, discipline, constellation, saison ou quête. Ils servent principalement la progression.

Récompenses possibles :

```txt
new_tool_card
new_figure_card
pack
hint
constellation_unlock
cosmetic
title
shard
```

Pas de loot boxes opaques ni de pay-to-win pédagogique. D’éventuels achats doivent être transparents ; les cosmétiques sont préférables.

## Expérience cible

Les zones structurantes sont :

- accueil et progression ;
- Atelier de découverte ;
- Collection et recherche ;
- fiche détaillée ;
- constellations et graphe de connaissances ;
- quêtes et défis ;
- profil et statistiques.

L’Atelier doit être rapide, tactile et utilisable à une main. Le tap-to-slot est prioritaire ; le drag-and-drop reste optionnel. La V1 privilégie grille, recherche et filtres ; timeline et carte du monde pourront suivre.

## Ligne éditoriale

Chaque figure publiée doit présenter :

```txt
Nom et dates
Région principale
Domaines et rôles
Résumé court
Pourquoi cette personne compte
Contexte historique
Liens avec d’autres cartes
Anecdote utile
Attention aux simplifications
Sources
```

Niveaux de sensibilité :

```txt
normal
nuanced
sensitive
highly_sensitive
```

Une IA peut proposer un brouillon, mais ne publie jamais seule :

```txt
IA propose → validation automatique → revue humaine → publication
```

Pour les images, conserver licence, attribution, checksum et provenance :

```txt
public_domain
licensed
ai_generated
internal_illustration
user_generated
```

## Architecture cible

```txt
Expo + React Native + TypeScript
+ Expo Router
+ catalogue et progression en SQLite
+ moteur TypeScript partagé
+ contenu Git-first validé par Zod
+ Supabase Postgres, Auth, RLS, Storage et Edge Functions
+ outil admin pour gérer et publier le graphe
```

Le monorepo sépare :

- `apps/mobile` : expérience joueur ;
- `apps/admin` : gestion éditoriale future ;
- `packages/game-engine` : scoring et progression ;
- `packages/content-schema` : schémas et types ;
- `packages/db` : persistance ;
- `packages/ui` : système visuel ;
- `packages/assets-pipeline` : médias ;
- `content` : corpus source ;
- `scripts` : validation, compilation et simulation ;
- `supabase` : migrations et fonctions serveur.

## États et services mobiles

```txt
Server state          profil distant, manifest, packs et synchronisation
Game state persistant collection, progression, tentatives et catalogue
UI state temporaire   sélection, filtres, modales et animations
```

Services cibles : `CatalogService`, `DiscoveryService`, `CollectionService`, `ConstellationService`, `PackService`, `SyncService` et `AssetCacheService`.

## Contrat offline

Doivent fonctionner hors ligne :

- collection et fiches téléchargées ;
- tentative avec le catalogue local ;
- résultat local ou provisoire ;
- progression de constellation ;
- certains packs déjà acquis.

Une queue locale conserve les mutations en attente. À la reconnexion, le serveur accepte ou rejette chaque mutation et renvoie un patch. Client et serveur utilisent le même moteur et la même version de contenu.

## Backend minimal

```txt
GET  /catalog/manifest
POST /attempt-discovery
POST /open-pack
POST /sync-progress
```

Une tentative contient un identifiant client idempotent et la version du contenu. Le manifest fournit version courante, version minimale de l’app, checksum et URL des assets.

## Internationalisation

Le français est initial, mais le modèle prépare `fr`, `en`, `es`, `de` et `it`. Les textes localisés sont séparés des entités ; slugs et identifiants restent universels.

## Télémétrie responsable

La télémétrie améliore le game design, sans surcollecte. Elle mesure onboarding, tentatives, succès, near misses, cartes consultées, indices et constellations. Elle doit détecter les figures impossibles, outils inutilisés, ambiguïtés et blocages.

## Qualité

### Moteur

- bonne figure découverte ;
- ambiguïté non résolue arbitrairement ;
- contradictions appliquées ;
- chemins multiples ;
- doublons correctement traités.

### Contenu

- slugs uniques et références valides ;
- traduction française ;
- sources et constellations ;
- plusieurs chemins de découverte ;
- aucune carte-outil publiée inutilisée.

### Interface

- Atelier utilisable à une main ;
- collection filtrable ;
- fiches lisibles sur petit écran ;
- état offline clair ;
- animations non bloquantes ;
- accessibilité web et mobile.

## Échelle visée

MVP local :

```txt
30 personnages
100 cartes-outils
10 constellations
```

V1 :

```txt
100 personnages
250 à 400 cartes-outils
800 à 1 500 relations
30 à 50 constellations
```

Cette densité est nécessaire pour obtenir un graphe riche plutôt qu’une collection de recettes.

## Hors périmètre initial

- backend complet avant validation locale ;
- compétition au cœur du produit ;
- publication automatique par IA ;
- loot boxes opaques ;
- réseau social généraliste ;
- drag-and-drop obligatoire ;
- traitement précipité de figures hautement sensibles.

## Invariants à préserver

1. La découverte reste le cœur du jeu.
2. Le graphe reste la source de vérité.
3. Une figure accepte plusieurs chemins cohérents.
4. Les figures découvertes peuvent devenir des indices.
5. Les échecs enseignent quelque chose.
6. Le contenu est sourcé et nuancé.
7. Le jeu reste utile offline.
8. Les données ne sont pas enfouies dans l’UI.
9. La collection révèle progressivement son mystère.
10. La monétisation éventuelle ne bloque pas l’apprentissage.

## Lecture approfondie

- `00-project-context.md` : origine et positionnement ;
- `01-product-design.md` : boucle, écrans et progression ;
- `02-technical-architecture.md` : architecture et offline-first ;
- `03-content-system.md` : corpus et qualité historique ;
- `04-discovery-engine.md` : scoring et résultats ;
- `05-roadmap.md` : phases ;
- `06-decisions.md` : décisions structurantes ;
- `07-local-v1.md` : état de l’implémentation locale.
