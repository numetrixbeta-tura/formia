import { PDFDocument, StandardFonts, rgb, TextAlignment, PDFNull } from 'pdf-lib';
import { getEffectiveFieldMap, getEffectiveCheckMap } from './fieldOverrides';
import type { FormValues, IdentityAttachments } from '../types';

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

/** Los widgets AcroForm deben ser invisibles sobre la plantilla original. */
function makeWidgetInvisible(field: { acroField: { getWidgets: () => unknown[] } }) {
  for (const rawWidget of field.acroField.getWidgets()) {
    const widget = rawWidget as { getOrCreateBorderStyle: () => { setWidth: (width: number) => void } };
    widget.getOrCreateBorderStyle().setWidth(0);
  }
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

/** Área exacta de la línea original "FIRMA Y CC" en la página 2.
 * Coordenadas PDF en puntos, origen inferior izquierdo. La firma se coloca
 * sobre la línea, sin modificar el texto ni la huella del documento original.
 */
export const DIGITAL_SIGNATURE_BOX = {
  page: 2 as const,
  x: 145,
  y: 248,
  width: 205,
  height: 42,
};

function splitBirthDate(value: string | undefined): { day: string; month: string; year: string } {
  if (!value) return { day: '', month: '', year: '' };
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  return match ? { day: match[3], month: match[2], year: match[1] } : { day: '', month: '', year: '' };
}


async function identityPdfFromAttachments(attachments: IdentityAttachments): Promise<Uint8Array | null> {
  if (attachments.pdf) {
    return new Uint8Array(await attachments.pdf.arrayBuffer());
  }

  if (!attachments.front || !attachments.back) return null;

  const identityDoc = await PDFDocument.create();
  const pageSize: [number, number] = [595.28, 841.89];
  const margin = 28;

  for (const file of [attachments.front, attachments.back]) {
    const page = identityDoc.addPage(pageSize);
    const bytes = new Uint8Array(await file.arrayBuffer());
    const image = file.type === 'image/png'
      ? await identityDoc.embedPng(bytes)
      : await identityDoc.embedJpg(bytes);
    const maxW = pageSize[0] - margin * 2;
    const maxH = pageSize[1] - margin * 2;
    const scale = Math.min(maxW / image.width, maxH / image.height);
    const width = image.width * scale;
    const height = image.height * scale;
    page.drawImage(image, {
      x: (pageSize[0] - width) / 2,
      y: (pageSize[1] - height) / 2,
      width,
      height,
    });
  }

  return identityDoc.save({ useObjectStreams: false });
}

/**
 * Adjunta la cédula al mismo PDF de la solicitud. Las dos páginas originales
 * del formulario permanecen intactas; la identificación se agrega después
 * de ellas como páginas adicionales.
 */
export async function appendIdentityToPdf(
  formBytes: Uint8Array,
  attachments: IdentityAttachments,
): Promise<Uint8Array> {
  const identityBytes = await identityPdfFromAttachments(attachments);
  if (!identityBytes) return formBytes;

  const formDoc = await PDFDocument.load(formBytes);
  const identityDoc = await PDFDocument.load(identityBytes);
  const copiedPages = await formDoc.copyPages(identityDoc, identityDoc.getPageIndices());
  for (const page of copiedPages) formDoc.addPage(page);

  return formDoc.save({ useObjectStreams: false });
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
      borderWidth: 0,
      borderColor: undefined,
      backgroundColor: undefined,
      font,
      textColor,
    });
    makeWidgetInvisible(textField);

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
    makeWidgetInvisible(checkBox);

    const groupSelection = values[groupIdFor(check.id)];
    if (groupSelection === check.id) {
      checkBox.check();
    }
  }

  // La fecha de nacimiento se captura como un único control en pantalla,
  // pero se conserva el mapeo original de tres espacios del PDF.
  const birth = splitBirthDate(values.fechaNacimiento);
  const birthValues: Record<string, string> = {
    fechaNacimiento_dia: birth.day,
    fechaNacimiento_mes: birth.month,
    fechaNacimiento_anio: birth.year,
  };
  for (const id of Object.keys(birthValues)) {
    const field = fieldMap.find((item) => item.id === id);
    const value = birthValues[id];
    if (!field || !value) continue;
    const textField = form.getTextField(field.id);
    textField.setText(value);
  }

  // Firma digital real: se incrusta como imagen PNG en el espacio original
  // "FIRMA Y CC". El usuario puede borrarla y volver a firmar desde la interfaz.
  if (values.firmaDigital) {
    try {
      const signatureImage = await pdfDoc.embedPng(values.firmaDigital);
      const imageScale = Math.min(
        DIGITAL_SIGNATURE_BOX.width / signatureImage.width,
        DIGITAL_SIGNATURE_BOX.height / signatureImage.height
      );
      const drawWidth = signatureImage.width * imageScale;
      const drawHeight = signatureImage.height * imageScale;
      const page = pages[DIGITAL_SIGNATURE_BOX.page - 1];
      page.drawImage(signatureImage, {
        x: DIGITAL_SIGNATURE_BOX.x + (DIGITAL_SIGNATURE_BOX.width - drawWidth) / 2,
        y: DIGITAL_SIGNATURE_BOX.y + (DIGITAL_SIGNATURE_BOX.height - drawHeight) / 2,
        width: drawWidth,
        height: drawHeight,
      });
    } catch {
      throw new Error('La firma digital no tiene un formato válido. Vuelve a firmar e inténtalo nuevamente.');
    }
  }

  // Regenera las apariencias visuales de todos los campos con la fuente incrustada,
  // para que el valor se vea igual en cualquier lector de PDF (no depende de que el
  // visor tenga "NeedAppearances" activado).
  form.updateFieldAppearances(font);

  // La huella dactilar permanece intacta y vacía; solo se diligencia la firma digital.

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
