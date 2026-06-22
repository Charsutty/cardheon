# Base locale

SQLite est la source de vérité locale de l’application.

- `migrations.ts` crée et versionne le schéma ;
- `seedCatalog.ts` importe le catalogue JSON embarqué dans une version isolée ;
- `catalogRepository.ts` reconstruit le catalogue du moteur et expose le graphe de relations ;
- `progressRepository.ts` persiste la progression et migre l’ancien stockage AsyncStorage ;
- `database.ts` initialise une connexion partagée.

Les cartes, tags, sources, relations, constellations et packs sont normalisés. Les tables de
contenu portent toutes un `catalog_version`, ce qui permet d’activer une nouvelle version sans
écraser les anciennes données ni la progression du joueur.

Le repository fournit aussi les mutations `saveCard`, `saveSource`, `setCardSources`,
`saveRelationship` et `deleteRelationship`. Après une mutation de contenu, appeler
`refreshCatalog()` depuis `useGame()` pour mettre à jour l’état React.
