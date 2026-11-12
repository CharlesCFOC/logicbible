// Shared by the Node server and release packaging. Everything else is private.
export const publicFiles = new Set([
  'index.html', 'projection.html', 'debate-projection.html', 'evangelism-pilot.html', 'session-admin.html', 'session-admin-bridge.js',
  'styles.css', 'script.js', 'bible-data.js', 'privacy.html', 'terms.html',
  'community-guidelines.html', 'mobile-version.json',
]);
const browserScripts = new Set([
  'core/api.js',
  'features/notes.js',
  'core/account.js',
  'core/formatting.js',
  'features/home.js',
  'features/prayer.js',
  'features/apologetics.js',
  'features/ai.js',
  'features/profile.js',
  'features/navigation.js',
  'features/verse-selection.js',
  'features/reader.js',
  'features/verse-actions.js',
  'features/saved-items.js',
  'navigation.js', 'prayer.js', 'notes.js', 'bible.js', 'profile.js',
  'bible-study-tools.js', 'bible-study-view.js', 'bible-study-chat.js',
]);
export function isPublicFile(filename) {
  if (filename.split('/').some(part => !part || part.startsWith('.')) || filename.includes('\\')) return false;
  return publicFiles.has(filename)
    || (filename.startsWith('scripts/') && browserScripts.has(filename.slice(8)))
    || (/^assets\/.+\.(?:js|json|png|jpe?g|webp|svg|gif|ico|woff2?|mp3|mp4)$/i.test(filename))
    || /^mobile-updates\/(?:latest\.json|[a-f0-9]{64}\.zip)$/.test(filename);
}
