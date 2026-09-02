import type { FormValues, ValidationError } from '../types';

// Campos obligatorios mínimos razonables (el resto del formulario original
// permite dejarse en blanco si no aplica al solicitante).
export const REQUIRED_FIELDS = [
  'primerNombre',
  'primerApellido',
  'numeroIdentificacion',
  'direccion',
  'ciudad',
  'telefono',
  'email',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[0-9+()\-\s]{7,20}$/;
const NUMERIC_RE = /^[0-9.,\s]*$/;

function isMoneyField(id: string) {
  return /^(ingreso_|egreso_|total|monto|precio|cuota|valor)/i.test(id) ||
    /(Monto|Financiar|Cuota|Precio|Patrimonio|Activos|Pasivos|Ingresos|Egresos)/.test(id);
}

function isPhoneField(id: string) {
  return /(telefono|celular|fax|Ext)/i.test(id);
}

function isEmailField(id: string) {
  return /email/i.test(id);
}

function isDayMonthYearField(id: string) {
  return /_(dia|mes|anio)$/i.test(id);
}

export function formatFieldValue(id: string, raw: string): string {
  if (isDayMonthYearField(id)) {
    return raw.replace(/[^0-9]/g, '').slice(0, 4);
  }
  if (isPhoneField(id)) {
    return raw.replace(/[^0-9+()\-\s]/g, '');
  }
  if (isMoneyField(id)) {
    return raw.replace(/[^0-9.,]/g, '');
  }
  return raw;
}

export function validate(values: FormValues): ValidationError[] {
  const errors: ValidationError[] = [];

  for (const id of REQUIRED_FIELDS) {
    if (!values[id] || !values[id].trim()) {
      errors.push({ fieldId: id, message: 'Este campo es obligatorio.' });
    }
  }

  for (const [id, value] of Object.entries(values)) {
    if (!value) continue;
    if (isEmailField(id) && !EMAIL_RE.test(value)) {
      errors.push({ fieldId: id, message: 'Correo electrónico no válido.' });
    } else if (isPhoneField(id) && !PHONE_RE.test(value)) {
      errors.push({ fieldId: id, message: 'Teléfono no válido.' });
    } else if (isMoneyField(id) && !NUMERIC_RE.test(value)) {
      errors.push({ fieldId: id, message: 'Debe contener solo números.' });
    }
  }

  return errors;
}

export function errorsBySection(
  errors: ValidationError[],
  sectionFieldIds: string[]
): number {
  const set = new Set(sectionFieldIds);
  return errors.filter((e) => set.has(e.fieldId)).length;
}
