/*
  Minimal API + static server (no deps) for QRMURALLA
  - Serves static files from cwd
  - Exposes /api/config, /api/today, /api/products
  - Sources data from:
      BACKEND_MODE=fs | http
      fs:   BACKEND_FS_PATH=/absolute/or/relative/path (expects config.json, today.json, products.json)
      http: BACKEND_HTTP_BASE=https://example.com, optional *_PATH overrides
  - Falls back to local assets/data/*.json if source unavailable
  Requires Node 18+ (global fetch).
*/

const http = require('http');
const { readFile, stat } = require('fs/promises');
const { createReadStream } = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT) || 8000;
const HOST = process.env.HOST || '127.0.0.1';

const MODE = (process.env.BACKEND_MODE || '').toLowerCase(); // 'fs' | 'http'
const FS_PATH = process.env.BACKEND_FS_PATH || path.join(process.cwd(), 'assets', 'data');
const HTTP_BASE = process.env.BACKEND_HTTP_BASE || '';
const HTTP_CONFIG_PATH = process.env.BACKEND_HTTP_CONFIG_PATH || '/api/config';
const HTTP_TODAY_PATH = process.env.BACKEND_HTTP_TODAY_PATH || '/api/today';
const HTTP_PRODUCTS_PATH = process.env.BACKEND_HTTP_PRODUCTS_PATH || '/api/products';

const MIME = new Map(Object.entries({
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
}));

function send(res, status, body, headers = {}) {
  res.writeHead(status, { 'Cache-Control': 'no-store', ...headers });
  if (body === undefined || body === null) return res.end();
  if (typeof body === 'string' || Buffer.isBuffer(body)) return res.end(body);
  res.end(JSON.stringify(body));
}

async function serveStatic(req, res) {
  let pathname = url.parse(req.url).pathname || '/';
  if (pathname === '/') pathname = '/index.html';
  const file = path.join(process.cwd(), pathname.replace(/^\/+/, ''));
  try {
    const st = await stat(file);
    if (st.isDirectory()) return false;
    const ext = path.extname(file).toLowerCase();
    const type = MIME.get(ext) || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
    createReadStream(file).pipe(res);
    return true;
  } catch (e) {
    return false;
  }
}

async function fetchJSON(input, init) {
  const r = await fetch(input, { cache: 'no-store', ...init });
  if (!r.ok) throw new Error('HTTP ' + r.status);
  return r.json();
}

async function fsJSON(file) {
  const p = path.isAbsolute(file) ? file : path.join(FS_PATH, file);
  const buf = await readFile(p);
  return JSON.parse(buf.toString('utf-8'));
}

function normalizeTag(t) { return String(t || '').trim().toLowerCase(); }

function normalizeProduct(p) {
  return {
    id: p.id ?? p._id ?? String(p.name || '').toLowerCase().replace(/\s+/g, '-'),
    name: p.name || 'Producto',
    description: p.description || p.desc || '',
    price: p.price ?? p.precio ?? null,
    image: p.image || p.img || '',
    instagram: p.instagram || p.ig || '',
    tags: Array.isArray(p.tags) ? p.tags.map(normalizeTag) : [],
  };
}

function normalizeToday(data) {
  const date = data.date || new Date().toISOString().slice(0, 10);
  const items = Array.isArray(data.items) ? data.items : [];
  return { date, items: items.map(normalizeProduct) };
}

async function getConfig() {
  // Try mode source
  try {
    if (MODE === 'fs') return await fsJSON('config.json');
    if (MODE === 'http' && HTTP_BASE) return await fetchJSON(new URL(HTTP_CONFIG_PATH, HTTP_BASE));
  } catch (e) {}
  // Fallback to local asset
  try { return await fsJSON(path.join(process.cwd(), 'assets', 'data', 'config.json')); } catch (e) {}
  return {};
}

async function getToday() {
  try {
    if (MODE === 'fs') return normalizeToday(await fsJSON('today.json'));
    if (MODE === 'http' && HTTP_BASE) return normalizeToday(await fetchJSON(new URL(HTTP_TODAY_PATH, HTTP_BASE)));
  } catch (e) {}
  try { return normalizeToday(await fsJSON(path.join(process.cwd(), 'assets', 'data', 'today.json'))); } catch (e) {}
  return normalizeToday({ date: new Date().toISOString().slice(0, 10), items: [] });
}

async function getProducts() {
  try {
    if (MODE === 'fs') return (await fsJSON('products.json')).map(normalizeProduct);
    if (MODE === 'http' && HTTP_BASE) return (await fetchJSON(new URL(HTTP_PRODUCTS_PATH, HTTP_BASE))).map(normalizeProduct);
  } catch (e) {}
  try { return (await fsJSON(path.join(process.cwd(), 'assets', 'data', 'products.json'))).map(normalizeProduct); } catch (e) {}
  return [];
}

const server = http.createServer(async (req, res) => {
  const { pathname } = url.parse(req.url);

  // API routes
  if (pathname === '/api/config' && req.method === 'GET') {
    const data = await getConfig();
    return send(res, 200, data, { 'Content-Type': 'application/json; charset=utf-8' });
  }
  if (pathname === '/api/today' && req.method === 'GET') {
    const data = await getToday();
    return send(res, 200, data, { 'Content-Type': 'application/json; charset=utf-8' });
  }
  if (pathname === '/api/products' && req.method === 'GET') {
    const data = await getProducts();
    return send(res, 200, data, { 'Content-Type': 'application/json; charset=utf-8' });
  }

  // Static files
  if (await serveStatic(req, res)) return;
  // Not found
  send(res, 404, 'Not Found');
});

server.listen(PORT, HOST, () => {
  const src = MODE === 'fs' ? `fs:${FS_PATH}` : MODE === 'http' ? `http:${HTTP_BASE}` : 'fallback:assets/data';
  console.log(`QRMURALLA server listening on http://${HOST}:${PORT} (source ${src})`);
});

