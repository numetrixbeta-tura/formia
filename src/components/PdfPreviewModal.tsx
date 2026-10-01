import { useEffect, useState } from 'react';
import { flattenPdf } from '../services/pdfGenerator';

interface Props {
  pdfBytes: Uint8Array | null;
  onClose: () => void;
  onDownload: (flatten: boolean) => void;
  onShare: (flatten: boolean) => Promise<void>;
}

export default function PdfPreviewModal({ pdfBytes, onClose, onDownload, onShare }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [flatten, setFlatten] = useState(true);
  const [sharing, setSharing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);

  useEffect(() => {
    if (!pdfBytes) return;
    let active = true;
    let objUrl: string | null = null;
    void flattenPdf(pdfBytes).then((previewBytes) => {
      if (!active) return;
      const blob = new Blob([previewBytes.slice()], { type: 'application/pdf' });
      objUrl = URL.createObjectURL(blob);
      setUrl(objUrl);
    });
    return () => {
      active = false;
      if (objUrl) URL.revokeObjectURL(objUrl);
      setUrl(null);
      setShareError(null);
    };
  }, [pdfBytes]);

  if (!pdfBytes) return null;

  const handleShare = async () => {
    setSharing(true);
    setShareError(null);
    try {
      await onShare(flatten);
    } catch (error) {
      setShareError(error instanceof Error ? error.message : 'No fue posible abrir las opciones para enviar el documento.');
    } finally {
      setSharing(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Vista previa del PDF completo</h2>
          <button
            type="button"
            className="modal__close"
            onClick={onClose}
            aria-label="Cerrar vista previa"
            title="Cerrar vista previa"
          >
            ×
          </button>
        </div>
        <div className="modal__body modal__body--pdf">
          {url && <iframe title="Vista previa del formulario y documento de identidad" src={url} className="pdf-frame" />}
        </div>
        <div className="modal__footer modal__footer--split">
          <div className="modal__footer-info">
            <label className="flatten-toggle">
              <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
              Aplanar PDF para impresión (recomendado)
            </label>
            <p className="attachments-field__note">La cédula adjunta ya está incluida dentro de este mismo PDF, después de las 2 páginas del formulario.</p>
            {shareError && <p className="share-error">{shareError}</p>}
          </div>
          <div className="modal__footer-actions">
            <button type="button" className="btn btn--ghost" onClick={onClose}>
              Cerrar
            </button>
            <button type="button" className="btn btn--secondary" onClick={() => void handleShare()} disabled={sharing}>
              {sharing ? 'Preparando…' : 'Enviar al banco'}
            </button>
            <button type="button" className="btn btn--primary" onClick={() => onDownload(flatten)}>
              Descargar PDF completo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
