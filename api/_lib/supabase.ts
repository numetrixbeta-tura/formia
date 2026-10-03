import { config, assertServerConfig } from './config.js';

function headers(extra: Record<string, string> = {}) {
  assertServerConfig();
  const key = config.supabaseSecretKey();
  const authHeaders: Record<string, string> = { apikey: key };

  if (!key.startsWith('sb_')) {
    authHeaders.Authorization = `Bearer ${key}`;
  }

  return { ...authHeaders, ...extra };
}

function describeFetchError(error: unknown) {
  if (!(error instanceof Error)) return String(error);

  const cause = (error as Error & { cause?: unknown }).cause;
  if (cause instanceof Error) {
    const code = (cause as Error & { code?: string }).code;
    const errno = (cause as Error & { errno?: string | number }).errno;
    const message = cause.message;
    return [code, errno, message].filter(Boolean).join(' | ');
  }

  if (cause && typeof cause === 'object') {
    const c = cause as Record<string, unknown>;
    return [c.code, c.errno, c.message].filter(Boolean).join(' | ');
  }

  return error.message;
}

export async function supabaseRest(path: string, init: RequestInit = {}) {
  const url = `${config.supabaseUrl()}/rest/v1/${path}`;

  let res: Response;
  try {
    res = await fetch(url, {
      ...init,
      headers: { ...headers(), ...(init.headers ?? {}) },
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con Supabase (${url}): ${describeFetchError(error)}`);
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase REST ${res.status}: ${body.slice(0, 500)}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();

  if (!text.trim()) return null;

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`Supabase devolvió una respuesta no válida: ${text.slice(0, 500)}`);
  }
}

export async function createSignedUploadUrl(path: string) {
  const bucket = config.bucket();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `${config.supabaseUrl()}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodedPath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { ...headers(), 'content-type': 'application/json' },
      body: '{}',
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con Storage de Supabase (${url}): ${describeFetchError(error)}`);
  }

  if (!res.ok) throw new Error(`No se pudo crear la URL de carga (${res.status}).`);

  const data = await res.json();
  const raw = data.signedUrl || data.signedURL || data.url;
  if (!raw) throw new Error('Supabase no devolvió una URL de carga firmada.');

  const signedUrl = raw.startsWith('http') ? raw : `${config.supabaseUrl()}/storage/v1${raw}`;
  return { signedUrl, path };
}

export async function createSignedDownloadUrl(path: string, filename?: string) {
  const bucket = config.bucket();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `${config.supabaseUrl()}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`;

  let res: Response;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: { ...headers(), 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: 900 }),
    });
  } catch (error) {
    throw new Error(`No se pudo conectar con Storage de Supabase (${url}): ${describeFetchError(error)}`);
  }

  if (!res.ok) throw new Error(`No se pudo crear la URL de descarga (${res.status}).`);

  const data = await res.json();
  const raw = data.signedURL || data.signedUrl;
  if (!raw) throw new Error('Supabase no devolvió una URL firmada.');

  const urlSigned = raw.startsWith('http') ? raw : `${config.supabaseUrl()}/storage/v1${raw}`;
  if (!filename) return urlSigned;
  const separator = urlSigned.includes('?') ? '&' : '?';
  return `${urlSigned}${separator}download=${encodeURIComponent(filename)}`;
}

export async function storageObjectExists(path: string) {
  const bucket = config.bucket();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const url = `${config.supabaseUrl()}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`;

  let res: Response;
  try {
    res = await fetch(url, { method: 'HEAD', headers: headers() });
  } catch {
    return false;
  }

  return res.ok;
}
