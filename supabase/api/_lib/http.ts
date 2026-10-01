export function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

export async function readJson(req: Request): Promise<Record<string, any>> {
  try {
    return await req.json();
  } catch {
    throw new Error('La solicitud no contiene JSON válido.');
  }
}

export function method(req: Request, allowed: string[]) {
  if (!allowed.includes(req.method)) return false;
  return true;
}
