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

## Prayer Community moderation

Prayer requests are visible immediately. Users can report a request, and a moderator can review the report or hide the request from the Admin review page. After migration 009, add a trusted moderator in the Supabase SQL editor (replace the value with their Auth user UUID):

```sql
insert into public.app_moderators (user_id)
values ('YOUR_AUTH_USER_UUID');
```

The moderator will see the review queue in Prayer room after signing in. Users can report a post or hide another author; reports are visible only to moderators.

Data model included in the initial schema:

- `profiles`
- `user_preferences`
- `user_topic_progress`
- `user_saved_items`
- `ai_conversations`

## Intercession prayer journal

Brother AI uses prewritten prayers from `public.intercession_prayer_lines`: 12 messages per focus, published every 10 seconds against the shared 10-minute session clock. The journal shows earlier messages when someone joins late and preserves their scroll position while they read the history.

For a new Supabase project, run [the journal migration](supabase/migrations/20261014185525_intercession_prayer_journal.sql), then seed the catalogue using the server credentials in `.env.local`:

```bash
npm run seed:intercession-journal
```

The seed command fills missing messages and preserves existing database edits. Edit `body` in the Supabase table to adjust an individual prayer; `sequence` runs from 0 to 11 within each `focus_id`. Updated content is loaded when the journal opens or the next session begins.

The initial catalogue comes from [intercession-petitions.json](data/prayer/intercession-petitions.json). To rebuild it, run `npm run build:intercession-journal`. Use `npm run seed:intercession-journal -- --replace` only when intentionally replacing the stored prayers with that rebuilt catalogue.

## How Bible versions work

- `KJV` is the local/offline sample in `bible-data.js`.
- When `API_BIBLE_KEY` is present, `server.mjs` calls API.Bible from the backend.
- The browser calls `/api/bible/versions` to list available English Bible versions from your API.Bible account.
- The browser calls `/api/bible/chapter?bibleId=...&bookId=JHN&chapter=15` to load a chapter.
- The API key never goes to the frontend.

## Original Greek and Hebrew

The Greek and Hebrew word data comes from [STEPBible-Data](https://github.com/STEPBible/STEPBible-Data).

To regenerate it:

```bash
npm run import:step
```

The importer clones the STEP data into `.cache/STEPBible-Data`, reads the TAGNT and TAHOT files, and writes `data/original-language.json`.

If you already have a local clone:

```bash
npm run import:step -- --source=/path/to/STEPBible-Data
```

The browser calls `/api/original-language?bookId=GAL&chapter=6&verse=6` when the verse action sheet opens `Greek` or `Hebrew`.

## Christian reference library

The five supplied Christian books are stored in [`data/doctrine`](data/doctrine), with `manifest.json` indexing their chapters. The general Brother AI chat performs a lightweight local relevance search over the 64 chapters and sends only the best matching excerpts to OpenAI as optional reference context. The books are not injected into unrelated answers and are treated as source material, not as system instructions.
