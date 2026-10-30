# Public-domain Bible library

Project: `onbczidvuhezoouzdrae` (Logic Bible).

| Database ID | Edition | Books | Chapters | Verses |
| --- | --- | ---: | ---: | ---: |
| `kjv` | King James Version, standardized 1769 text | 66 | 1,189 | 31,102 |
| `lsg1910` | Louis Segond 1910 | 66 | 1,189 | 31,170 |

Sources: official eBible verse-per-line downloads, linked from
[KJV](https://ebible.org/find/show.php?id=eng-kjv) and
[LSG 1910](https://ebible.org/find/show.php?id=fraLSG).
The source identifies both as public domain; the KJV notice reserves UK printing rights.
Source URLs, license notices and archive SHA-256 hashes are stored in `scripture_versions`.

## Data and access

- `scripture_versions`: source metadata, expected totals, publication state.
- `scripture_books`: canonical app book codes, English canonical names, order and chapter counts.
- `scripture_chapters`: chapter numbers and verse counts for each edition.
- `scripture_verses`: one row per verse, indexed by `(version_id, book_id, chapter, verse)`.

All four tables enable RLS. Anonymous and authenticated users can only read
published editions; only the server service role can write. An incomplete import
is not public. Publication happens after comparing every stored book, chapter
and verse against the prepared source. Foreign keys and primary keys enforce
references and prevent duplicate verses.

Only the app's 66-book canon is imported; the KJV archive's 14 additional books
are excluded. Source book abbreviations are mapped to the app's existing codes.
VPL text is preserved, including accents, brackets denoting supplied words, and
paragraph signs. The source's own chapter/verse numbering is preserved; do not
assume that the editions have identical verse counts or numbering. Footnotes and
rich typography are outside this plain-text export.

## Reproduce and verify

```sh
python3 scripts/prepare-bible-import.py
node scripts/import-bible-library.mjs
node scripts/import-bible-library.mjs --verify-only
node --test tests/scripture-library.test.mjs
```

Requires Python 3, curl, project Node dependencies, and the server credentials in
`.env.local`. The importer checks the destination project before any write. No
credential is included in the generated files. Archives and prepared data are in
ignored `output/bible-import/`; preparation reuses those archives for reproducibility.
Do not remove them merely to rerun verification. Published editions are never
overwritten by this script. Failed unpublished imports can resume by rerunning.
Import only one process at a time.

The verification report contains row counts and SHA-256 hashes of the complete
read-back data. A committed copy is in `data/bible-library-import.json`.

Schema: `supabase/migrations/20261030214125_scripture_library.sql`, applied to
production through the authenticated SQL editor because the connector lacks
access to this project. This does not register a Supabase CLI migration history
entry: reconcile history before a future `db push`, rather than applying this
CREATE TABLE migration twice.

This import does **not** change the current reader's API routing or the version
selector. Connecting those to the library is a separate application change.

Example query:

```sql
select verse, text from public.scripture_verses
where version_id = 'lsg1910' and book_id = 'GEN' and chapter = 1
order by verse;
```
