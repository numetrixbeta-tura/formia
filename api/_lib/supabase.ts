import { config, assertServerConfig } from './config.js';

function headers(extra: Record<string, string> = {}) {
  assertServerConfig();
  const key = config.supabaseSecretKey();
  return { apikey: key, Authorization: `Bearer ${key}`, ...extra };
}

export async function supabaseRest(path: string, init: RequestInit = {}) {
  const res = await fetch(`${config.supabaseUrl()}/rest/v1/${path}`, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Supabase REST ${res.status}: ${body.slice(0, 500)}`);
  }

  if (res.status === 204) return null;

  const text = await res.text();

  if (!text.trim()) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    throw new Error(
      `Supabase devolvió una respuesta no válida: ${text.slice(0, 500)}`
    );
  }
}

export async function createSignedUploadUrl(path: string) {
  const bucket = config.bucket();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  const res = await fetch(
    `${config.supabaseUrl()}/storage/v1/object/upload/sign/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'POST',
      headers: { ...headers(), 'content-type': 'application/json' },
      body: '{}',
    }
  );

  if (!res.ok) {
    throw new Error(`No se pudo crear la URL de carga (${res.status}).`);
  }

  const data = await res.json();
  const raw = data.signedUrl || data.signedURL || data.url;

  if (!raw) {
    throw new Error('Supabase no devolvió una URL de carga firmada.');
  }

  const signedUrl = raw.startsWith('http')
    ? raw
    : `${config.supabaseUrl()}/storage/v1${raw}`;

  return { signedUrl, path };
}

export async function createSignedDownloadUrl(
  path: string,
  filename?: string
) {
  const bucket = config.bucket();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  const res = await fetch(
    `${config.supabaseUrl()}/storage/v1/object/sign/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'POST',
      headers: { ...headers(), 'content-type': 'application/json' },
      body: JSON.stringify({ expiresIn: 900 }),
    }
  );

  if (!res.ok) {
    throw new Error(`No se pudo crear la URL de descarga (${res.status}).`);
  }

  const data = await res.json();
  const raw = data.signedURL || data.signedUrl;

  if (!raw) {
    throw new Error('Supabase no devolvió una URL firmada.');
  }

  const url = raw.startsWith('http')
    ? raw
    : `${config.supabaseUrl()}/storage/v1${raw}`;

  if (!filename) return url;

  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}download=${encodeURIComponent(filename)}`;
}

export async function storageObjectExists(path: string) {
  const bucket = config.bucket();
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');

  const res = await fetch(
    `${config.supabaseUrl()}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedPath}`,
    {
      method: 'HEAD',
      headers: headers(),
    }
  );

  return res.ok;
}