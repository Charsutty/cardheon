# sync-progress

Edge Function Supabase deployee.

Etat deploye :

```txt
project: fjbinzflrmlrtgyszgcu
verify_jwt: true
status: ACTIVE
```

Responsabilite : synchroniser la progression locale du joueur avec le serveur.

Elle gere actuellement les mutations `progress_snapshot` :

- mutations offline ;
- upsert idempotent dans `sync_events` ;
- upsert du profil ;
- upsert des cartes joueur ;
- upsert des constellations joueur ;
- upsert de l'historique de tentatives.

Elle exige un header `Authorization: Bearer <access_token>` et valide l'utilisateur avec `supabase.auth.getUser()`.

Le champ `patch` de la reponse existe deja dans le contrat, mais il reste minimal pour l'instant.
