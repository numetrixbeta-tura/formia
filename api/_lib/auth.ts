import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from './config.js';

function signature(payload: string) {
  return createHmac('sha256', config.adminTokenSecret()).update(payload).digest('base64url');
}

export function createAdminToken() {
  const payload = `${Date.now()}:${Math.random().toString(36).slice(2)}`;
  return `${payload}.${signature(payload)}`;
}

export function verifyAdminToken(token: string | null) {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payload, sig] = parts;
  const expected = signature(payload);
  try {
    const ok = timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
    if (!ok) return false;
  } catch {
    return false;
  }
  const timestamp = Number(payload.split(':')[0]);
  return Number.isFinite(timestamp) && Date.now() - timestamp < 8 * 60 * 60 * 1000;
}

export function requireAdmin(req: Request) {
  const header = req.headers.get('authorization');
  const token = header?.startsWith('Bearer ') ? header.slice(7) : null;
  if (!verifyAdminToken(token)) throw new Response(JSON.stringify({ error: 'No autorizado.' }), {
    status: 401,
    headers: { 'content-type': 'application/json' },
  });
}
