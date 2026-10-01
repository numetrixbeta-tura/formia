import { useMemo, useState } from 'react';
import type { FieldDef, CheckDef } from '../config/pdfFieldMapping';

interface Props {
  fields: FieldDef[];
  checks: CheckDef[];
  selectedId: string | null;
  onSelect: (id: string, kind: 'field' | 'check') => void;
}

export default function FieldListPanel({ fields, checks, selectedId, onSelect }: Props) {
  const [query, setQuery] = useState('');

  const items = useMemo(() => {
    const all = [
      ...fields.map((f, i) => ({ ...f, kind: 'field' as const, index: i + 1 })),
      ...checks.map((c, i) => ({ ...c, kind: 'check' as const, index: i + 1 })),
    ];
    const q = query.trim().toLowerCase();
    const filtered = q
      ? all.filter((it) => it.id.toLowerCase().includes(q) || it.label.toLowerCase().includes(q))
      : all;
    return filtered.sort((a, b) => a.page - b.page || a.id.localeCompare(b.id));
  }, [fields, checks, query]);

  return (
    <div className="field-list-panel">
      <input
        type="text"
        className="field-list-panel__search"
        placeholder="Buscar campo por nombre o id…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="field-list-panel__count">
        {items.length} de {fields.length + checks.length} campos
      </div>
      <ul className="field-list-panel__list">
        {items.map((it, idx) => (
          <li key={`${it.kind}:${it.id}`}>
            <button
              type="button"
              className={`field-list-panel__item ${selectedId === it.id ? 'field-list-panel__item--active' : ''}`}
              onClick={() => onSelect(it.id, it.kind)}
            >
              <span className="field-list-panel__num">{String(idx + 1).padStart(3, '0')}</span>
              <span className="field-list-panel__label">{it.label}</span>
              <span className="field-list-panel__badge">
                p{it.page} · {it.kind === 'check' ? 'casilla' : 'texto'}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
