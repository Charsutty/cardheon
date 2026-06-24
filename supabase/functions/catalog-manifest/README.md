# catalog-manifest

Public catalog manifest endpoint.

Etat deploye :

```txt
project: fjbinzflrmlrtgyszgcu
verify_jwt: false
status: ACTIVE
```

Cette fonction est publique parce que le client mobile doit pouvoir verifier la version de catalogue sans session utilisateur.

Response shape:

```json
{
  "catalogVersion": "0.3.0-mvp-local",
  "minimumAppVersion": "0.0.0",
  "catalogChecksum": "sha256:...",
  "assetBaseUrl": "https://...",
  "publishedAt": "2026-06-24T00:00:00.000Z"
}
```

The mobile client may compare this manifest with the bundled/local SQLite catalog,
but must keep working offline when the endpoint is unavailable.

Current behavior when no published catalog exists: returns `404`.
