# CSS source architecture

The application loads the generated `styles.css` file. Source styles live in these modules:

- `core/` — reset, layout and tokens;
- `components/` — navigation, buttons, cards and shared overlays;
- `pages/` — screen-specific styles;
- `themes/` — theme and background overrides;
- `responsive.css` — viewport and accessibility adaptations.

Edit the source modules, then run `npm run build`. The build uses the manifest order and Lightning CSS to produce the compact browser stylesheet.
