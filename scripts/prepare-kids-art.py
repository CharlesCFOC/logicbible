"""Prepare optimized Kids Bible images from an imagegen source manifest.

Usage: python3 scripts/prepare-kids-art.py output/imagegen/genesis/sources.json
Requires Pillow. Originals are retained under output/imagegen/genesis/originals/.
"""
import json
import re
import shutil
import sys
from pathlib import Path
from PIL import Image, ImageOps

root = Path(__file__).resolve().parent.parent
sources = json.loads(Path(sys.argv[1]).read_text())
originals = root / 'output/imagegen/genesis/originals'
destination = root / 'assets/kids-bible/illustrated'
originals.mkdir(parents=True, exist_ok=True)
destination.mkdir(parents=True, exist_ok=True)
for story_id, source in sources.items():
    if not re.fullmatch(r'(genesis|exodus)-[a-z0-9-]+', story_id):
        raise ValueError(f'Invalid story identifier: {story_id}')
    original = originals / f'{story_id}.png'
    if not original.exists():
        shutil.copy2(source, original)
    with Image.open(source) as image:
        image = ImageOps.exif_transpose(image).convert('RGB')
        for suffix, width, quality in [('', 960, 80), ('-thumb', 384, 75)]:
            target = destination / f'{story_id}{suffix}.webp'
            if target.exists() and target.stat().st_mtime >= max(Path(source).stat().st_mtime, Path(__file__).stat().st_mtime):
                continue
            resized = image.copy()
            resized.thumbnail((width, width), Image.Resampling.LANCZOS)
            resized.save(target, 'WEBP', quality=quality, method=6)
print(f'Prepared {len(sources)} illustrations, each with a reading image and thumbnail.')
