import { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import workerSrc from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerSrc;

const TEMPLATE_URL = '/templates/formulario-original.pdf';

let cachedDocPromise: Promise<pdfjsLib.PDFDocumentProxy> | null = null;
function getTemplateDoc() {
  if (!cachedDocPromise) {
    cachedDocPromise = pdfjsLib.getDocument(TEMPLATE_URL).promise;
  }
  return cachedDocPromise;
}

interface Props {
  page: 1 | 2;
  zoom: number;
  /** Se invoca una vez conocidas las dimensiones reales de la página en puntos PDF. */
  onPageSize?: (size: { pdfWidth: number; pdfHeight: number }) => void;
}

/** Renderiza la página real del PDF original (nunca modificado) como imagen de fondo. */
export default function PdfPageCanvas({ page, zoom, onPageSize }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const doc = await getTemplateDoc();
        if (doc.numPages !== 2) {
          throw new Error(`La plantilla debería tener 2 páginas y tiene ${doc.numPages}.`);
        }
        const pdfPage = await doc.getPage(page);
        const baseViewport = pdfPage.getViewport({ scale: 1 });
        onPageSize?.({ pdfWidth: baseViewport.width, pdfHeight: baseViewport.height });

        // Renderizamos a una densidad fija generosa (2x) y luego escalamos por CSS
        // con el zoom, para que el texto del PDF se vea nítido en cualquier nivel.
        const renderScale = 2 * zoom;
        const viewport = pdfPage.getViewport({ scale: renderScale });
        const canvas = canvasRef.current;
        if (!canvas) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${viewport.width / 2}px`;
        canvas.style.height = `${viewport.height / 2}px`;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        await pdfPage.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudo renderizar la plantilla PDF.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, zoom]);

  return (
    <div className="pdf-canvas-wrap">
      {loading && <div className="pdf-canvas-loading">Cargando plantilla…</div>}
      {error && <div className="pdf-canvas-error">{error}</div>}
      <canvas ref={canvasRef} />
    </div>
  );
}
