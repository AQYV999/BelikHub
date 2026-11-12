import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { METRICS, SPRINGS } from './assets/springs-seed.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = __dirname;

const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.webp': 'image/webp',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.mp4': 'video/mp4',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const BLOCKED_TOP_DIRS = new Set(['api', 'lib', 'data', 'node_modules', 'playwright-report', 'test-results']);
const BLOCKED_FILES = new Set([
  'server.mjs',
  'playwright-audit.mjs',
  'package.json',
  'package-lock.json',
  'vercel.json',
  'eslint.config.js',
  'firebase.json',
  'firestore.rules',
  'firestore.indexes.json',
  'storage.rules',
  'README.md'
]);

function isBlockedPath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.some((seg) => seg.startsWith('.') || /\.bak(?:\.|$)/i.test(seg))) {
    return true;
  }
  if (segments.length > 0 && BLOCKED_TOP_DIRS.has(segments[0])) {
    return true;
  }
  if (segments.length === 1 && BLOCKED_FILES.has(segments[0])) {
    return true;
  }
  return false;
}

http.createServer((req, res) => {
  let pathname;
  try {
    const parsed = new URL(req.url || '/', 'http://127.0.0.1');
    pathname = decodeURIComponent(parsed.pathname);
  } catch {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad request');
  }

  if (pathname.includes('\0')) {
    res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Bad request');
  }

  if (pathname === '/api' || pathname.startsWith('/api/')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    if (req.method === 'GET' && pathname === '/api/health') {
      res.writeHead(200);
      return res.end(JSON.stringify({ ok: true, configured: false, mode: 'local-preview' }));
    }
    if (req.method === 'GET' && pathname === '/api/springs') {
      res.writeHead(200);
      return res.end(JSON.stringify({ metrics: METRICS, source: 'seed', springs: SPRINGS }));
    }
    if (req.method === 'GET' && pathname === '/api/stats') {
      res.writeHead(200);
      return res.end(JSON.stringify({
        totalApproved: 48,
        byType: {
          'Restorasi Mata Air': 16,
          'Penanaman Pohon': 1800,
          'Pembangunan Rorak': 142
        },
        source: 'seed'
      }));
    }
    if (req.method === 'GET' && pathname === '/api/reports') {
      res.writeHead(200);
      return res.end(JSON.stringify({ reports: [], count: 0, source: 'local-preview' }));
    }
    res.writeHead(503);
    return res.end(JSON.stringify({
      error: 'Layanan backend memerlukan koneksi Vercel & Firebase.',
      offline: true
    }));
  }

  if (isBlockedPath(pathname)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Not found');
  }

  const relativePath = pathname.replace(/^\/+/, '');
  let file = path.resolve(root, relativePath);
  if (!file.startsWith(root + path.sep) && file !== root) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) {
    file = path.join(file, 'index.html');
  }

  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    if (path.extname(pathname)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Not found');
    }
    file = path.join(root, 'index.html');
  }

  res.writeHead(200, {
    'Content-Type': types[path.extname(file).toLowerCase()] || 'application/octet-stream'
  });
  const stream = fs.createReadStream(file);
  stream.on('error', () => {
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    res.end('Internal server error');
  });
  stream.pipe(res);
}).listen(4173, '127.0.0.1', () => {
  console.log('Static server on http://127.0.0.1:4173');
});
