import { readFile, realpath } from 'node:fs/promises';
import { resolve, relative, extname, sep } from 'node:path';
import { isPublicFile } from '../public-files.js';

const types = { '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff': 'font/woff',
  '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.zip': 'application/zip' };

export function createStaticHandler(root) {
  return async (req, res) => {
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
    }
    let filename;
    try {
      filename = decodeURIComponent(new URL(req.url, 'http://localhost').pathname).slice(1) || 'index.html';
    } catch { res.writeHead(400); res.end(); return; }
    if (!isPublicFile(filename)) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const base = await realpath(root);
      const target = await realpath(resolve(base, filename));
      const within = relative(base, target);
      if (within.startsWith(`..${sep}`) || within === '..' || !isPublicFile(within.split(sep).join('/'))) {
        res.writeHead(404); res.end('Not found'); return;
      }
      const body = await readFile(target);
      res.writeHead(200, { 'content-type': types[extname(target).toLowerCase()] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(404); res.end('Not found'); }
  };
}
