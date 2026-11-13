import 'dotenv/config';
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';

const PORT = Number(process.env.PORT || 8787);
const DIST = resolve('dist');
const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon'
};

function json(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify(body));
}

async function parseBody(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk.toString();
    if (raw.length > 32000) throw Object.assign(new Error('Request is too large.'), { status: 413 });
  }
  try { return JSON.parse(raw || '{}'); }
  catch { throw Object.assign(new Error('Request must be valid JSON.'), { status: 400 }); }
}

async function plan(req, res) {
  let body;
  try { body = await parseBody(req); }
  catch (error) { return json(res, error.status || 400, { error: error.message }); }

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const mode = typeof body.mode === 'string' ? body.mode : 'game';
  const modes = {
    game: 'Game Studio',
    code: 'Code Studio',
    web: 'Web Studio',
    cyber: 'Cyber Lab',
    learn: 'Learn / ICT Studio'
  };

  if (!prompt) return json(res, 400, { error: 'Add a project description first.' });
  if (prompt.length > 4000) return json(res, 400, { error: 'Keep your prompt under 4,000 characters.' });
  if (!modes[mode]) return json(res, 400, { error: 'Choose a supported workspace.' });

  const key = process.env.NEXUS_AI_API_KEY;
  if (!key) {
    return json(res, 503, {
      code: 'AI_NOT_CONFIGURED',
      error: 'The NEXUS server is running, but no AI API key is configured. Add NEXUS_AI_API_KEY to the server environment to enable AI planning.'
    });
  }

  const base = (process.env.NEXUS_AI_BASE_URL || 'https://api.openai.com/v1').replace(/\/+$/, '');
  const model = process.env.NEXUS_AI_MODEL || 'gpt-4o-mini';
  const system = [
    'You are the planning engine for NEXUS, a practical software creation workspace.',
    'Turn the user idea into a clear, buildable blueprint. Do not claim files were created or code was executed.',
    'Use Markdown sections: Project summary, Core features, Technical approach, Build milestones, First test.',
    'Make sensible assumptions and call them out. Prefer maintainable, accessible, mobile-friendly designs.',
    'Cyber Lab requests must stay defensive and authorized, using toy examples and safe lab environments only.',
    'For games, include gameplay loop, controls, scenes, assets, and performance.',
    'For code and web, include architecture, key files, data flow, and validation.',
    'For Learn / ICT, make the result educational and age-appropriate.'
  ].join(' ');

  try {
    const response = await fetch(base + '/chat/completions', {
      method: 'POST',
      headers: { authorization: 'Bearer ' + key, 'content-type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.4,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: 'Workspace: ' + modes[mode] + '\nProject idea: ' + prompt }
        ]
      }),
      signal: AbortSignal.timeout(60000)
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return json(res, 502, { error: data?.error?.message || 'The AI provider returned an error.' });
    const result = data?.choices?.[0]?.message?.content;
    if (typeof result !== 'string' || !result.trim()) return json(res, 502, { error: 'The AI provider returned an empty plan.' });
    return json(res, 200, {
      title: prompt.length > 48 ? prompt.slice(0, 45).trimEnd() + '...' : prompt,
      plan: result,
      model,
      mode
    });
  } catch (error) {
    return json(res, 502, {
      error: error.name === 'TimeoutError'
        ? 'The AI request timed out. Try again.'
        : 'Could not reach the AI provider. Check the server configuration.'
    });
  }
}

async function staticFile(pathname, res) {
  let path;
  try { path = decodeURIComponent(pathname); } catch { path = '/'; }
  const relative = path === '/' ? 'index.html' : path.replace(/^\/+/, '');
  const target = resolve(DIST, relative);
  if (target !== DIST && !target.startsWith(DIST + sep)) {
    res.writeHead(403); return res.end('Forbidden');
  }
  try {
    const info = await stat(target);
    if (!info.isFile()) throw new Error('Not a file');
    const content = await readFile(target);
    res.writeHead(200, {
      'content-type': TYPES[extname(target)] || 'application/octet-stream',
      'cache-control': extname(target) === '.html' ? 'no-cache' : 'public, max-age=3600'
    });
    return res.end(content);
  } catch {
    try {
      const html = await readFile(resolve(DIST, 'index.html'));
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(html);
    } catch {
      res.writeHead(200, { 'content-type': 'text/plain; charset=utf-8' });
      return res.end('NEXUS API is running. Build the frontend with npm run build.');
    }
  }
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://localhost');
  if (url.pathname === '/api/health' && req.method === 'GET') {
    return json(res, 200, {
      ok: true,
      service: 'NEXUS API',
      aiConfigured: Boolean(process.env.NEXUS_AI_API_KEY),
      model: process.env.NEXUS_AI_MODEL || 'gpt-4o-mini'
    });
  }
  if (url.pathname === '/api/ai/plan' && req.method === 'POST') return plan(req, res);
  if (url.pathname.startsWith('/api/')) return json(res, 404, { error: 'API route not found.' });
  if (req.method === 'GET' || req.method === 'HEAD') return staticFile(url.pathname, res);
  res.writeHead(405, { allow: 'GET, HEAD' }); res.end('Method not allowed');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log('NEXUS server listening on port ' + PORT);
  console.log('AI provider: ' + (process.env.NEXUS_AI_API_KEY ? 'configured' : 'not configured'));
});