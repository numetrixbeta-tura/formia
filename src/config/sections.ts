import { FIELD_BY_ID } from './pdfFieldMapping';

export interface RadioOption {
  checkId: string;
  label: string;
}

export interface RadioGroupDef {
  id: string;
  label: string;
  options: RadioOption[];
}

export interface FieldRow {
  fieldIds: string[];
}

export interface SectionDef {
  id: string;
  title: string;
  subtitle?: string;
  radioGroups?: RadioGroupDef[];
  rows: FieldRow[];
  subgroups?: { title: string; rows: FieldRow[] }[];
}

const row = (...fieldIds: string[]): FieldRow => ({ fieldIds });

/**
 * Formulario simplificado para el cliente. La plantilla PDF original no cambia:
 * aquí solo definimos qué información se solicita en pantalla.
 */
export const SECTIONS: SectionDef[] = [
  {
    id: 'informacionSolicitante',
    title: '1. Información del solicitante',
    subtitle: 'Ingresa tus datos básicos de identificación.',
    radioGroups: [
      {
        id: 'tipoDocumento',
        label: 'Tipo de documento',
        options: [
          { checkId: 'tipoDocumento_cc', label: 'C.C.' },
          { checkId: 'tipoDocumento_ce', label: 'C.E.' },
          { checkId: 'tipoDocumento_pasaporte', label: 'Pasaporte' },
        ],
      },
      {
        id: 'sexo',
        label: 'Sexo',
        options: [
          { checkId: 'sexo_f', label: 'Femenino' },
          { checkId: 'sexo_m', label: 'Masculino' },
        ],
      },
    ],
    rows: [
      row('primerNombre', 'segundoNombre'),
      row('primerApellido', 'segundoApellido'),
      row('fechaNacimiento'),
      row('numeroIdentificacion'),
      row('lugarNacimiento_ciudad', 'lugarNacimiento_pais'),
    ],
  },
  {
    id: 'datosLaboralesFinancieros',
    title: '2. Datos del solicitante, laborales y financieros',
    subtitle: 'Completa tu información de contacto, actividad laboral e ingresos.',
    radioGroups: [
      {
        id: 'tipoVivienda',
        label: 'Tipo de vivienda',
        options: [
          { checkId: 'tipoVivienda_arrendada', label: 'Arrendada' },
          { checkId: 'tipoVivienda_familiar', label: 'Familiar' },
          { checkId: 'tipoVivienda_propia', label: 'Propia' },
        ],
      },
      {
        id: 'ocupacion',
        label: 'Ocupación',
        options: [
          { checkId: 'ocupacion_empleado', label: 'Empleado' },
          { checkId: 'ocupacion_pensionado', label: 'Pensionado' },
          { checkId: 'ocupacion_transportador', label: 'Transportador' },
          { checkId: 'ocupacion_independiente', label: 'Independiente' },
          { checkId: 'ocupacion_rentista', label: 'Rentista de Capital' },
        ],
      },
    ],
    subgroups: [
      {
        title: 'Datos del solicitante',
        rows: [
          row('direccion'),
          row('ciudad', 'departamento'),
          row('celular'),
          row('email'),
        ],
      },
      {
        title: 'Información laboral',
        rows: [
          row('profesion', 'empresa'),
          row('tipoContrato'),
          row('cargo'),
          row('direccionOficinaPrincipal', 'barrio'),
          row('ciudadOficina'),
        ],
      },
      {
        title: 'Ingresos y egresos mensuales',
        rows: [
          row('totalIngresos', 'totalEgresos'),
        ],
      },
    ],
    rows: [],
  },
  {
    id: 'referenciaFirma',
    title: '3. Referencia personal y firma',
    subtitle: 'Completa tus referencias, documentos y firma con el dedo o el mouse.',
    subgroups: [
      {
        title: 'Referencia personal 1',
        rows: [
          row('refPersonal1_nombres'),
          row('refPersonal1_ciudad', 'refPersonal1_celular'),
          row('refPersonal1_relacion'),
        ],
      },
      {
        title: 'Referencia personal 2',
        rows: [
          row('refPersonal2_nombres'),
          row('refPersonal2_ciudad', 'refPersonal2_celular'),
          row('refPersonal2_relacion'),
        ],
      },
      {
        title: 'Documentos de identidad',
        rows: [row('documentosIdentidad')],
      },
      {
        title: 'Firma digital',
        rows: [row('firmaDigital')],
      },
    ],
    rows: [],
  },
];

const RADIO_GROUP_LABELS: Record<string, string> = {
  tipoDocumento: 'Tipo de documento',
  sexo: 'Sexo',
  tipoVivienda: 'Tipo de vivienda',
  ocupacion: 'Ocupación',
};

export function labelFor(fieldId: string): string {
  if (fieldId === 'fechaNacimiento') return 'Fecha de nacimiento';
  if (fieldId === 'firmaDigital') return 'Firma digital';
  if (fieldId === 'documentosIdentidad') return 'Documento de identidad';
  return RADIO_GROUP_LABELS[fieldId] ?? FIELD_BY_ID[fieldId]?.label ?? fieldId;
}

/** Índice de la sección que contiene un campo, incluidos los controles especiales. */
export function sectionIndexForField(fieldId: string): number {
  return SECTIONS.findIndex((section) => {
    const inRows = section.rows.some((r) => r.fieldIds.includes(fieldId));
    if (inRows) return true;
    const inSubgroups = section.subgroups?.some((sg) => sg.rows.some((r) => r.fieldIds.includes(fieldId))) ?? false;
    if (inSubgroups) return true;
    return section.radioGroups?.some((group) => group.id === fieldId) ?? false;
  });
}
