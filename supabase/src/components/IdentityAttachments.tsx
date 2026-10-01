
import type { IdentityAttachments } from '../types';

interface Props {
  attachments: IdentityAttachments;
  onChange: (next: IdentityAttachments) => void;
  error?: string;
}

function acceptImage(file: File | null) {
  return file && (file.type === 'image/jpeg' || file.type === 'image/png') ? file : null;
}

export default function IdentityAttachments({ attachments, onChange, error }: Props) {
  const setFile = (key: keyof IdentityAttachments, file: File | null) => {
    onChange({ ...attachments, [key]: file });
  };

  return (
    <div id="field-documentosIdentidad" className={`attachments-field ${error ? 'attachments-field--error' : ''}`}>
      <div className="attachments-field__header">
        <div>
          <h3>Documento de identidad</h3>
          <p>Adjunta la cédula por ambos lados en foto, o un PDF que contenga ambos lados.</p>
        </div>
      </div>

      <div className="attachment-grid">
        <label className="attachment-card">
          <span className="attachment-card__title">Frente de la cédula</span>
          <span className="attachment-card__hint">Foto JPG o PNG</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            onChange={(e) => setFile('front', acceptImage(e.target.files?.[0] ?? null))}
          />
          <span className="attachment-card__file">{attachments.front?.name ?? 'Seleccionar archivo'}</span>
        </label>

        <label className="attachment-card">
          <span className="attachment-card__title">Reverso de la cédula</span>
          <span className="attachment-card__hint">Foto JPG o PNG</span>
          <input
            type="file"
            accept="image/jpeg,image/png"
            capture="environment"
            onChange={(e) => setFile('back', acceptImage(e.target.files?.[0] ?? null))}
          />
          <span className="attachment-card__file">{attachments.back?.name ?? 'Seleccionar archivo'}</span>
        </label>

        <label className="attachment-card attachment-card--pdf">
          <span className="attachment-card__title">Cédula en PDF</span>
          <span className="attachment-card__hint">Un PDF con ambos lados</span>
          <input
            type="file"
            accept="application/pdf,.pdf"
            onChange={(e) => {
              const file = e.target.files?.[0] ?? null;
              setFile('pdf', file && (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) ? file : null);
            }}
          />
          <span className="attachment-card__file">{attachments.pdf?.name ?? 'Seleccionar archivo'}</span>
        </label>
      </div>

      {error && <span className="field__error-msg">{error}</span>}
      <p className="attachments-field__note">Para continuar basta con cargar frente + reverso en foto o un PDF que contenga ambos lados.</p>
    </div>
  );
}
