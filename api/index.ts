import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';

const require = createRequire(import.meta.url);
let cachedServerMod: any = null;

function loadServerModule() {
  if (cachedServerMod) return cachedServerMod;

  const candidatePaths = [
    path.resolve('api/server.cjs'),
    path.resolve('dist/server.cjs'),
    path.join(process.cwd(), 'api/server.cjs'),
    path.join(process.cwd(), 'dist/server.cjs'),
    './server.cjs',
    './api/server.cjs'
  ];

  for (const p of candidatePaths) {
    try {
      if (fs.existsSync(p)) {
        cachedServerMod = require(p);
        return cachedServerMod;
      }
    } catch {}
  }

  try {
    cachedServerMod = require('./server.cjs');
    return cachedServerMod;
  } catch (e: any) {
    throw new Error(`Failed to locate server.cjs. Candidate paths: [${candidatePaths.join(', ')}]. CWD: ${process.cwd()}. Error: ${e.message}`);
  }
}

export default async function handler(req: any, res: any) {
  if (req.url === '/api/health' || req.url === '/api/health/') {
    return res.status(200).json({
      status: 'ok',
      service: 'story-menu-api',
      serverless: true,
      timestamp: new Date().toISOString()
    });
  }

  if (!req.socket) req.socket = {};
  if (!req.socket.remoteAddress) {
    const forwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) : null;
    req.socket.remoteAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) || '127.0.0.1';
  }
  if (!req.connection) {
    req.connection = req.socket;
  }

  try {
    const serverMod = loadServerModule();
    const getApp = serverMod.getApp;
    const app = getApp ? await getApp() : (serverMod.default || serverMod.app || serverMod);
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless bootstrap error:', err);
    return res.status(500).json({
      error: 'Serverless bootstrap error',
      message: err?.message || String(err)
    });
  }
}
