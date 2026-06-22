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
  figures/           Personnages historiques
  tools/             Cartes-outils
  constellations/    Collections thématiques
  packs/             Packs de récompense
  sources/           Sources historiques
  assets-manifest/   Manifests des images et licences
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
