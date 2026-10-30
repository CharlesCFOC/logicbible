"""Download public-domain eBible VPL data and prepare the app's 66-book canon.

Usage: python3 scripts/prepare-bible-import.py
Only reference codes change. Text (including brackets/paragraph signs) is preserved.
"""
import hashlib
import io
import json
from pathlib import Path
import re
import subprocess
import zipfile
from datetime import datetime, timezone

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/bible-import'
ALIASES = dict(SOL='SNG', EZE='EZK', JOE='JOL', NAH='NAM', MAR='MRK',
               JOH='JHN', PHI='PHP', JAM='JAS', **{'1JO': '1JN', '2JO': '2JN', '3JO': '3JN'})
APOCRYPHA = {'TOB', 'JDT', 'ESG', 'WIS', 'SIR', 'BAR', 'PRA', 'SUS', 'BEL', '1MA', '2MA', '1ES', 'PRM', '4ES'}
SOURCES = [('kjv', 'eng-kjv', 'King James Version', 'en', 31102),
           ('lsg1910', 'fraLSG', 'Louis Segond 1910', 'fr', 31170)]


def prepare():
    OUT.mkdir(parents=True, exist_ok=True)
    books = re.findall(r'\{ id: "([A-Z0-9]+)", name: "([^"]+)", chapters: (\d+) \}',
                       (ROOT / 'bible-data.js').read_text())
    assert len(books) == 66
    canon = {b for b, _, _ in books}
    manifest = []
    for version, source, name, language, expected in SOURCES:
        url = f'https://ebible.org/Scriptures/{source}_vpl.zip'
        archive_path = OUT / f'{source}_vpl.zip'
        if not archive_path.exists():
            subprocess.run(['curl', '--fail', '--location', '--silent', '--show-error',
                            '--max-time', '120', url, '--output', str(archive_path)], check=True)
        archive = archive_path.read_bytes()
        text = zipfile.ZipFile(io.BytesIO(archive)).read(f'{source}_vpl.txt').decode('utf-8-sig')
        verses, chapters, seen = [], {}, set()
        for line in text.splitlines():
            if not line.strip():
                continue
            match = re.fullmatch(r'([A-Z0-9]+) (\d+):(\d+) (.+)', line)
            assert match, f'Unexpected VPL line: {line[:60]}'
            book, chapter, verse, content = match.groups()
            if book in APOCRYPHA:
                assert version == 'kjv'
                continue
            book = ALIASES.get(book, book)
            assert book in canon
            chapter, verse = int(chapter), int(verse)
            key = (book, chapter, verse)
            assert key not in seen and content.strip() and chapter > 0 and verse > 0
            seen.add(key)
            numbers = chapters.setdefault((book, chapter), [])
            assert verse == len(numbers) + 1, f'Gap or duplicate: {key}'
            numbers.append(verse)
            verses.append(dict(version_id=version, book_id=book, chapter=chapter, verse=verse, text=content))
        assert len(verses) == expected and len(chapters) == 1189
        book_rows = []
        for position, (book, title, _) in enumerate(books, 1):
            numbers = sorted(c for b, c in chapters if b == book)
            assert numbers == list(range(1, len(numbers) + 1)) and numbers
            book_rows.append(dict(version_id=version, book_id=book, name=title,
                                  position=position, chapter_count=len(numbers)))
        chapter_rows = [dict(version_id=version, book_id=b, chapter=c, verse_count=len(v))
                        for (b, c), v in chapters.items()]
        metadata = dict(id=version, name=name, language=language, source_url=url,
                        license_url=f'https://ebible.org/{source}/copyright.htm',
                        license='Public domain; KJV UK printing rights reserved' if version == 'kjv' else 'Public domain',
                        source_sha256=hashlib.sha256(archive).hexdigest(),
                        imported_at=datetime.now(timezone.utc).isoformat(),
                        book_count=66, chapter_count=len(chapters), verse_count=len(verses))
        payload = dict(version=metadata, books=book_rows, chapters=chapter_rows, verses=verses)
        (OUT / f'{version}.json').write_text(json.dumps(payload, ensure_ascii=False), encoding='utf-8')
        manifest.append(metadata)
        print(f'{name}: 66 books, {len(chapters)} chapters, {len(verses)} verses')
    (OUT / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n')


if __name__ == '__main__':
    prepare()
