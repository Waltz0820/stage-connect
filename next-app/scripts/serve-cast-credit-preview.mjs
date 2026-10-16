import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
const flag = (name) => process.argv.find((arg) => arg.startsWith(`--${name}=`))?.slice(name.length + 3);
if (!flag('file')) throw new Error('Use --file=<generated index.html> [--port=8140]');
const file = resolve(flag('file'));
const port = Number(flag('port') ?? 8140);
const page = await readFile(file);
const server = createServer((req, res) => {
  if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405).end(); return; }
  const path = new URL(req.url, 'http://localhost').pathname;
  if (path === '/favicon.ico') { res.writeHead(204).end(); return; }
  if (!['/', '/index.html'].includes(path)) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; connect-src 'none'; img-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'" });
  res.end(req.method === 'HEAD' ? undefined : page);
});
server.listen(port, '127.0.0.1', () => console.log(`Cast credit preview: http://127.0.0.1:${server.address().port}`));
