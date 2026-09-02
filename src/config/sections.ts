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
  fieldIds: string[]; // se muestran en la misma fila
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

export const SECTIONS: SectionDef[] = [
  {
    id: 'tipoSolicitud',
    title: 'Tipo de solicitud',
    subtitle: 'Selecciona las opciones que apliquen, tal como aparecen en el formulario original.',
    radioGroups: [
      {
        id: 'tipoSolicitud',
        label: 'Tipo de solicitud',
        options: [
          { checkId: 'tipoSolicitud_credito', label: 'Crédito' },
          { checkId: 'tipoSolicitud_leasing', label: 'Leasing' },
        ],
      },
      {
        id: 'calidad',
        label: 'Calidad del solicitante',
        options: [
          { checkId: 'calidad_titular', label: 'Titular' },
          { checkId: 'calidad_codeudor', label: 'Codeudor' },
          { checkId: 'calidad_apoderado', label: 'Apoderado' },
        ],
      },
    ],
    rows: [
      row('fechaDiligenciamiento_dia', 'fechaDiligenciamiento_mes', 'fechaDiligenciamiento_anio'),
      row('vendedor', 'concesionario'),
    ],
  },
  {
    id: 'solicitante',
    title: 'Información del solicitante',
    rows: [
      row('primerNombre', 'segundoNombre'),
      row('primerApellido', 'segundoApellido'),
      row('fechaNacimiento_dia', 'fechaNacimiento_mes', 'fechaNacimiento_anio'),
      row('numeroIdentificacion'),
      row('lugarNacimiento_ciudad', 'lugarNacimiento_pais'),
      row('segundaNacionalidad_cual'),
      row('estadoCivil'),
      row('direccion'),
      row('ciudad', 'departamento'),
      row('telefono', 'celular'),
      row('email'),
      row('tiempoAntiguedadDomicilio'),
    ],
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
        id: 'segundaNacionalidad',
        label: '¿Segunda nacionalidad?',
        options: [
          { checkId: 'segundaNacionalidad_no', label: 'No' },
          { checkId: 'segundaNacionalidad_si', label: 'Sí' },
        ],
      },
      {
        id: 'sexo',
        label: 'Sexo',
        options: [
          { checkId: 'sexo_f', label: 'F' },
          { checkId: 'sexo_m', label: 'M' },
        ],
      },
      {
        id: 'tipoVivienda',
        label: 'Tipo de vivienda',
        options: [
          { checkId: 'tipoVivienda_arrendada', label: 'Arrendada' },
          { checkId: 'tipoVivienda_familiar', label: 'Familiar' },
          { checkId: 'tipoVivienda_propia', label: 'Propia' },
        ],
      },
    ],
  },
  {
    id: 'laboral',
    title: 'Información laboral',
    radioGroups: [
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
      {
        id: 'gozaReconocimiento',
        label: '¿Goza de reconocimiento público en razón de su trabajo o el de sus familiares?',
        options: [
          { checkId: 'gozaReconocimiento_no', label: 'No' },
          { checkId: 'gozaReconocimiento_si', label: 'Sí' },
        ],
      },
      {
        id: 'administraRecursos',
        label: '¿Administra recursos públicos?',
        options: [
          { checkId: 'administraRecursos_no', label: 'No' },
          { checkId: 'administraRecursos_si', label: 'Sí' },
        ],
      },
      {
        id: 'personaPublica',
        label: '¿Se considera una persona públicamente reconocida?',
        options: [
          { checkId: 'personaPublica_no', label: 'No' },
          { checkId: 'personaPublica_si', label: 'Sí' },
        ],
      },
      {
        id: 'detentaPoder',
        label: '¿Detenta algún grado de poder público?',
        options: [
          { checkId: 'detentaPoder_no', label: 'No' },
          { checkId: 'detentaPoder_si', label: 'Sí' },
        ],
      },
      {
        id: 'transaccionesMonedaExt',
        label: '¿Realiza transacciones en moneda extranjera?',
        options: [
          { checkId: 'transaccionesMonedaExt_no', label: 'No' },
          { checkId: 'transaccionesMonedaExt_si', label: 'Sí' },
        ],
      },
    ],
    rows: [
      row('profesion', 'actividadEconomicaCIIU'),
      row('empresa'),
      row('tipoContrato', 'antiguedadMeses', 'cargo'),
      row('sectorEconomico'),
      row('direccionOficinaPrincipal', 'barrio'),
      row('telefonoExt', 'fax', 'ciudadOficina'),
      row('empresaMenos1Anio'),
      row('direccionBarrioMenos1', 'telefonoMenos1', 'ciudadMenos1'),
      row('administraRecursos_descripcion'),
      row('personaPublica_explique'),
      row('detentaPoder_explique'),
      row('tipoOperacionesMonedaExt'),
      row('tipoProducto', 'paisProducto'),
      row('ciudadProducto', 'monedaProducto'),
      row('identificacionProducto', 'entidadProducto'),
      row('montoMensualProducto'),
    ],
  },
  {
    id: 'propiedades',
    title: 'Propiedades y bienes',
    subtitle: 'Propiedad raíz del solicitante (hasta 2 activos).',
    rows: [
      row('propiedad_tipoBien_1', 'propiedad_tipoBien_2'),
      row('propiedad_direccion_1', 'propiedad_direccion_2'),
      row('propiedad_ciudad_1', 'propiedad_ciudad_2'),
      row('propiedad_pctParticipacion_1', 'propiedad_pctParticipacion_2'),
      row('propiedad_hipoteca_1', 'propiedad_hipoteca_2'),
      row('propiedad_valorBien_1', 'propiedad_valorBien_2'),
    ],
  },
  {
    id: 'conyuge',
    title: 'Información del cónyuge',
    radioGroups: [
      {
        id: 'conyuge_tipoDoc',
        label: 'Tipo de documento',
        options: [
          { checkId: 'conyuge_tipoDoc_cc', label: 'C.C.' },
          { checkId: 'conyuge_tipoDoc_ce', label: 'C.E.' },
          { checkId: 'conyuge_tipoDoc_pasaporte', label: 'Pasaporte' },
        ],
      },
      {
        id: 'conyuge_sexo',
        label: 'Sexo',
        options: [
          { checkId: 'conyuge_sexo_f', label: 'F' },
          { checkId: 'conyuge_sexo_m', label: 'M' },
        ],
      },
    ],
    rows: [
      row('conyuge_nombres'),
      row('conyuge_apellidos'),
      row('conyuge_fechaNac_dia', 'conyuge_fechaNac_mes', 'conyuge_fechaNac_anio'),
      row('conyuge_noIdentificacion'),
      row('conyuge_lugarNac_ciudad', 'conyuge_lugarNac_pais'),
      row('conyuge_email'),
      row('conyuge_direccion', 'conyuge_ciudad'),
      row('conyuge_telefono', 'conyuge_celular'),
    ],
  },
  {
    id: 'vehiculoSolicitante',
    title: 'Vehículo del solicitante',
    subtitle: 'Hasta 2 vehículos (Activo 1 / Activo 2).',
    rows: [
      row('vehiculo_marca_1', 'vehiculo_marca_2'),
      row('vehiculo_tipo_1', 'vehiculo_tipo_2'),
      row('vehiculo_modelo_1', 'vehiculo_modelo_2'),
      row('vehiculo_placa_1', 'vehiculo_placa_2'),
      row('vehiculo_pctParticipacion_1', 'vehiculo_pctParticipacion_2'),
      row('vehiculo_prenda_1', 'vehiculo_prenda_2'),
      row('vehiculo_cuota_1', 'vehiculo_cuota_2'),
    ],
  },
  {
    id: 'referenciasPersonales',
    title: 'Referencias personales',
    subtitle: 'Diligenciar si el solicitante es empleado o pensionado.',
    subgroups: [
      {
        title: 'Referencia 1',
        rows: [
          row('refPersonal1_nombres'),
          row('refPersonal1_ciudad', 'refPersonal1_antiguedad'),
          row('refPersonal1_telefono', 'refPersonal1_celular', 'refPersonal1_relacion'),
        ],
      },
      {
        title: 'Referencia 2',
        rows: [
          row('refPersonal2_nombres'),
          row('refPersonal2_ciudad', 'refPersonal2_antiguedad'),
          row('refPersonal2_telefono', 'refPersonal2_celular', 'refPersonal2_relacion'),
        ],
      },
    ],
    rows: [],
  },
  {
    id: 'financiera',
    title: 'Información financiera',
    subgroups: [
      {
        title: 'Totales',
        rows: [row('totalActivos', 'totalPasivos', 'totalPatrimonio')],
      },
      {
        title: 'Ingresos y egresos mensuales',
        rows: [
          row('ingreso_salario', 'egreso_hipotecaArriendo'),
          row('ingreso_comisiones', 'egreso_tarjetasCredito'),
          row('ingreso_arriendo', 'egreso_otrosPrestamos'),
          row('ingreso_otros', 'egreso_sostenimiento'),
          row('totalIngresos', 'totalEgresos'),
          row('detalleOtrosIngresos'),
        ],
      },
    ],
    rows: [],
  },
  {
    id: 'referenciasComerciales',
    title: 'Referencias comerciales',
    subtitle: 'Diligenciar si el solicitante es comerciante o independiente.',
    subgroups: [
      {
        title: 'Referencia comercial 1',
        rows: [
          row('refComercial1_nombres'),
          row('refComercial1_ciudad', 'refComercial1_antiguedad'),
          row('refComercial1_telefono', 'refComercial1_celular', 'refComercial1_direccion'),
        ],
      },
      {
        title: 'Referencia comercial 2',
        rows: [
          row('refComercial2_nombres'),
          row('refComercial2_ciudad', 'refComercial2_antiguedad'),
          row('refComercial2_telefono', 'refComercial2_celular', 'refComercial2_direccion'),
        ],
      },
    ],
    rows: [],
  },
  {
    id: 'concesionario',
    title: 'Para uso exclusivo del concesionario',
    subtitle: 'Información del vehículo y crédito.',
    radioGroups: [
      {
        id: 'conc_condicion',
        label: 'Condición',
        options: [
          { checkId: 'conc_nuevo', label: 'Nuevo' },
          { checkId: 'conc_usado', label: 'Usado' },
        ],
      },
      {
        id: 'conc_uso',
        label: 'Uso',
        options: [
          { checkId: 'conc_particular', label: 'Particular' },
          { checkId: 'conc_publico', label: 'Público' },
        ],
      },
    ],
    rows: [
      row('conc_marca', 'conc_precioVenta'),
      row('conc_modelo', 'conc_cuotaInicial'),
      row('conc_tipo', 'conc_valorFinanciar'),
      row('conc_otrosValoresFinanciar'),
      row('conc_plazo', 'conc_tasa', 'conc_plan'),
      row('conc_totalFinanciar'),
    ],
  },
  {
    id: 'autorizaciones',
    title: 'Autorizaciones y declaraciones (página 2)',
    subtitle:
      'Los textos legales se mantienen exactamente como en el documento original. Solo diligencia las respuestas solicitadas.',
    radioGroups: [
      {
        id: 'declA',
        label: 'A. ¿Bajo su cargo está la administración o disposición de recursos públicos?',
        options: [
          { checkId: 'declA_si', label: 'Sí' },
          { checkId: 'declA_no', label: 'No' },
        ],
      },
      {
        id: 'declB',
        label: 'B. ¿Las decisiones de su cargo influyen o impactan en la sociedad?',
        options: [
          { checkId: 'declB_si', label: 'Sí' },
          { checkId: 'declB_no', label: 'No' },
        ],
      },
      {
        id: 'declC',
        label: 'C. ¿La sociedad o los medios de comunicación lo identifican como un personaje público?',
        options: [
          { checkId: 'declC_si', label: 'Sí' },
          { checkId: 'declC_no', label: 'No' },
        ],
      },
      {
        id: 'declD',
        label: 'D. ¿Es ordenador de gastos o tesorero?',
        options: [
          { checkId: 'declD_si', label: 'Sí' },
          { checkId: 'declD_no', label: 'No' },
        ],
      },
    ],
    rows: [
      row('autorizacionEntidad'),
      row('firma_dias', 'firma_mes', 'firma_anio'),
      row('firma_ciudad'),
    ],
  },
];

export function labelFor(fieldId: string): string {
  return FIELD_BY_ID[fieldId]?.label ?? fieldId;
}

/** Índice de la sección (dentro de SECTIONS) que contiene el campo dado, o -1 si no se encuentra. */
export function sectionIndexForField(fieldId: string): number {
  return SECTIONS.findIndex((section) => {
    const inRows = section.rows.some((r) => r.fieldIds.includes(fieldId));
    if (inRows) return true;
    return (
      section.subgroups?.some((sg) => sg.rows.some((r) => r.fieldIds.includes(fieldId))) ?? false
    );
  });
}
