import type { FormValues, IdentityAttachments } from '../types';

interface UploadTarget {
  signedUrl: string;
  path: string;
}

interface CreateApplicationResponse {
  applicationId: string;
  requestNumber: string;
  uploads: {
    pdf: UploadTarget;
    identityFront?: UploadTarget;
    identityBack?: UploadTarget;
    identityPdf?: UploadTarget;
  };
}

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'No fue posible comunicarse con FORMIA.');
  return data as T;
}

export async function submitApplication(
  values: FormValues,
  attachments: IdentityAttachments,
  pdfBytes: Uint8Array,
): Promise<string> {
  const created = await readResponse<CreateApplicationResponse>(await fetch('/api/applications/create', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      values,
      hasIdentityFront: Boolean(attachments.front),
      hasIdentityBack: Boolean(attachments.back),
      hasIdentityPdf: Boolean(attachments.pdf),
      frontExtension: attachments.front?.type === 'image/png' ? 'png' : 'jpg',
      backExtension: attachments.back?.type === 'image/png' ? 'png' : 'jpg',
    }),
  }));

  const uploads: Promise<Response>[] = [];
  uploads.push(fetch(created.uploads.pdf.signedUrl, {
    method: 'PUT',
    headers: { 'content-type': 'application/pdf', 'x-upsert': 'false' },
    body: new Blob([pdfBytes.slice()], { type: 'application/pdf' }),
  }));

  if (attachments.front && created.uploads.identityFront) {
    uploads.push(fetch(created.uploads.identityFront.signedUrl, {
      method: 'PUT',
      headers: { 'content-type': attachments.front.type || 'image/jpeg', 'x-upsert': 'false' },
      body: attachments.front,
    }));
  }
  if (attachments.back && created.uploads.identityBack) {
    uploads.push(fetch(created.uploads.identityBack.signedUrl, {
      method: 'PUT',
      headers: { 'content-type': attachments.back.type || 'image/jpeg', 'x-upsert': 'false' },
      body: attachments.back,
    }));
  }
  if (attachments.pdf && created.uploads.identityPdf) {
    uploads.push(fetch(created.uploads.identityPdf.signedUrl, {
      method: 'PUT',
      headers: { 'content-type': 'application/pdf', 'x-upsert': 'false' },
      body: attachments.pdf,
    }));
  }

  const results = await Promise.all(uploads);
  const failed = results.find((r) => !r.ok);
  if (failed) {
    throw new Error('No fue posible cargar todos los documentos. Verifica tu conexión y vuelve a intentarlo.');
  }

  await readResponse(await fetch('/api/applications/finalize', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ applicationId: created.applicationId }),
  }));

  return created.requestNumber;
}
