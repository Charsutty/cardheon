# Première version locale jouable

> Ce document décrit l’état de l’implémentation. La définition exhaustive du produit se trouve dans [`00-product-reference.md`](00-product-reference.md).

La boucle de démonstration permet désormais de :

- sélectionner de deux à cinq cartes-indices dans l'Atelier ;
- lancer une tentative avec le moteur de scoring pondéré ;
- recevoir un indice en cas d'échec, d'ambiguïté ou de piste proche ;
- découvrir le catalogue local de démonstration, avec 25 figures atteignables d’après l’analyseur ;
- fabriquer certaines cartes-outils via des recettes exactes limitées au crafting ;
- conserver dans SQLite la collection, l'XP, les tentatives, les récompenses, les packs et les constellations ;
- charger depuis SQLite le catalogue, les sources et le graphe de relations ;
- persister les déblocages `unlocksToolCardIds` du catalogue local ;
- consulter la collection et réinitialiser la partie depuis le profil.

## Lancement

```bash
corepack pnpm install
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm validate:content
corepack pnpm analyze:discoverability
corepack pnpm mobile:web
```

## Combinaisons de validation

```txt
Radioactivité + France                         -> Marie Curie
Alexandrie + Mathématiques + Égypte ancienne -> Hypatie
Égypte ancienne + Reine                       -> Cléopâtre VII
Méthode socratique + Athènes + Antiquité      -> Socrate
Droits civiques + États-Unis + Pasteur        -> Martin Luther King Jr.
```

Cette version valide la boucle de jeu locale. L'étape suivante consiste à solidifier l’expérience utilisateur, créer les fiches détaillées et élargir le catalogue par paliers contrôlés.

## Garde-fous actuels

```txt
pnpm test                    tests du moteur pur
pnpm validate:content        validation du catalogue local
pnpm analyze:discoverability preuve que les figures sont atteignables
pnpm typecheck               compilation TypeScript app mobile, admin et UI
pnpm lint                    alias de qualité vers le typecheck workspace
```

Dernier état vérifié :

```txt
catalogue valide : 110 cartes, 157 relations
découvrabilité : 25 figures découvertes, 0 bloquée
warnings : 2 cycles potentiels, 40 warnings thématiques à relire côté contenu
```

Les warnings de découvrabilité ne bloquent pas le MVP local actuel. Ils doivent être traités pendant les paliers d’équilibrage de contenu, avant une publication.

## Organisation du code mobile

```txt
apps/mobile/
  app/                         routes Expo Router, sans logique métier
  src/
    components/                composants partagés dans l'application
      layout/
      stats/
    features/                  modules organisés par fonctionnalité
      atelier/
        components/
        hooks/
      collection/
        components/
      discovery/
        components/
      profile/
        components/
    game/                      catalogue, adaptations et calculs de progression
    db/                        migrations, seed et repositories SQLite
    services/                  façades des services locaux
    state/                     orchestration de l'état React
```

Les composants génériques du design system restent dans `packages/ui`. Les composants qui connaissent les règles de Cardhéon restent près de leur fonctionnalité dans `apps/mobile/src/features`.
