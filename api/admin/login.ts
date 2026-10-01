import { config } from '../_lib/config';
import { createAdminToken } from '../_lib/auth';
import { json, readJson } from '../_lib/http';

export async function POST(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await readJson(req);
    if (String(body.password || '') !== config.adminPassword()) return json({ error: 'Contraseña incorrecta.' }, 401);
    return json({ token: createAdminToken() });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No fue posible iniciar sesión.' }, 500);
  }
}
