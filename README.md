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

## Security and quality checks

Use Node.js 24 and install the locked dependencies with `npm ci`.
`npm run check` checks JavaScript syntax and runs the complete test suite,
including PostgreSQL migration tests in an isolated PGlite database (no live
credentials needed). `npm run verify` additionally builds the web/mobile release
and checks dependency advisories. GitHub Actions runs this on pushes and pull
requests; Vercel builds also require the syntax checks and tests to pass.
Repository branch protection must be configured separately to require the
`verify` job before merging.

The Node server and mobile packaging use the public-file allowlist in
`lib/public-files.js`. Environment files, Git metadata, server sources, build
scripts and tests are not public files. Add new browser assets to that allowlist
when needed. Never serve the repository root with an unrestricted static server.

### Deploying AI usage protection and vote aggregation

**Apply `supabase/migrations/20261030175438_ai_usage_and_vote_summary.sql` to the
application's Supabase project before deploying this code.** It is additive:
existing session-admin passwords and session access are unchanged. The migration
creates service-role-only usage counters and RPCs; browser roles cannot call them.
Applied on 2026-10-30 to the Logic Bible project (`onbczidvuhezoouzdrae`) through
the authenticated Supabase dashboard. Verified on that database: quota acceptance
and rejection, vote aggregation, RLS, and denied direct RPC access for browser
roles. Verification writes were rolled back. The migration remains necessary
when provisioning another environment; do not rerun it on this existing project.

Chat, verse discussions, quizzes, Bible Study and church study AI require a valid
Supabase user session. Existing mobile bundles that do not send the access token
must receive the new web bundle before using these protected endpoints.
Session preparation and activities retain their existing access flow; their AI
calls also consume the global quota and an anonymous caller quota. No raw IP is
stored in the counters.

Each actual provider attempt atomically reserves one call, including retries and
calls from session tools. Cache hits do not spend calls. Defaults are 60 calls per
hour and 200 per UTC day per caller, and 2,000 per UTC day across the application.
Configure `AI_USER_HOURLY_LIMIT`, `AI_USER_DAILY_LIMIT`, and
`AI_GLOBAL_DAILY_LIMIT` on the server. These cap requests, not a precise dollar
amount; configure the provider's spending controls as well. Quota denial returns
429 with `Retry-After`. If the quota database is unavailable or the migration is
missing, new provider calls fail closed with 503. Counters older than two days
are cleaned on the first accepted call of a new UTC day.

Votes are now aggregated inside PostgreSQL instead of loading every user's vote
into Node for every request. The new summary RPC is accessible only to the server.

If the old Node server was reachable by untrusted users, rotate keys previously
stored in `.env.local`; blocking future file reads does not revoke copied keys.

## Code organization

`server.mjs` only loads configuration and starts HTTP. The request handler in
`lib/http/request-handler.js` retains routing, CORS and the common AI auth gate.
Route implementations live in `lib/routes/` (Bible, studies, quizzes, AI, prayers,
accounts, churches and sessions). Provider calls, reference-library retrieval,
JSON parsing and static serving have separate modules under `lib/ai/`,
`lib/bible/` and `lib/http/`. Keep request-specific identities in the existing
AsyncLocalStorage context; never put them in a module-level variable.

Browser code is organized into `scripts/core/` for account sync, API transport and
formatting, `scripts/features/` for screen behavior, and `scripts/bridges/` for the
adapters used by React. `script.js` retains shared state and bootstrap wiring.
This is an incremental migration: these legacy files still share a classic-script
scope. Bridge initializers execute at their original bootstrap points, preserving
initialization order. Do not add top-level side effects to the declaration files.

`scripts/legacy-manifest.json` specifies source order. `npm run build:legacy`
combines those sources into `assets/legacy.js`, so organizing the code does not
add dozens of network requests. Edit source files, never the generated bundle.
Run `npm run build` after changes before using `npm start` (or use `npm run dev`).
ESLint checks the combined scope for missing identifiers and duplicate keys as
well as checking the extracted server modules.

The React build uses ES modules. Kids Bible, Prayer, AI, Debate, church/session
screens and moderation load on first visit through `mountDeferredScreen` and
stay mounted afterward to preserve their state. The small shared prayer card is
separate so Profile does not eagerly pull in the prayer globe. HTML entry points
must keep `type="module"` on the React bundle. Build packaging includes the
chunk files for offline Android use. `scripts/check-bundle.mjs` fails the build
if a heavy screen becomes part of the initial static module graph again.
