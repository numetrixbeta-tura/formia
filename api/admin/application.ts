import { requireAdmin } from '../_lib/auth.js';
import { json } from '../_lib/http.js';
import { createSignedDownloadUrl, supabaseRest } from '../_lib/supabase.js';

export async function GET(req: Request) {
  try {
    requireAdmin(req);
    if (req.method !== 'GET') return json({ error: 'Método no permitido.' }, 405);
    const id = new URL(req.url).searchParams.get('id');
    if (!id) return json({ error: 'Falta el id.' }, 400);
    const rows = await supabaseRest(`applications?id=eq.${encodeURIComponent(id)}&select=*`);
    const app = rows?.[0];
    if (!app) return json({ error: 'Solicitud no encontrada.' }, 404);

    const files: Record<string, string | null> = {};
    if (app.pdf_path) files.pdf = await createSignedDownloadUrl(app.pdf_path, `${app.request_number}.pdf`);
    if (app.identity_front_path) files.identityFront = await createSignedDownloadUrl(app.identity_front_path, `${app.request_number}-cedula-frente.jpg`);
    if (app.identity_back_path) files.identityBack = await createSignedDownloadUrl(app.identity_back_path, `${app.request_number}-cedula-reverso.jpg`);
    if (app.identity_pdf_path) files.identityPdf = await createSignedDownloadUrl(app.identity_pdf_path, `${app.request_number}-cedula.pdf`);

    return json({ application: { ...app, files } });
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: error instanceof Error ? error.message : 'No fue posible consultar la solicitud.' }, 500);
  }
}
