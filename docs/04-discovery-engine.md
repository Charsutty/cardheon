# 04 — Moteur de découverte

## Décision centrale

Cardhéon ne doit pas être une liste de recettes fixes.

Le système recommandé est un **moteur de découverte par scoring pondéré**.

Chaque carte jouée apporte des indices. Chaque indice augmente ou diminue le score de différents personnages. Un personnage est découvert si son score dépasse un seuil et s’il n’est pas trop ambigu par rapport aux autres candidats.

## Exemple simple

Cartes jouées :

```txt
Égypte ancienne
Pouvoir
Femme
Rome
```

Scores possibles :

```txt
Cléopâtre      92
Hatchepsout    58
Boudica        34
Hypatie        27
```

Résultat : Cléopâtre est découverte.

## Exemple ambigu

Cartes jouées :

```txt
Science
Femme
XXe siècle
```

Scores possibles :

```txt
Marie Curie          72
Rosalind Franklin    69
Katherine Johnson    66
Wangari Maathai      45
```

Résultat : pas de découverte, car l’intention est trop ambiguë.

Feedback possible :

```txt
Tu es proche de plusieurs femmes scientifiques du XXe siècle. Ajoute un indice lié au domaine précis : radioactivité, ADN, espace ou environnement.
```

## API implémentée

Le moteur vit dans `packages/game-engine`.

```ts
export type GameCatalog = {
  cards: Card[];
  relationships: Relationship[];
  constellations: Constellation[];
  packs: Pack[];
  sources: Source[];
  gameplay: {
    discovery: {
      minInputs: number;
      maxInputs: number;
    };
    crafting?: CraftingRecipe[];
    progression: {
      xpPerLevel: number;
      initialLevel: number;
    };
  };
};

export function attemptDiscovery(
  catalog: GameCatalog,
  userState: UserGameState,
  inputCardIds: string[],
  options?: DiscoveryOptions
): DiscoveryResult;

export function attemptCraft(
  catalog: GameCatalog,
  inputCardIds: string[]
): DiscoveryResult | null;
```

Les recettes exactes existent uniquement pour fabriquer certaines cartes-outils intermédiaires. Les figures doivent rester découvertes par scoring pondéré.

## Résultats possibles

```ts
type DiscoveryResult =
  | {
      type: "new_figure";
      cardId: string;
      score: number;
      reasons: ScoreReason[];
      rewards: Reward[];
    }
  | {
      type: "already_discovered";
      cardId: string;
      score: number;
      reasons: ScoreReason[];
      rewards: Reward[];
    }
  | {
      type: "craft";
      recipeId: string;
      outputCardId: string;
      rewards: Reward[];
    }
  | {
      type: "near_miss";
      hints: Hint[];
      candidates: CandidateScore[];
      nearestConstellations: string[];
    }
  | {
      type: "ambiguous";
      hints: Hint[];
      candidateCount: number;
      candidates: CandidateScore[];
    }
  | {
      type: "invalid";
      reason: string;
    };
```

## Étapes internes

Le moteur doit :

```txt
1. Valider les cartes d’entrée
2. Normaliser les inputs
3. Extraire les features
4. Scorer les personnages candidats
5. Appliquer les bonus de synergie
6. Appliquer les pénalités de contradiction
7. Vérifier les conditions minimales
8. Résoudre les ambiguïtés
9. Générer des indices
10. Calculer les récompenses
```

## Seuils

Paramètres recommandés :

```txt
minScore = 80 à 90 selon difficulté
ambiguityMargin = 10 à 15
minInputs = 2 au début
maxInputs = 5 en mode standard
```

Un personnage est découvert si :

```txt
score >= minScore
score - secondBestScore >= ambiguityMargin
conditions minimales respectées
personnage non déjà découvert
personnage disponible dans le contenu actif
```

## Synergies

Une synergie est un bonus quand plusieurs indices forment un ensemble très significatif.

Exemple Marie Curie :

```txt
Radioactivité + France = bonus
Physique + Nobel = bonus
Pierre Curie + Radioactivité = bonus
```

## Contradictions

Certaines cartes doivent pénaliser un candidat.

Exemple :

```txt
Égypte ancienne + XXe siècle
Antiquité + Informatique
Renaissance + Droits civiques américains
```

Une contradiction ne doit pas forcément bloquer, mais doit réduire fortement le score.

## Hints

Le moteur ne doit pas seulement dire raté.

Types de feedback :

```txt
near_miss
ambiguous
contradictory
too_broad
missing_period
missing_region
missing_domain
missing_relation
already_known_path
```

## Tests obligatoires

Le moteur doit être testé indépendamment de l’app mobile.

Tests minimum :

```txt
Une combinaison valide découvre le bon personnage
Une combinaison ambiguë ne débloque pas arbitrairement
Une contradiction pénalise le score
Un personnage déjà découvert donne un résultat approprié
Un personnage peut être découvert par plusieurs chemins
Une carte-outil inutile est détectée par simulation
Les récompenses de constellation sont calculées
Une carte connue mais verrouillée est refusée
```

État actuel : les tests moteur couvrent ces cas dans `packages/game-engine/src/index.test.ts`. Les garde-fous de catalogue sont complétés par `scripts/analyze-discoverability.ts`.
