// Modelo de datos del formulario. Todos los valores son texto (tal como se
// escriben sobre el PDF). Las selecciones de casillas se guardan como el id
// del CheckDef seleccionado dentro de cada grupo (ver config/pdfFieldMapping.ts).

export type FormValues = Record<string, string>;

export interface IdentityAttachments {
  front: File | null;
  back: File | null;
  pdf: File | null;
}

export interface ValidationError {
  fieldId: string;
  message: string;
}

export interface SubmissionResult {
  requestNumber: string;
}

export interface DraftMeta {
  savedAt: string;
  version: number;
}
