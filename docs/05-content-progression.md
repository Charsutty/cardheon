# 05 — Progression du contenu et combinatoire

Ce document explique comment Cardhéon garantit qu’un catalogue de cartes reste **jouable de bout en bout**. Il décrit l’enjeu de la combinatoire, l’outil qui la résout, et la manière de lire ses résultats.

---

## TL;DR

> Vérifier à la main que chaque figure est découvrable est impossible dès que le catalogue dépasse quelques dizaines de cartes. L’analyseur `scripts/analyze-discoverability.ts` explore uniquement les combinaisons “témoins positifs” et valide chacune avec le vrai moteur de découverte.

---

## Le problème : une explosion combinatoire

Dans Cardhéon, une figure se découvre en combinant entre 2 et 5 cartes. Avec un pack de départ de 50 cartes, le nombre de combinaisons possibles est :

```text
C(50,2) + C(50,3) + C(50,4) + C(50,5) ≈ 2 000 000
```

Et ce n’est qu’une passe. Il faut recommencer après chaque découverte, car les figures débloquées deviennent elles-mêmes des cartes jouables et ouvrent de nouveaux outils.

Une simulation brute-force :

- teste toutes les combinaisons depuis l’état courant ;
- s’arrête quand plus aucune figure n’est découvrable ;
- répète jusqu’au point fixe.

Avec le catalogue de test actuel (110 cartes, 25 figures), cette approche dépasse rapidement plusieurs minutes. Elle devient inutilisable dès qu’on ajoute un deuxième pack ou qu’on enrichit les règles.

---

## L’approche retenue : témoins positifs + oracle

L’analyseur (`scripts/analyze-discoverability.ts`) adopte une stratégie différente.

### 1. Ne pas tout énumérer

Pour une figure cible, il ne garde que les cartes susceptibles de lui apporter des points positifs :

- celles qui matchent une `evidence` de sa règle ;
- celles qui matchent une condition de `synergy`.

Ces cartes forment l’ensemble des **candidats positifs**.

### 2. Valider avec le vrai moteur

Chaque combinaison candidate est passée à `attemptDiscovery()` du `packages/game-engine`. L’analyseur n’est pas un second moteur : il ne fait qu’**orchestrer** des appels au moteur réel.

### 3. Rejouer jusqu’au point fixe

Quand une figure est découverte :

- elle devient jouable ;
- ses `unlocksToolCardIds` sont ajoutés aux cartes disponibles ;
- les récompenses de constellation éventuelles sont appliquées.

L’analyseur recommence alors depuis le début, jusqu’à ce qu’aucune nouvelle figure ne soit trouvée.

---

## Exécuter l’analyseur

```bash
# Analyse par défaut du catalogue de test
corepack pnpm analyze:discoverability

# Mode exhaustif (plus lent, plus précis)
corepack pnpm tsx scripts/analyze-discoverability.ts content/catalog.dev.json --exact-positive

# Sortie JSON pour un traitement automatique
corepack pnpm tsx scripts/analyze-discoverability.ts content/catalog.dev.json --json
```

---

## Lire le rapport

Le rapport affiche quatre nombres clés :

| Métrique | Objectif |
|---|---|
| `Discovered figures` | Doit être égal au nombre total de figures du catalogue. |
| `Blocked figures` | Doit être à 0. Sinon, ces figures ne seront jamais jouables. |
| `Circularity warnings` | Cycles à examiner. Certains sont acceptables, d’autres bloquants. |
| `Thematic warnings` | Recouvrements thématiques normaux, à relire mais non bloquants. |

### Ordre de découverte valide

La section liste les figures dans l’ordre où l’analyseur les a découvertes. Pour chaque étape, elle affiche :

```text
Marie Curie [figure.marie-curie] <= France + Physique + XXe siècle + Femme | unlocks: place.poland
```

Cet ordre n’est pas l’ordre de jeu imposé au joueur. C’est une **preuve d’existence** : il existe au moins un chemin qui mène à chaque figure.

### Figures bloquées

Une figure bloquée apparaît avec l’une de ces deux raisons :

