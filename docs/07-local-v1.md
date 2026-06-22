# Première version locale jouable

> Ce document décrit l’état de l’implémentation. La définition exhaustive du produit se trouve dans [`00-product-reference.md`](00-product-reference.md).

La boucle de démonstration permet désormais de :

- sélectionner de deux à cinq cartes-indices dans l'Atelier ;
- lancer une tentative avec le moteur de scoring pondéré ;
- recevoir un indice en cas d'échec, d'ambiguïté ou de piste proche ;
- découvrir Marie Curie, Hypatie et Cléopâtre VII ;
- conserver dans SQLite la collection, l'XP et le nombre de tentatives ;
- charger depuis SQLite le catalogue, les sources et le graphe de relations ;
- consulter la collection et réinitialiser la partie depuis le profil.

## Lancement

```bash
corepack pnpm install
corepack pnpm typecheck
corepack pnpm test
corepack pnpm mobile:web
```

## Combinaisons de validation

```txt
Radioactivité + France                         -> Marie Curie
Alexandrie + Mathématiques + Égypte ancienne -> Hypatie
Égypte ancienne + Reine                       -> Cléopâtre VII
```

Cette version valide la boucle de jeu locale. L'étape suivante consiste à élargir le catalogue, ajouter un tutoriel et créer les fiches détaillées.

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
