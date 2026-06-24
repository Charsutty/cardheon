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
  catalog-source/    Corpus éditorial YAML complet utilisé par le build local
  catalog.dev.json   Artefact compilé utilisé par l’app, les tests et l’admin
  figures/           Personnages historiques (brouillons YAML non utilisés directement)
  tools/             Cartes-outils (brouillons YAML non utilisés directement)
  constellations/    Collections thématiques (brouillons YAML non utilisés directement)
  packs/             Packs de récompense (brouillons YAML non utilisés directement)
  sources/           Sources historiques
  assets-manifest/   Manifests des images et licences
```

Pendant le MVP technique, le corpus complet vit dans `catalog-source/` et `catalog.dev.json` doit être traité comme un artefact compilé. Les anciens fichiers YAML à la racine (`figures/`, `tools/`, `constellations/`, `packs/`) restent des brouillons historiques et ne sont utilisés que si `catalog-source/` est absent.

Pour régénérer les sources depuis le catalogue courant :

```bash
pnpm export:content-sources
```

Pour recompiler l’artefact jouable depuis les sources :

```bash
pnpm compile:catalog
pnpm validate:content
pnpm analyze:discoverability
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
