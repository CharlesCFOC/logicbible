# Kids Bible illustrations

Genesis uses one original cover per adventure (65 covers). The cover is reused
while reading that adventure; it is not a separate illustration of each scene.
The approved burning-bush pilot belongs to `exodus-04` (God Calls Moses).

## Visual direction

Warm hand-painted storybook illustration, golden light, turquoise skies,
sage foliage and ochre earth. Characters wear modest ancient clothing and
recurring people retain their characteristic clothing and appearance. Images
contain no typography. Difficult narratives use a gentle moment or aftermath,
without graphic violence. God is not portrayed as a human figure.

## Files and loading

- `assets/kids-bible/illustrated/<story-id>.webp`: reading image, up to 960 px wide.
- `assets/kids-bible/illustrated/<story-id>-thumb.webp`: thumbnail, up to 384 px wide.
- Lists and search results load thumbnails lazily. Reading uses the larger image.
- Story identifiers, progress storage keys and content revisions are unchanged.
- All optimized images are included in the offline mobile package.
- `data/kids-bible-art-prompts.json` records generation prompts for future work.

Full-resolution working originals and the local source-path manifest live under
`output/imagegen/genesis/` (excluded from Git and release packaging). Originals
also remain in the image-generation tool's output directory.

To prepare optimized assets from an existing local source manifest:

```sh
python3 scripts/prepare-kids-art.py output/imagegen/genesis/sources.json
npm run verify
```

The preparation script requires Pillow. Generate or edit artwork with the image
generation tool first, then update the manifest before preparing files. Keep
source originals; review the full illustration and its crop in the app.
