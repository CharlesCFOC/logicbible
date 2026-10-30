import { readdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
const files = ['server.mjs', 'script.js', 'session-admin-bridge.js', 'vite.bridge.config.js'];
for (const directory of ['api', 'lib', 'scripts', 'src', 'tests']) {
  files.push(...readdirSync(directory, { recursive: true })
    .filter(name => /\.(?:mjs|js)$/.test(name)).map(name => `${directory}/${name}`));
}
for (const filename of files) {
  const result = spawnSync(process.execPath, ['--check', filename], { stdio: 'inherit' });
  if (result.status !== 0) process.exit(result.status || 1);
}
console.log(`Syntax checked: ${files.length} JavaScript files. JSX is checked by the Vite build.`);
