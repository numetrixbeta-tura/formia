import type { FormValues, IdentityAttachments, ValidationError } from '../types';

// Solo se validan los datos que el cliente debe aportar en la versión simplificada.
export const REQUIRED_FIELDS = [
  'primerNombre',
  'primerApellido',
  'fechaNacimiento',
  'tipoDocumento',
  'numeroIdentificacion',
  'lugarNacimiento_ciudad',
  'lugarNacimiento_pais',
  'sexo',
  'direccion',
  'ciudad',
  'departamento',
  'celular',
  'tipoVivienda',
  'email',
  'ocupacion',
  'profesion',
  'empresa',
  'tipoContrato',
  'cargo',
  'direccionOficinaPrincipal',
  'barrio',
  'ciudadOficina',
  'totalIngresos',
  'totalEgresos',
  'refPersonal1_nombres',
  'refPersonal1_ciudad',
  'refPersonal1_celular',
  'refPersonal1_relacion',
  'refPersonal2_nombres',
  'refPersonal2_ciudad',
  'refPersonal2_celular',
  'refPersonal2_relacion',
  'firmaDigital',
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

function formatMoneyLive(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (!digits) return '';
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

export function formatFieldValue(id: string, raw: string): string {
  if (isEmailField(id)) return raw;
  if (isDayMonthYearField(id)) return raw.replace(/[^0-9]/g, '').slice(0, 4);
  if (isMoneyField(id)) return formatMoneyLive(raw);
  if (isPhoneField(id)) return raw.replace(/[^0-9+()\-\s]/g, '');
  return raw.toUpperCase();
}

export function validate(values: FormValues, attachments?: IdentityAttachments): ValidationError[] {
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

  if (values.fechaNacimiento && !/^\d{4}-\d{2}-\d{2}$/.test(values.fechaNacimiento)) {
    errors.push({ fieldId: 'fechaNacimiento', message: 'Fecha de nacimiento no válida.' });
  }

  if (attachments && !((attachments.front && attachments.back) || attachments.pdf)) {
    errors.push({
      fieldId: 'documentosIdentidad',
      message: 'Adjunta frente y reverso de la cédula en foto o un PDF que contenga ambos lados.',
    });
  }

  return errors;
}

export function errorsBySection(errors: ValidationError[], sectionFieldIds: string[]): number {
  const set = new Set(sectionFieldIds);
  return errors.filter((e) => set.has(e.fieldId)).length;
}
