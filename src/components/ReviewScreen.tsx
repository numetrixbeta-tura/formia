import { SECTIONS, labelFor, sectionIndexForField } from '../config/sections';
import type { FormValues, IdentityAttachments, ValidationError } from '../types';

interface Props {
  values: FormValues;
  errors: ValidationError[];
  attachments: IdentityAttachments;
  onEditSection: (index: number, fieldId?: string) => void;
}

function allFieldIdsFor(sectionIndex: number): string[] {
  const section = SECTIONS[sectionIndex];
  const ids: string[] = [];
  section.rows.forEach((r) => ids.push(...r.fieldIds));
  section.subgroups?.forEach((sg) => sg.rows.forEach((r) => ids.push(...r.fieldIds)));
  return ids;
}

function selectedLabelsFor(sectionIndex: number, values: FormValues): string[] {
  const section = SECTIONS[sectionIndex];
  const labels: string[] = [];
  section.radioGroups?.forEach((g) => {
    const sel = values[g.id];
    const opt = g.options.find((o) => o.checkId === sel);
    if (opt) labels.push(`${g.label}: ${opt.label}`);
  });
  return labels;
}

interface GroupedError {
  sectionIndex: number;
  sectionTitle: string;
  items: ValidationError[];
}

function groupErrorsBySection(errors: ValidationError[]): GroupedError[] {
  const groups = new Map<number, GroupedError>();
  for (const err of errors) {
    const sectionIndex = sectionIndexForField(err.fieldId);
    const sectionTitle = sectionIndex >= 0 ? SECTIONS[sectionIndex].title : 'Otros campos';
    const key = sectionIndex; // -1 agrupa cualquier campo no ubicado en una sección conocida
    if (!groups.has(key)) {
      groups.set(key, { sectionIndex, sectionTitle, items: [] });
    }
    groups.get(key)!.items.push(err);
  }
  // Mantener el orden de las secciones tal como aparecen en el wizard.
  return Array.from(groups.values()).sort((a, b) => a.sectionIndex - b.sectionIndex);
}

export default function ReviewScreen({ values, errors, attachments, onEditSection }: Props) {
  const groupedErrors = groupErrorsBySection(errors);

  return (
    <div className="review-screen">
      <header className="section-form__header">
        <h2>Revisión final</h2>
        <p className="section-form__subtitle">
          Revisa la información antes de generar el PDF. Puedes volver a cualquier sección para corregir datos.
        </p>
      </header>

      {errors.length > 0 && (
        <div className="alert alert--error error-summary">
          <p className="error-summary__title">
            🔴 Hay {errors.length} {errors.length === 1 ? 'campo' : 'campos'} por corregir
          </p>
          {groupedErrors.map((group) => (
            <div className="error-summary__group" key={group.sectionIndex}>
              <p className="error-summary__section">{group.sectionTitle}</p>
              <ul className="error-summary__list">
                {group.items.map((err) => (
                  <li key={err.fieldId} className="error-summary__item">
                    <span>
                      <strong>{labelFor(err.fieldId)}:</strong> {err.message}
                    </span>
                    <button
                      type="button"
                      className="btn btn--ghost btn--sm"
                      onClick={() => onEditSection(group.sectionIndex, err.fieldId)}
                      disabled={group.sectionIndex < 0}
                    >
                      Corregir
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {SECTIONS.map((section, idx) => {
        const ids = allFieldIdsFor(idx);
        const filled = ids.filter((id) => values[id]?.trim());
        const radioLabels = selectedLabelsFor(idx, values);
        return (
          <div className="review-card" key={section.id}>
            <div className="review-card__header">
              <h3>{section.title}</h3>
              <button type="button" className="btn btn--ghost btn--sm" onClick={() => onEditSection(idx)}>
                Editar
              </button>
            </div>
            {filled.length === 0 && radioLabels.length === 0 ? (
              <p className="review-card__empty">Sin información diligenciada.</p>
            ) : (
              <dl className="review-card__grid">
                {radioLabels.map((l) => (
                  <div key={l} className="review-card__item review-card__item--full">
                    <dt>Selección</dt>
                    <dd>{l}</dd>
                  </div>
                ))}
                {filled.map((id) => (
                  <div key={id} className="review-card__item">
                    <dt>{labelFor(id)}</dt>
                    <dd>{id === 'firmaDigital' ? 'Firma digital registrada' : id === 'fechaNacimiento' ? new Date(`${values[id]}T00:00:00`).toLocaleDateString('es-CO') : values[id]}</dd>
                  </div>
                ))}
                {idx === 2 && (
                  <div className="review-card__item review-card__item--full">
                    <dt>Documento de identidad</dt>
                    <dd>
                      {attachments.pdf
                        ? `PDF: ${attachments.pdf.name}`
                        : attachments.front && attachments.back
                          ? `Frente: ${attachments.front.name} · Reverso: ${attachments.back.name}`
                          : 'Pendiente de adjuntar'}
                    </dd>
                  </div>
                )}
              </dl>
            )}
          </div>
        );
      })}
    </div>
  );
}
