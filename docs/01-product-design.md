# 01 — Product design

## Boucle principale

La boucle principale du jeu est :

```txt
1. Le joueur reçoit des cartes-outils.
2. Il combine des cartes dans l’Atelier.
3. Le moteur évalue les indices.
4. Le joueur découvre un personnage ou reçoit un indice.
5. Le personnage rejoint la collection.
6. La découverte débloque des cartes, packs ou constellations.
7. Le joueur explore de nouveaux chemins historiques.
```

## Écrans principaux

L’application mobile doit être organisée autour de cinq zones :

```txt
Accueil
Atelier
Collection
Constellations
Profil
```

### Accueil

L’accueil doit donner une lecture rapide de la progression :

- progression globale ;
- pack disponible ;
- défi du jour ;
- constellation active ;
- dernière découverte ;
- suggestion non-spoilante.

Exemple de suggestion :

```txt
Tu as plusieurs indices liés aux sciences du XIXe siècle.
```

### Atelier

L’Atelier est l’écran central.

Il contient :

- une zone de combinaison ;
- des slots de cartes ;
- la main du joueur ;
- des filtres ;
- un bouton Tenter ;
- un feedback de proximité ;
- un historique des tentatives.

L’expérience doit être tactile, rapide et agréable.

Interactions souhaitées :

- tap-to-slot en priorité ;
- drag and drop plus tard si utile ;
- retour haptique léger ;
- animations de synergie ;
- feedback clair en cas d’échec.

### Collection

La Collection présente toutes les cartes connues, découvertes ou partiellement révélées.

Filtres :

```txt
Tous
Personnages
Époques
Lieux
Domaines
Concepts
Événements
Œuvres
```

Les personnages non découverts peuvent apparaître sous forme de silhouettes avec des indices partiels.

Exemple :

```txt
???
Rareté : rare
Constellation : Femmes de science
Indices : XXe siècle, ADN, photographie scientifique
```

### Fiche personnage

Une fiche personnage doit être courte au premier regard, puis approfondissable.

Structure :

```txt
Recto :
- illustration
- nom
- dates
- rôle court
- rareté
- constellation(s)

Verso / détail :
- résumé court
- pourquoi cette personne compte
- contexte historique
- cartes liées
- personnages liés
- lieux associés
- sources
```

### Constellations

Les constellations sont des sous-collections thématiques visualisées comme des graphes ou un ciel d’étoiles.

États possibles :

```txt
hidden
revealed
in_progress
completed
mastered
```

Exemples :

```txt
Femmes de science
Égypte ancienne
Transmission philosophique
Routes de la soie
Calcul, code et machines
Droits civiques et résistances
Arts et modernité
Révolutions atlantiques
```

## Packs

Les packs structurent la progression et donnent de nouvelles cartes-outils.

Types :

```txt
starter_pack
era_pack
region_pack
domain_pack
constellation_pack
event_pack
challenge_pack
seasonal_pack
premium_pack
```

Le projet doit éviter une logique agressive de loot boxes. Pour un jeu éducatif, les packs doivent principalement récompenser la progression.

## Progression de difficulté

### Niveau 1

Combinaisons simples :

```txt
époque + lieu + rôle
```

### Niveau 2

Ajout d’un domaine :

```txt
époque + région + domaine + rôle
```

### Niveau 3

Utilisation de personnages déjà découverts :

```txt
personnage + domaine + lieu
```

### Niveau 4

Découvertes transversales :

```txt
concept + événement + personnage lié + région
```

### Niveau 5

Figures rares :

```txt
œuvre précise + relation + période + domaine
```

## Ton pédagogique

Le jeu doit encourager la curiosité. Les échecs ne doivent jamais être simplement punitifs.

Exemples de feedback :

```txt
Tu es proche d’une figure scientifique, mais l’époque est trop vague.
Ces indices pointent vers plusieurs philosophes grecs.
L’indice Égypte ancienne fonctionne, mais XXe siècle crée une contradiction.
```
