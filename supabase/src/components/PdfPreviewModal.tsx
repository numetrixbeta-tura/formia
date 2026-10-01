import { useEffect, useMemo, type CSSProperties } from 'react';

type Props = {
  pdfBytes: Uint8Array | null;
  onClose: () => void;
  onDownload?: (flatten: boolean) => void | Promise<void>;
  onShare?: () => void | Promise<void>;
};

export default function PdfPreviewModal({ pdfBytes, onClose, onDownload, onShare }: Props) {
  const url = useMemo(() => {
    if (!pdfBytes) return null;
    const copy = new Uint8Array(pdfBytes.byteLength);
    copy.set(pdfBytes);
    return URL.createObjectURL(new Blob([copy], { type: 'application/pdf' }));
  }, [pdfBytes]);

  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url);
  }, [url]);

  if (!pdfBytes || !url) return null;

  return (
    <div style={overlayStyle} role="dialog" aria-modal="true" aria-label="Vista previa del PDF">
      <div style={modalStyle}>
        <div style={headerStyle}>
          <strong>Vista previa del PDF</strong>
          <button type="button" onClick={onClose} style={closeStyle} aria-label="Cerrar">×</button>
        </div>
        <iframe title="Vista previa del PDF" src={url} style={frameStyle} />
        <div style={footerStyle}>
          {onDownload && <button type="button" onClick={() => onDownload(false)}>Descargar PDF</button>}
          {onShare && <button type="button" onClick={onShare}>Compartir</button>}
          <button type="button" onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

const overlayStyle: CSSProperties = {
  position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,.65)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
};
const modalStyle: CSSProperties = {
  width: 'min(1100px, 96vw)', height: 'min(850px, 94vh)', background: '#fff',
  borderRadius: 14, overflow: 'hidden', display: 'flex', flexDirection: 'column',
};
const headerStyle: CSSProperties = {
  minHeight: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  padding: '0 16px', borderBottom: '1px solid #ddd',
};
const closeStyle: CSSProperties = { border: 0, background: 'transparent', fontSize: 28, cursor: 'pointer' };
const frameStyle: CSSProperties = { flex: 1, width: '100%', border: 0 };
const footerStyle: CSSProperties = { display: 'flex', gap: 8, justifyContent: 'flex-end', padding: 12, borderTop: '1px solid #ddd' };
