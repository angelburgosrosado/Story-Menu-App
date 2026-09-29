import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serverMod = require('./server.cjs');

export default async function handler(req: any, res: any) {
  if (!req.socket) req.socket = {};
  if (!req.socket.remoteAddress) {
    const forwarded = req.headers ? (req.headers['x-forwarded-for'] || req.headers['x-real-ip']) : null;
    req.socket.remoteAddress = (typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : null) || '127.0.0.1';
  }
  if (!req.connection) {
    req.connection = req.socket;
  }

  const getApp = serverMod.getApp;
  const app = getApp ? await getApp() : (serverMod.default || serverMod.app || serverMod);
  return app(req, res);
}
