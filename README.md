# Brother Bible AI

Local prototype with a real Bible reader data layer.

## Run

```bash
npm run dev
```

Open:

```txt
http://localhost:4000/
```

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
2. Run the SQL in [supabase/001_init.sql](supabase/001_init.sql).
3. Fill `.env.local`.
4. Restart `npm run dev`.

Files added for the backend foundation:

- [lib/supabase/client.js](lib/supabase/client.js)
- [lib/supabase/server.js](lib/supabase/server.js)
- [supabase/001_init.sql](supabase/001_init.sql)

Data model included in the initial schema:

- `profiles`
- `user_preferences`
- `user_topic_progress`
- `user_saved_items`
- `ai_conversations`

## How Bible versions work

- `KJV` and `WEB` are local/offline samples in `bible-data.js`.
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
