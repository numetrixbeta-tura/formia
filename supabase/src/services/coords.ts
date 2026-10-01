/**
 * Sistema de coordenadas del Editor de Plantilla.
 *
 * - PDF: origen inferior-izquierdo, unidades = puntos PDF (pt). Este es el
 *   sistema que usa pdfFieldMapping.ts y pdfGenerator.ts. NUNCA cambia con el zoom.
 * - Pantalla/canvas: origen superior-izquierdo, unidades = píxeles CSS,
 *   escalados por el nivel de zoom actual.
 *
 * Todas las conversiones entre ambos sistemas pasan por las funciones de este
 * archivo — ningún componente debe reimplementar esta aritmética.
 */

export interface PageGeometry {
  /** Ancho de la página en puntos PDF (595 para A4 vertical). */
  pdfWidth: number;
  /** Alto de la página en puntos PDF (842 para A4 vertical). */
  pdfHeight: number;
  /** Factor de zoom actual del editor (1 = 100%). */
  zoom: number;
}

/** píxeles de canvas por punto PDF, al zoom actual. */
export function scaleFor(geometry: PageGeometry): number {
  return geometry.zoom;
}

/** Convierte un rectángulo en coordenadas PDF (x,y = esquina inferior-izq.) a
 * coordenadas de pantalla (x,y = esquina superior-izq.), en píxeles CSS. */
export function pdfRectToScreen(
  rect: { x: number; y: number; width: number; height: number },
  geometry: PageGeometry
) {
  const scale = scaleFor(geometry);
  const screenX = rect.x * scale;
  const screenTop = (geometry.pdfHeight - rect.y - rect.height) * scale;
  return {
    left: screenX,
    top: screenTop,
    width: rect.width * scale,
    height: rect.height * scale,
  };
}

/** Convierte un rectángulo en coordenadas de pantalla (top-left, px CSS) a
 * coordenadas PDF (bottom-left, puntos). Redondea a 1 decimal. */
export function screenRectToPdf(
  rect: { left: number; top: number; width: number; height: number },
  geometry: PageGeometry
) {
  const scale = scaleFor(geometry);
  const widthPt = round1(rect.width / scale);
  const heightPt = round1(rect.height / scale);
  const xPt = round1(rect.left / scale);
  const yPt = round1(geometry.pdfHeight - rect.top / scale - heightPt);
  return { x: xPt, y: yPt, width: widthPt, height: heightPt };
}

/** Convierte un desplazamiento en píxeles de pantalla a un desplazamiento en
 * puntos PDF (dy se invierte porque los ejes Y son opuestos). */
export function screenDeltaToPdfDelta(dx: number, dy: number, geometry: PageGeometry) {
  const scale = scaleFor(geometry);
  return { dx: round1(dx / scale), dy: round1(-dy / scale) };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3];

export const NUDGE_INCREMENTS = [0.5, 1, 2, 5];
