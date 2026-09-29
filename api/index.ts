import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const serverMod = require('./server.cjs');
const app = serverMod.default || serverMod.app || serverMod;

export default function handler(req: any, res: any) {
  return app(req, res);
}
