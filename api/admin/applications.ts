import { requireAdmin } from '../_lib/auth.js';
import { json, readJson } from '../_lib/http.js';
import { supabaseRest } from '../_lib/supabase.js';

async function handler(req: Request) {
  try {
    requireAdmin(req);
    if (req.method === 'GET') {
      const url = new URL(req.url);
      const status = url.searchParams.get('status');
      const search = url.searchParams.get('search');
      let path = 'applications?select=id,request_number,created_at,submitted_at,status,applicant_name,document_number,email,phone,pdf_path&order=created_at.desc';
      if (status && status !== 'TODAS') path += `&status=eq.${encodeURIComponent(status)}`;
      if (search) {
        const q = search.replace(/[%_]/g, '');
        path += `&or=(applicant_name.ilike.*${encodeURIComponent(q)}*,document_number.ilike.*${encodeURIComponent(q)}*,request_number.ilike.*${encodeURIComponent(q)}*)`;
      }
      const data = await supabaseRest(path);
      return json({ applications: data });
    }

    if (req.method === 'PATCH') {
      const body = await readJson(req);
      const id = String(body.id || '');
      const status = String(body.status || '');
      const allowed = ['NUEVA', 'EN REVISIÓN', 'ENVIADA AL BANCO', 'FINALIZADA', 'RECHAZADA', 'INCOMPLETA'];
      if (!id || !allowed.includes(status)) return json({ error: 'Datos de actualización inválidos.' }, 400);
      await supabaseRest(`applications?id=eq.${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json', Prefer: 'return=minimal' },
        body: JSON.stringify({ status }),
      });
      return json({ ok: true });
    }

    return json({ error: 'Método no permitido.' }, 405);
  } catch (error) {
    if (error instanceof Response) return error;
    return json({ error: error instanceof Error ? error.message : 'Error del administrador.' }, 500);
  }
}

export async function GET(req: Request) { return handler(req); }
export async function PATCH(req: Request) { return handler(req); }
