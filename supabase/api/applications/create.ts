import { config } from '../_lib/config';
import { json, readJson } from '../_lib/http';
import { createSignedUploadUrl, supabaseRest } from '../_lib/supabase';
import { randomUUID } from 'node:crypto';

function cleanName(value: string) {
  return value.replace(/[^A-ZÁÉÍÓÚÜÑ0-9_-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'SOLICITANTE';
}

function requestNumber() {
  const d = new Date();
  const date = `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;
  const random = Math.floor(10000 + Math.random() * 90000);
  return `FORMIA-${date}-${random}`;
}

export async function POST(req: Request) {
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405);
  try {
    const body = await readJson(req);
    const values = body.values;
    const hasIdentityFront = Boolean(body.hasIdentityFront);
    const hasIdentityBack = Boolean(body.hasIdentityBack);
    const hasIdentityPdf = Boolean(body.hasIdentityPdf);
    const frontExtension = String(body.frontExtension || 'jpg').toLowerCase() === 'png' ? 'png' : 'jpg';
    const backExtension = String(body.backExtension || 'jpg').toLowerCase() === 'png' ? 'png' : 'jpg';
    if (!values || typeof values !== 'object') return json({ error: 'Faltan los datos del formulario.' }, 400);

    const id = randomUUID();
    const number = requestNumber();
    const applicantName = [values.primerNombre, values.segundoNombre, values.primerApellido, values.segundoApellido]
      .filter(Boolean).join(' ').trim();
    const folder = `solicitudes/${number}-${cleanName(applicantName)}`;
    const pdfPath = `${folder}/solicitud-completa.pdf`;
    const identityFrontPath = hasIdentityFront ? `${folder}/cedula-frente.${frontExtension}` : null;
    const identityBackPath = hasIdentityBack ? `${folder}/cedula-reverso.${backExtension}` : null;
    const identityPdfPath = hasIdentityPdf ? `${folder}/cedula.pdf` : null;

    await supabaseRest('applications', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Prefer: 'return=minimal' },
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
    });

    const uploads: Record<string, { signedUrl: string; path: string }> = {
      pdf: await createSignedUploadUrl(pdfPath),
    };
    if (identityFrontPath) uploads.identityFront = await createSignedUploadUrl(identityFrontPath);
    if (identityBackPath) uploads.identityBack = await createSignedUploadUrl(identityBackPath);
    if (identityPdfPath) uploads.identityPdf = await createSignedUploadUrl(identityPdfPath);

    return json({ applicationId: id, requestNumber: number, uploads, bucket: config.bucket() });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : 'No fue posible crear la solicitud.' }, 500);
  }
}
