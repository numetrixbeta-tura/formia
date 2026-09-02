import { useEffect, useState } from 'react';

interface Props {
  pdfBytes: Uint8Array | null;
  onClose: () => void;
  onDownload: (flatten: boolean) => void;
}

export default function PdfPreviewModal({ pdfBytes, onClose, onDownload }: Props) {
  const [url, setUrl] = useState<string | null>(null);
  const [flatten, setFlatten] = useState(true);

  useEffect(() => {
    if (!pdfBytes) return;
    const blob = new Blob([pdfBytes.slice()], { type: 'application/pdf' });
    const objUrl = URL.createObjectURL(blob);
    setUrl(objUrl);
    return () => URL.revokeObjectURL(objUrl);
  }, [pdfBytes]);

  if (!pdfBytes) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="modal__header">
          <h2>Vista previa del PDF</h2>
          <button className="btn btn--ghost btn--sm" onClick={onClose}>
            Cerrar
          </button>
        </div>
        <div className="modal__body modal__body--pdf">
          {url && (
            <iframe title="Vista previa del formulario diligenciado" src={url} className="pdf-frame" />
          )}
        </div>
        <div className="modal__footer modal__footer--split">
          <label className="flatten-toggle">
            <input type="checkbox" checked={flatten} onChange={(e) => setFlatten(e.target.checked)} />
            Aplanar PDF para impresión (recomendado)
          </label>
          <div className="modal__footer-actions">
            <button className="btn btn--ghost" onClick={onClose}>
              Regresar a editar
            </button>
            <button className="btn btn--primary" onClick={() => onDownload(flatten)}>
              Descargar PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
