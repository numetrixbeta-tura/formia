import { PDFDocument, StandardFonts, rgb, TextAlignment, PDFNull } from 'pdf-lib';
import { getEffectiveFieldMap, getEffectiveCheckMap } from './fieldOverrides';
import type { FormValues } from '../types';

const TEMPLATE_URL = '/templates/formulario-original.pdf';

let cachedTemplateBytes: ArrayBuffer | null = null;

// El archivo public/templates/formulario-original.pdf NUNCA se modifica en disco.
// Cada generación carga sus bytes originales y trabaja sobre una copia en memoria
// (PDFDocument.load crea un documento nuevo); la plantilla maestra permanece intacta.
async function loadTemplateBytes(): Promise<ArrayBuffer> {
  if (cachedTemplateBytes) return cachedTemplateBytes;
  const res = await fetch(TEMPLATE_URL);
  if (!res.ok) {
    throw new Error('No se pudo cargar la plantilla PDF original.');
  }
  cachedTemplateBytes = await res.arrayBuffer();
  return cachedTemplateBytes;
}

function alignmentFor(align: 'left' | 'center' | 'right'): TextAlignment {
  if (align === 'center') return TextAlignment.Center;
  if (align === 'right') return TextAlignment.Right;
  return TextAlignment.Left;
}

// Deriva el id del grupo de radio a partir del id de un check individual,
// p.ej. "tipoDocumento_cc" -> "tipoDocumento". Debe coincidir con los ids
// usados en config/sections.ts.
export function groupIdFor(checkId: string): string {
  const knownSuffixes = [
    '_si', '_no', '_f', '_m', '_cc', '_ce', '_pasaporte',
    '_credito', '_leasing', '_titular', '_codeudor', '_apoderado',
    '_empleado', '_pensionado', '_transportador', '_independiente', '_rentista',
    '_arrendada', '_familiar', '_propia',
    '_nuevo', '_usado', '_particular', '_publico',
  ];
  for (const suffix of knownSuffixes) {
    if (checkId.endsWith(suffix)) {
      if (['conc_nuevo', 'conc_usado'].includes(checkId)) return 'conc_condicion';
      if (['conc_particular', 'conc_publico'].includes(checkId)) return 'conc_uso';
      if (['calidad_titular', 'calidad_codeudor', 'calidad_apoderado'].includes(checkId)) return 'calidad';
      if (['tipoSolicitud_credito', 'tipoSolicitud_leasing'].includes(checkId)) return 'tipoSolicitud';
      return checkId.slice(0, -suffix.length);
    }
  }
  return checkId;
}

export interface GenerateOptions {
  /** Si es true, el formulario se aplana (los campos AcroForm dejan de ser editables). */
  flatten?: boolean;
}

/**
 * pdf-lib's form.flatten() deja referencias nulas huérfanas en el arreglo
 * /Annots de cada página en lugar de eliminarlas (los widgets ya están
 * "quemados" en el contenido de la página, pero la referencia vacía queda).
 * Esto no corrompe el archivo, pero algunos visores (p. ej. Poppler/pdftoppm)
 * dibujan un resaltado genérico para esas anotaciones huérfanas. Se limpian
 * aquí para que el PDF aplanado sea visualmente idéntico en cualquier lector.
 */
function removeOrphanedAnnotations(pdfDoc: PDFDocument): void {
  for (const page of pdfDoc.getPages()) {
    const annots = page.node.Annots();
    if (!annots) continue;
    for (let i = annots.size() - 1; i >= 0; i--) {
      const ref = annots.get(i);
      const obj = pdfDoc.context.lookup(ref);
      if (obj === undefined || obj === PDFNull) {
        annots.remove(i);
      }
    }
  }
}

/**
 * Genera el PDF final creando CAMPOS DE FORMULARIO PDF (AcroForm) reales sobre una
 * copia del PDF original — nunca dibuja texto libre sobre la página con drawText().
 * El PDF original (líneas, tablas, encabezados, textos) permanece intacto; los
 * campos son rectángulos transparentes ubicados sobre los espacios en blanco.
 */
export async function generateFilledPdf(
  values: FormValues,
  options: GenerateOptions = {}
): Promise<Uint8Array> {
  const templateBytes = await loadTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);

  const pages = pdfDoc.getPages();
  if (pages.length !== 2) {
    // Nos aseguramos de conservar exactamente las 2 páginas originales.
    throw new Error('La plantilla original no tiene 2 páginas; no se debe continuar.');
  }

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const form = pdfDoc.getForm();
  const textColor = rgb(0.07, 0.09, 0.16);

  const fieldMap = getEffectiveFieldMap();
  const checkMap = getEffectiveCheckMap();

  // --- Campos de texto reales (AcroForm text fields) ---
  for (const field of fieldMap) {
    const page = pages[field.page - 1];
    const textField = form.createTextField(field.id);

    textField.addToPage(page, {
      x: field.x,
      y: field.y,
      width: field.width,
      height: field.height,
      // Campo visualmente transparente: pdf-lib aplica fondo blanco y borde negro
      // por defecto si estas claves no se pasan explícitamente como `undefined` —
      // así se evita ocultar las líneas/tablas/textos originales del PDF debajo.
      borderWidth: 0,
      borderColor: undefined,
      backgroundColor: undefined,
      font,
      textColor,
    });

    textField.setAlignment(alignmentFor(field.align));
    textField.setFontSize(field.fontSize); // tamaño fijo: nunca se reduce automáticamente
    if (field.maxLength) {
      textField.setMaxLength(field.maxLength);
    }

    const value = values[field.id];
    if (value) {
      textField.setText(value);
    }
  }

  // --- Casillas reales (AcroForm checkboxes) sobre las casillas originales ---
  for (const check of checkMap) {
    const page = pages[check.page - 1];
    const checkBox = form.createCheckBox(check.id);

    checkBox.addToPage(page, {
      x: check.x,
      y: check.y,
      width: check.width,
      height: check.height,
      borderWidth: 0,
      borderColor: undefined,
      backgroundColor: undefined,
    });

    const groupSelection = values[groupIdFor(check.id)];
    if (groupSelection === check.id) {
      checkBox.check();
    }
  }

  // Regenera las apariencias visuales de todos los campos con la fuente incrustada,
  // para que el valor se vea igual en cualquier lector de PDF (no depende de que el
  // visor tenga "NeedAppearances" activado).
  form.updateFieldAppearances(font);

  // Los espacios de "Firma y CC" y "Huella Dactilar" del PDF original NO tienen
  // campo asociado en FIELD_MAP/CHECK_MAP a propósito: quedan intactos y vacíos
  // para diligenciarse físicamente después de imprimir.

  if (options.flatten) {
    form.flatten();
    removeOrphanedAnnotations(pdfDoc);
  }

  // useObjectStreams:false produce una tabla xref clásica (máxima compatibilidad
  // con lectores/impresoras de PDF, evita advertencias de xref en algunos motores).
  return pdfDoc.save({ useObjectStreams: false });
}

/** Aplana un PDF ya generado (los campos dejan de ser editables, el valor queda integrado visualmente). */
export async function flattenPdf(bytes: Uint8Array): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(bytes);
  const form = pdfDoc.getForm();
  form.flatten();
  removeOrphanedAnnotations(pdfDoc);
  return pdfDoc.save({ useObjectStreams: false });
}

export async function getTemplatePageCount(): Promise<number> {
  const templateBytes = await loadTemplateBytes();
  const pdfDoc = await PDFDocument.load(templateBytes);
  return pdfDoc.getPageCount();
}
