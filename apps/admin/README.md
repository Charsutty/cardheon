# Cardhéon Admin

Application locale read-only d’audit du graphe de contenu.

```bash
pnpm admin
```

La page `/graph` charge `content/catalog.dev.json` et permet :

- d’explorer les cartes, relations, règles discovery, recettes et constellations ;
- de filtrer, focaliser et exporter le graphe visible ;
- d’inspecter les chemins entre deux nœuds ;
- de valider des combinaisons de découverte via `attemptDiscovery` ;
- d’auditer la progression depuis le starter pack et les anomalies de contenu.

Build de production :

```bash
pnpm admin:build
```
