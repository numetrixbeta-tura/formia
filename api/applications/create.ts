import { config } from '../_lib/config.js';
import { json, readJson } from '../_lib/http.js';
import { createSignedUploadUrl, supabaseRest } from '../_lib/supabase.js';
import { randomUUID } from 'node:crypto';

function cleanName(value: string) {
  return value
    .replace(/[^A-ZÁÉÍÓÚÜÑ0-9_-]+/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60) || 'SOLICITANTE';
}

function requestNumber() {
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const random = Math.floor(10000 + Math.random() * 90000);
  return `FORMIA-${date}-${random}`;
}

async function runStage<T>(stage: string, fn: () => Promise<T>): Promise<T> {
  try {
    console.log(`[FORMIA] INICIO: ${stage}`);
    const result = await fn();
    console.log(`[FORMIA] OK: ${stage}`);
    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[FORMIA] ERROR EN ${stage}: ${message}`);
    throw new Error(`${stage}: ${message}`);
  }
}

export async function POST(req: Request) {
  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405);
  }

  try {
    const body = await runStage('leer datos del formulario', () => readJson(req));
    const values = body.values;
    const hasIdentityFront = Boolean(body.hasIdentityFront);
    const hasIdentityBack = Boolean(body.hasIdentityBack);
    const hasIdentityPdf = Boolean(body.hasIdentityPdf);

    const frontExtension =
      String(body.frontExtension || 'jpg').toLowerCase() === 'png'
        ? 'png'
        : 'jpg';

    const backExtension =
      String(body.backExtension || 'jpg').toLowerCase() === 'png'
        ? 'png'
        : 'jpg';

    if (!values || typeof values !== 'object') {
      return json({ error: 'Faltan los datos del formulario.' }, 400);
    }

    const id = randomUUID();
    const number = requestNumber();

    const applicantName = [
      values.primerNombre,
      values.segundoNombre,
      values.primerApellido,
      values.segundoApellido,
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    const folder = `solicitudes/${number}-${cleanName(applicantName)}`;
    const pdfPath = `${folder}/solicitud-completa.pdf`;

    const identityFrontPath = hasIdentityFront
      ? `${folder}/cedula-frente.${frontExtension}`
      : null;
    const identityBackPath = hasIdentityBack
      ? `${folder}/cedula-reverso.${backExtension}`
      : null;
    const identityPdfPath = hasIdentityPdf
      ? `${folder}/cedula.pdf`
      : null;

    await runStage('guardar solicitud en Supabase', () =>
      supabaseRest('applications', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          Prefer: 'return=minimal',
        },
        body: JSON.stringify({
          id,
          request_number: number,
          status: 'NUEVA',
          applicant_name: applicantName || 'SIN NOMBRE',
          document_number: values.numeroIdentificacion || null,
          email: values.email || null,
          phone: values.celular || null,
          form_values: values,
          pdf_path: pdfPath,
          identity_front_path: identityFrontPath,
          identity_back_path: identityBackPath,
          identity_pdf_path: identityPdfPath,
          submitted_at: null,
        }),
      })
    );

    const uploads: Record<string, { signedUrl: string; path: string }> = {};

    uploads.pdf = await runStage('crear URL de carga del PDF', () =>
      createSignedUploadUrl(pdfPath)
    );

    if (identityFrontPath) {
      uploads.identityFront = await runStage(
        'crear URL de carga de cédula frente',
        () => createSignedUploadUrl(identityFrontPath)
      );
    }

    if (identityBackPath) {
      uploads.identityBack = await runStage(
        'crear URL de carga de cédula reverso',
        () => createSignedUploadUrl(identityBackPath)
      );
    }

    if (identityPdfPath) {
      uploads.identityPdf = await runStage(
        'crear URL de carga de cédula PDF',
        () => createSignedUploadUrl(identityPdfPath)
      );
    }

    return json({
      applicationId: id,
      requestNumber: number,
      uploads,
      bucket: config.bucket(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'No fue posible crear la solicitud.';
    console.error(`[FORMIA] FALLO FINAL: ${message}`);

    return json({ error: message }, 500);
  }
}
