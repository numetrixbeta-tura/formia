-- FORMIA: base de datos de solicitudes.
-- Ejecutar en Supabase SQL Editor.

create table if not exists public.applications (
  id uuid primary key,
  request_number text not null unique,
  created_at timestamptz not null default now(),
  submitted_at timestamptz,
  status text not null default 'NUEVA',
  applicant_name text not null,
  document_number text,
  email text,
  phone text,
  form_values jsonb not null default '{}'::jsonb,
  pdf_path text not null,
  identity_front_path text,
  identity_back_path text,
  identity_pdf_path text
);

create index if not exists applications_created_at_idx on public.applications (created_at desc);
create index if not exists applications_status_idx on public.applications (status);
create index if not exists applications_document_number_idx on public.applications (document_number);

alter table public.applications enable row level security;

-- El cliente nunca consulta directamente la tabla. Todo pasa por las funciones
-- server-side de FORMIA usando la clave secreta de Supabase.
revoke all on public.applications from anon, authenticated;

do $$
begin
  if not exists (select 1 from storage.buckets where id = 'formia-documentos') then
    insert into storage.buckets (id, name, public)
    values ('formia-documentos', 'formia-documentos', false);
  end if;
end $$;

-- No crear políticas públicas para lectura. Las cargas se realizan mediante
-- URLs firmadas y las descargas mediante URLs firmadas generadas por el servidor.
