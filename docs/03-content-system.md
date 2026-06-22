# 03 — Système de contenu

## Principe

Le contenu est le cœur de Cardhéon.

Il doit être traité comme du code :

- versionné ;
- relu ;
- validé ;
- testé ;
- simulé ;
- publié par versions.

Aucune règle importante ne doit être codée directement dans un composant React.

## Familles de cartes

Types prévus :

```txt
figure        Personnage historique
period        Époque
region        Région
place         Lieu précis
civilization  Civilisation, empire, royaume, culture
role          Rôle historique ou social
domain        Domaine d’activité
concept       Concept abstrait
event         Événement historique
work          Œuvre, texte, invention ou découverte
movement      Mouvement politique, artistique, scientifique ou religieux
relation      Type de lien
symbol        Symbole visuel ou culturel
```

## Personnages

Les cartes personnages sont l’objectif principal de collection.

Une carte personnage doit contenir :

```txt
slug
nom localisé
subtitle
résumé court
texte long
dates
régions
époques
domaines
rôles
concepts associés
relations
sources
constellations
règles de découverte
sensibilité historique
```

## Cartes-outils

Les cartes-outils servent à découvrir les personnages.

Exemples :

```txt
Antiquité
Égypte ancienne
Alexandrie
Philosophie
Mathématiques
Astronomie
Imprimerie
Révolution française
Radioactivité
Droits civiques
Empire mongol
Route de la soie
Médecine
Poésie
Suffrage féminin
```

## Relations

Les relations constituent le graphe historique.

Types de prédicats possibles :

```txt
born_in
active_in
ruled
studied
wrote
invented
discovered
influenced
was_influenced_by
contemporary_of
member_of
opposed
associated_with
parent_of
child_of
teacher_of
student_of
collaborated_with
symbolized_by
```

Exemples :

```txt
Socrate --teacher_of--> Platon
Platon --teacher_of--> Aristote
Pierre Curie --collaborated_with--> Marie Curie
Marie Curie --associated_with--> Radioactivité
Rosa Parks --associated_with--> Droits civiques
```

## Fichiers source

Le contenu doit être écrit dans `content/`.

Structure :

```txt
content/
  figures/
  tools/
  constellations/
  packs/
  sources/
  assets-manifest/
```

Format possible : YAML au début, JSON si cela facilite les scripts.

## Exemple de personnage

```yaml
slug: marie-curie
kind: figure
rarity: legendary
status: reviewed

localization:
  fr:
    title: "Marie Curie"
    subtitle: "Physicienne et chimiste"
    shortDescription: "Pionnière de la radioactivité, figure majeure de la science moderne."

profile:
  birthYear: 1867
  deathYear: 1934
  displayLifetime: "1867 – 1934"

tags:
  - domain.science: 30
  - domain.physics: 40
  - domain.chemistry: 35
  - concept.radioactivity: 55
  - place.poland: 20
  - place.france: 20
  - award.nobel: 25

relationships:
  - predicate: collaborated_with
    target: pierre-curie
    weight: 35
  - predicate: associated_with
    target: radioactivity
    weight: 55

discovery:
  minScore: 85
  ambiguityMargin: 10
  evidence:
    - tag: concept.radioactivity
      weight: 50
    - tag: domain.physics
      weight: 25
    - card: pierre-curie
      weight: 35

constellations:
  - women-in-science
  - radioactivity
```

## Validation obligatoire

Chaque ajout de contenu doit passer par :

```txt
1. Validation du schéma
2. Slugs uniques
3. Références existantes
4. Sources présentes
5. Relations non cassées
6. Découvrabilité simulée
7. Ambiguïtés analysées
8. Review humaine si contenu sensible
```

## Statuts éditoriaux

```txt
draft
needs_sources
reviewed
approved
published
deprecated
```

## Sources

Chaque personnage doit être sourcé.

Types de sources :

```txt
encyclopedia
museum
academic
book
primary_source
institution
article
```

Les sources doivent servir à justifier :

```txt
biographie
dates
relations
citations
images
contexte
```

## Sensibilité historique

Champ recommandé :

```txt
normal
nuanced
sensitive
highly_sensitive
```

Le jeu doit éviter les simplifications excessives. Les personnages controversés doivent être présentés avec nuance.
