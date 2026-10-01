import { json, readJson } from '../_lib/http.js';
import { storageObjectExists, supabaseRest } from '../_lib/supabase.js';

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405);
  }

  try {
    const body = await readJson(req);
    const id = String(body.applicationId || '');

    if (!id) {
      return json(
        { error: 'Falta el identificador de la solicitud.' },
        400
      );
    }

    const rows = await supabaseRest(
      `applications?id=eq.${encodeURIComponent(
        id
      )}&select=id,request_number,pdf_path,status`
    );

    const app = rows?.[0];

    if (!app) {
      return json(
        { error: 'Solicitud no encontrada.' },
        404
      );
    }

    if (!(await storageObjectExists(app.pdf_path))) {
      return json(
        { error: 'El PDF final todavía no terminó de cargarse.' },
        409
      );
    }

    await supabaseRest(
      `applications?id=eq.${encodeURIComponent(id)}`,
      {
        method: 'PATCH',
        headers: {
          'content-type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          status: 'NUEVA',
          submitted_at: new Date().toISOString(),
        }),
      }
    );

    return json({
      ok: true,
      requestNumber: app.request_number,
    });
  } catch (error) {
    return json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'No fue posible finalizar la solicitud.',
      },
      500
    );
  }
}