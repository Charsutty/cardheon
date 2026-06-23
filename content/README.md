# Content

Ce dossier contient le corpus jouable de Cardhéon.

Pendant le MVP, le contenu reste dans le monorepo pour faciliter les changements simultanés entre :

- schémas de contenu ;
- moteur de découverte ;
- scripts de validation ;
- app mobile.

Quand le format sera stable, ce dossier pourra être extrait dans un repo séparé `cardheon-content`, puis réintégré comme submodule Git.

## Structure

```txt
content/
  catalog.dev.json   Catalogue actif compilé utilisé par l’app et le moteur
  figures/           Personnages historiques (brouillons YAML non utilisés directement)
  tools/             Cartes-outils (brouillons YAML non utilisés directement)
  constellations/    Collections thématiques (brouillons YAML non utilisés directement)
  packs/             Packs de récompense (brouillons YAML non utilisés directement)
  sources/           Sources historiques
  assets-manifest/   Manifests des images et licences
```

Pendant le MVP technique, `catalog.dev.json` est le catalogue unique de vérité. Les fichiers YAML dans `figures/`, `tools/`, `constellations/` et `packs/` sont des brouillons structurants qui serviront de base au pipeline YAML → JSON plus tard. Pour régénérer le catalogue actif à partir du script de test, exécutez :

```bash
pnpm generate:test-catalog
```

## Règle

Tout contenu publié doit être :

```txt
sourcé
validé
simulé
reviewed ou approved
versionné
```
