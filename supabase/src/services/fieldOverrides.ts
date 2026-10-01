import { FIELD_MAP, CHECK_MAP, type FieldDef, type CheckDef } from '../config/pdfFieldMapping';

const OVERRIDES_KEY = 'formia-template-editor-overrides-v1';

export type FieldOverride = Partial<
  Pick<FieldDef, 'page' | 'x' | 'y' | 'width' | 'height' | 'fontSize' | 'align' | 'label' | 'maxLength'>
> & { fontFamily?: string };

export type CheckOverride = Partial<Pick<CheckDef, 'page' | 'x' | 'y' | 'width' | 'height' | 'label'>>;

interface OverridesStore {
  fields: Record<string, FieldOverride>;
  checks: Record<string, CheckOverride>;
}

function emptyStore(): OverridesStore {
  return { fields: {}, checks: {} };
}

function readStore(): OverridesStore {
  try {
    const raw = localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      fields: parsed.fields ?? {},
      checks: parsed.checks ?? {},
    };
  } catch {
    return emptyStore();
  }
}

function writeStore(store: OverridesStore) {
  localStorage.setItem(OVERRIDES_KEY, JSON.stringify(store));
}

// --- API pública usada por el Editor de Plantilla ---

export function getFieldOverride(id: string): FieldOverride | undefined {
  return readStore().fields[id];
}

export function getCheckOverride(id: string): CheckOverride | undefined {
  return readStore().checks[id];
}

export function setFieldOverride(id: string, patch: FieldOverride) {
  const store = readStore();
  store.fields[id] = { ...store.fields[id], ...patch };
  writeStore(store);
}

export function setCheckOverride(id: string, patch: CheckOverride) {
  const store = readStore();
  store.checks[id] = { ...store.checks[id], ...patch };
  writeStore(store);
}

export function resetFieldOverride(id: string) {
  const store = readStore();
  delete store.fields[id];
  writeStore(store);
}

export function resetCheckOverride(id: string) {
  const store = readStore();
  delete store.checks[id];
  writeStore(store);
}

export function resetPageOverrides(page: 1 | 2) {
  const store = readStore();
  for (const f of FIELD_MAP) {
    if (f.page === page) delete store.fields[f.id];
  }
  for (const c of CHECK_MAP) {
    if (c.page === page) delete store.checks[c.id];
  }
  writeStore(store);
}

export function resetAllOverrides() {
  writeStore(emptyStore());
}

/** Snapshot completo del store de overrides, para historial de deshacer/rehacer. */
export function snapshotOverrides(): OverridesStore {
  const s = readStore();
  return { fields: { ...s.fields }, checks: { ...s.checks } };
}

export function restoreOverridesSnapshot(snapshot: OverridesStore) {
  writeStore({ fields: { ...snapshot.fields }, checks: { ...snapshot.checks } });
}

export function hasAnyOverrides(): boolean {
  const store = readStore();
  return Object.keys(store.fields).length > 0 || Object.keys(store.checks).length > 0;
}

/** Mapa efectivo de campos de texto: base + overrides guardados desde el editor. */
export function getEffectiveFieldMap(): FieldDef[] {
  const store = readStore();
  return FIELD_MAP.map((f) => (store.fields[f.id] ? { ...f, ...store.fields[f.id] } : f));
}

/** Mapa efectivo de casillas: base + overrides guardados desde el editor. */
export function getEffectiveCheckMap(): CheckDef[] {
  const store = readStore();
  return CHECK_MAP.map((c) => (store.checks[c.id] ? { ...c, ...store.checks[c.id] } : c));
}

/** Exporta el mapeo EFECTIVO completo (base + overrides) como el código fuente
 * de un nuevo pdfFieldMapping.ts, listo para reemplazar el archivo del proyecto
 * y dejar los cambios del editor permanentes en el código. */
export function exportEffectiveMappingAsTs(): string {
  const fields = getEffectiveFieldMap();
  const checks = getEffectiveCheckMap();
  const esc = (s: string) => s.replace(/'/g, "\\'");

  const lines: string[] = [];
  lines.push('// Generado por el Editor de Plantilla de FORMIA (exportación de overrides aplicados).');
  lines.push('// Reemplaza src/config/pdfFieldMapping.ts con este archivo para dejar los cambios permanentes.');
  lines.push('');
  lines.push("export type Alignment = 'left' | 'center' | 'right';");
  lines.push('');
  lines.push('export interface FieldDef {');
  lines.push('  id: string;');
  lines.push('  label: string;');
  lines.push('  page: 1 | 2;');
  lines.push('  x: number;');
  lines.push('  y: number;');
  lines.push('  width: number;');
  lines.push('  height: number;');
  lines.push('  fontSize: number;');
  lines.push('  maxLength?: number;');
  lines.push('  align: Alignment;');
  lines.push('}');
  lines.push('');
  lines.push('export interface CheckDef {');
  lines.push('  id: string;');
  lines.push('  label: string;');
  lines.push('  page: 1 | 2;');
  lines.push('  x: number;');
  lines.push('  y: number;');
  lines.push('  width: number;');
  lines.push('  height: number;');
  lines.push('  value: string;');
  lines.push('}');
  lines.push('');
  lines.push('export const FIELD_MAP: FieldDef[] = [');
  for (const f of fields) {
    lines.push(
      `  { id: '${f.id}', label: '${esc(f.label)}', page: ${f.page}, x: ${f.x}, y: ${f.y}, width: ${f.width}, height: ${f.height}, fontSize: ${f.fontSize}, align: '${f.align}' },`
    );
  }
  lines.push('];');
  lines.push('');
  lines.push('export const CHECK_MAP: CheckDef[] = [');
  for (const c of checks) {
    lines.push(
      `  { id: '${c.id}', label: '${esc(c.label)}', page: ${c.page}, x: ${c.x}, y: ${c.y}, width: ${c.width}, height: ${c.height}, value: '${esc((CHECK_MAP.find((cc) => cc.id === c.id))?.value ?? '')}' },`
    );
  }
  lines.push('];');
  lines.push('');
  lines.push('export const FIELD_BY_ID: Record<string, FieldDef> = Object.fromEntries(FIELD_MAP.map(f => [f.id, f]));');
  lines.push('');
  return lines.join('\n');
}
