import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../_site/', import.meta.url));
const mime = { '.html': 'text/html; charset=utf-8', '.htm': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.pdf': 'application/pdf' };
const prefix = '/direito-2026/';
const server = http.createServer(async (request, response) => {
  try {
    const url = new URL(request.url, 'http://localhost');
    if (url.pathname === '/' || url.pathname === '/direito-2026') {
      response.writeHead(302, { Location: prefix }); return response.end();
    }
    if (!url.pathname.startsWith(prefix)) { response.writeHead(404); return response.end('Não encontrado'); }
    const requested = decodeURIComponent(url.pathname.slice(prefix.length));
    let target = path.resolve(root, requested || '.');
    const relative = path.relative(root, target);
    if (relative.startsWith('..') || path.isAbsolute(relative)) { response.writeHead(403); return response.end(); }
    if ((await stat(target)).isDirectory()) target = path.join(target, 'index.html');
    const content = await readFile(target);
    response.writeHead(200, { 'Content-Type': mime[path.extname(target).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(content);
  } catch {
    response.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    response.end('Página não encontrada. Execute npm run build antes de abrir a prévia.');
  }
});
server.listen(4173, '127.0.0.1', () => console.log('Prévia: http://127.0.0.1:4173/direito-2026/'));
