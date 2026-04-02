/**
 * VitaPlate Frontend Static Server
 * Zero dependencies — uses Node.js built-ins only.
 * Serves the Vite build output with SPA fallback to index.html.
 */
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST      = path.join(__dirname, 'dist');
const PORT      = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript',
  '.css':  'text/css',
  '.json': 'application/json',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg':  'image/svg+xml',
  '.ico':  'image/x-icon',
  '.woff': 'font/woff',
  '.woff2':'font/woff2',
  '.ttf':  'font/ttf',
  '.webp': 'image/webp',
  '.txt':  'text/plain',
  '.xml':  'application/xml',
  '.webmanifest': 'application/manifest+json',
};

const server = http.createServer((req, res) => {
  // Strip query strings
  const urlPath  = req.url.split('?')[0];
  let   filePath = path.join(DIST, urlPath);

  // Security: prevent path traversal
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403);
    return res.end('Forbidden');
  }

  // Try the exact path, then index.html (SPA fallback)
  const tryPaths = [
    filePath,
    path.join(filePath, 'index.html'),
    path.join(DIST, 'index.html'),  // SPA catch-all
  ];

  for (const p of tryPaths) {
    if (fs.existsSync(p) && fs.statSync(p).isFile()) {
      const ext      = path.extname(p).toLowerCase();
      const mimeType = MIME[ext] || 'application/octet-stream';

      // Cache: long for assets (hashed filenames), short for HTML
      const isAsset = urlPath.startsWith('/assets/');
      res.setHeader('Cache-Control', isAsset
        ? 'public, max-age=31536000, immutable'
        : 'no-cache');
      res.setHeader('Content-Type', mimeType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.writeHead(200);
      fs.createReadStream(p).pipe(res);
      return;
    }
  }

  // Should never reach here — index.html always exists
  res.writeHead(404);
  res.end('Not found');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`🌐 VitaPlate frontend serving on port ${PORT}`);
  console.log(`📁 Serving from: ${DIST}`);
});

process.on('SIGTERM', () => {
  server.close(() => process.exit(0));
});
