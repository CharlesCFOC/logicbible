# Think Bible

Local prototype with a real Bible reader data layer.

## Run

```bash
npm run dev
```

The production build now compiles the CSS modules and the React bridge before starting the server. React screens are being migrated incrementally while the remaining legacy screens stay available during the transition.

Open:

```txt
http://localhost:4000/
```

## Android automatic web updates

Install the APK with native version `1.1` once to enable automatic web updates.
It checks `https://logicbible.vercel.app/mobile-updates/latest.json` on startup
and when returning to the foreground (at most once every ten minutes).
Updates download in the background and apply on the next cold start; the app
keeps its local bundle when offline. A SHA-256 checksum verifies each download.
A bundle that fails to confirm startup within 15 seconds rolls back and is blocked.
New builds include a `builtAt` timestamp. The updater rejects older or undated
publications so a fresh APK cannot be replaced by an outdated hosted bundle.

`npm run build:updates` generates the website, an update ZIP, and its manifest in
`dist/`. Vercel runs this through `vercel-build`. Publish the code to the production
site to make an update available; saving a local file alone does not publish it.
The existing APKs without the updater cannot receive these updates.

HTML, CSS, JavaScript, and assets can update this way. Native/plugin changes require
a new APK: increase Android `versionCode` and `versionName`, and change
`mobile-update.config.json` `nativeVersion` to match. Existing APKs reject bundles
for a different native version. `npm run android:sync` prepares bundled assets
without including the update ZIP in the APK.

## Bible API key

Create `.env.local` beside `server.mjs`:

```bash
cp .env.local.example .env.local
```

Then add your API.Bible key:

```env
API_BIBLE_KEY=your_key_here
```

Restart `npm run dev` after changing `.env.local`.

## Supabase setup

The project is now prepared for Supabase.

Add these variables in `.env.local`:

```env
SUPABASE_URL=your_project_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Recommended order:

1. Create a Supabase project.
2. Run the SQL files in numerical order, from [supabase/001_init.sql](supabase/001_init.sql) through [supabase/009_family_safety_and_prayer_moderation.sql](supabase/009_family_safety_and_prayer_moderation.sql).
3. Fill `.env.local`.
4. Restart `npm run dev`.

Files added for the backend foundation:

- [lib/supabase/client.js](lib/supabase/client.js)
- [lib/supabase/server.js](lib/supabase/server.js)
- [supabase/001_init.sql](supabase/001_init.sql)
- [supabase/002_prayers.sql](supabase/002_prayers.sql)
- [supabase/003_user_sync.sql](supabase/003_user_sync.sql)
- [supabase/004_profile_details.sql](supabase/004_profile_details.sql)
- [supabase/005_prayer_metadata.sql](supabase/005_prayer_metadata.sql)
- [supabase/006_private_prayer_board.sql](supabase/006_private_prayer_board.sql)
- [supabase/007_prayer_request_titles.sql](supabase/007_prayer_request_titles.sql)
- [supabase/008_prayer_toggle.sql](supabase/008_prayer_toggle.sql)
- [supabase/009_family_safety_and_prayer_moderation.sql](supabase/009_family_safety_and_prayer_moderation.sql)

## Mon Église — Bible Study Live

L’espace Mon Église comprend les adhésions et rôles par église, les brouillons,
la duplication, les notes privées, les supports privés, l’import de notes en PDF
ou image, la génération et la traduction assistées par IA, les quiz, les sessions
synchronisées, la projection web, la participation anonyme par lien, les scores,
le replay et les traductions personnelles. Les propositions IA restent en
aperçu jusqu’à leur application au brouillon. Les réponses correctes restent
séparées des données visibles aux participants.

Pour activer ces fonctions, configurez `SUPABASE_URL`, `SUPABASE_ANON_KEY` et
`SUPABASE_SERVICE_ROLE_KEY`, ainsi que `OPENAI_API_KEY` pour les fonctions IA.
Appliquez les migrations datées dans `supabase/migrations/` par ordre
chronologique après les migrations Supabase déjà utilisées par l’application.
Les fichiers de cours vont dans un bucket Storage privé, avec des liens signés
à durée limitée. Aucune migration n’est appliquée automatiquement par le build.

Le rôle d’administrateur global doit être défini dans `app_metadata.role` avec la
valeur `global_admin`, côté serveur ou dans l’administration Supabase. Les
enseignants et gestionnaires peuvent lancer une session; les visiteurs reçoivent
un lien limité à la session active et n’obtiennent aucun accès aux archives.
Le lien de projection expire avec la session. L’URL de participation visiteur est
accessible depuis le panneau de session active.
