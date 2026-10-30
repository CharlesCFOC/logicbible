import globals from 'globals';

export default [{
  files: ['server.mjs', 'lib/routes/**/*.js', 'lib/server/**/*.js', 'lib/http/**/*.js', 'lib/ai/{provider,doctrine,safety}.js', 'lib/bible/provider.js'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'module', globals: globals.node },
  rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-args': 'error', 'no-dupe-keys': 'error' },
}, {
  files: ['assets/legacy.js'],
  languageOptions: { ecmaVersion: 'latest', sourceType: 'script', globals: { ...globals.browser, BOOKS: 'readonly', LOCAL_VERSIONS: 'readonly', LOCAL_BIBLE: 'readonly' } },
  rules: { 'no-undef': 'error', 'no-unreachable': 'error', 'no-dupe-args': 'error', 'no-dupe-keys': 'error' },
}];
