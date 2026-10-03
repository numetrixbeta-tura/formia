import { config } from '../_lib/config.js';
import { createAdminToken } from '../_lib/auth.js';

const ADMIN_USERNAME = 'JATORRES';

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const username = typeof body?.username === 'string' ? body.username.trim() : '';
    const password = typeof body?.password === 'string' ? body.password : '';

    if (
      username.toLowerCase() !== ADMIN_USERNAME.toLowerCase() ||
      password !== config.adminPassword()
    ) {
      return new Response(
        JSON.stringify({ error: 'Usuario o contraseña incorrectos.' }),
        {
          status: 401,
          headers: { 'content-type': 'application/json' },
        },
      );
    }

    return new Response(JSON.stringify({ token: createAdminToken() }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    });
  } catch {
    return new Response(
      JSON.stringify({ error: 'No fue posible iniciar sesión.' }),
      {
        status: 500,
        headers: { 'content-type': 'application/json' },
      },
    );
  }
}
