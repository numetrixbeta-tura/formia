import { requireAdmin } from '../_lib/auth.js';
import { json } from '../_lib/http.js';
import { createSignedDownloadUrl } from '../_lib/supabase.js';

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    if (req.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
    const url = new URL(req.url);
    const path = url.searchParams.get('path');
    const filename = url.searchParams.get('filename') || 'documento.pdf';
    if (!path) return json({ error: 'Falta la ruta del archivo.' }, 400);
    return json({ url: await createSignedDownloadUrl(path, filename) });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: error instanceof Error ? error.message : 'No fue posible preparar la descarga.' }, 500);
  }
}