- `missing-positive-evidence` : une référence positive de sa règle n’est jamais disponible dans le catalogue ;
- `no-unambiguous-positive-witness` : des candidates existent, mais aucune combinaison ne dépasse le seuil de score ou la marge d’ambiguïté.

!!! warning "Ne pas ignorer les figures bloquées"
    Une figure bloquée est une figure injouable. Le catalogue doit être corrigé avant de publier.

---

## Circularités : bloquantes, thématiques ou audit

Trois types de warning sont signalés.

### `direct-self-unlock` — bloquant

Une figure débloque une carte qui est **directement référencée** par sa propre règle de découverte.

```text
Marie Curie unlocks Radioactivité, which is directly referenced by its own discovery rule.
```

Si la figure n’est pas découvrable sans cette carte, elle est inatteignable. L’analyseur échoue sur ce type de warning.

### `tag-self-unlock` — thématique

Une figure débloque une carte qui partage simplement un tag avec sa règle. C’est souvent intentionnel : une figure scientifique débloque un concept scientifique.

```text
Marie Curie unlocks Radioactivité, which shares tag:domain.physics with its own discovery rule.
```

Ces warnings sont regroupés sous **Thematic warnings**. Ils ne font pas échouer l’analyseur, mais ils méritent une relecture pour éviter les dédoublements inutiles.

### `dependency-cycle` — audit

Un cycle apparaît dans le graphe `carte → figure → carte débloquée`. La plupart des cycles relevés sont en réalité des **chaînes de progression** : Socrate → Platon → Aristote forme un cycle uniquement parce qu’Aristote débloque un outil qui, indirectement, pourrait aussi aider Socrate.

Ces cycles ne bloquent pas la découverte s’ils sont “rompus” par le pack de départ : dès qu’une carte du cycle est disponible au début de la partie, le joueur peut entrer dans la chaîne sans la fermer.

---

## Catalogue de test actuel

Le catalogue de test (`content/catalog.dev.json`) est généré par `scripts/generate-test-catalog.ts`. Il contient :

- 25 figures historiques réparties sur 3 niveaux de difficulté ;
- 85 cartes-outils (périodes, lieux, domaines, concepts, œuvres, événements…) ;
- 157 relations ;
- 8 constellations.

### Répartition des niveaux

| Niveau | Découvrable avec | Exemples |
|---|---|---|
| 1 | Le pack de départ | Marie Curie, Cléopâtre, Socrate, Jeanne d’Arc |
| 2 | Des outils débloqués par les niveau 1 | Pierre Curie, Irène Joliot-Curie, Hypatie, Newton |
| 3 | Des figures déjà découvertes | Platon, Aristote, Simón Bolívar |

### Stratégie de déblocage

Chaque figure de niveau 1 débloque un outil thématique :

```text
Marie Curie         -> place.poland
Léonard de Vinci    -> work.mona-lisa
Martin Luther King  -> event.american-civil-rights
Christophe Colomb   -> symbol.compass
```

Ces outils servent ensuite à découvrir les figures de niveau 2 et 3, tout en enrichissant le vocabulaire du joueur.

!!! tip "Ajouter une carte au pack de départ"
    Quand un concept clé est requis par plusieurs figures (ex. `concept.radioactivity`), il est parfois plus simple de l’ajouter au pack de départ que de créer une figure intermédiaire dédiée.

---

## Commandes utiles

| Tâche | Commande |
|---|---|
| Régénérer le catalogue de test | `corepack pnpm generate:test-catalog` |
| Valider la forme du catalogue | `corepack pnpm validate:content` |
| Vérifier la découvrabilité | `corepack pnpm analyze:discoverability` |
| Lancer les tests du moteur | `corepack pnpm test` |

---

## Prochaines étapes

- Ajouter un second pack de test et vérifier qu’il reste accessible depuis le premier.
- Affiner les `minScore` et `ambiguityMargin` des figures de niveau 2 pour éviter les ambiguïtés.
- Introduire des règles de déblocage progressif par domaine (ex. débloquer `domain.medicine` via une figure médicale).
