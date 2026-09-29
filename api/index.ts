import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serverMod = require('./server.cjs');

export default async function handler(req: any, res: any) {
  if (req.url === '/api/health' || req.url === '/api/health/') {
    return res.status(200).json({ status: 'ok', service: 'story-menu-api', serverless: true, timestamp: new Date().toISOString() });
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
    const getApp = serverMod.getApp;
    const app = getApp ? await getApp() : (serverMod.default || serverMod.app || serverMod);
    return app(req, res);
  } catch (err: any) {
    console.error('Serverless bootstrap error:', err);
    return res.status(500).json({
      error: 'Serverless execution error',
      message: err?.message || String(err)
    });
  }
}
