export function env(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Falta la variable de entorno ${name}.`);
  return value;
}

export const config = {
  supabaseUrl: () => env('SUPABASE_URL').replace(/\/$/, ''),
  supabaseSecretKey: () => process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  bucket: () => process.env.SUPABASE_STORAGE_BUCKET || 'formia-documentos',
  adminPassword: () => env('FORMIA_ADMIN_PASSWORD'),
  adminTokenSecret: () => process.env.FORMIA_ADMIN_TOKEN_SECRET || env('FORMIA_ADMIN_PASSWORD'),
};

export function assertServerConfig() {
  if (!config.supabaseSecretKey()) throw new Error('Falta SUPABASE_SECRET_KEY en Vercel.');
}
