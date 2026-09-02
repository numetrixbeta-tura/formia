import { useState } from 'react';
import type { FieldDef, CheckDef } from '../config/pdfFieldMapping';
import { NUDGE_INCREMENTS } from '../services/coords';

type Selected =
  | { kind: 'field'; def: FieldDef }
  | { kind: 'check'; def: CheckDef }
  | null;

interface Props {
  selected: Selected;
  onChangeField: (id: string, patch: Partial<FieldDef>) => void;
  onChangeCheck: (id: string, patch: Partial<CheckDef>) => void;
  onResetField: (id: string) => void;
  onTestValueChange: (id: string, value: string) => void;
  testValue: string;
}

export default function PropertyPanel({
  selected,
  onChangeField,
  onChangeCheck,
  onResetField,
  onTestValueChange,
  testValue,
}: Props) {
  const [nudge, setNudge] = useState(1);

  if (!selected) {
    return (
      <aside className="property-panel property-panel--empty">
        <p>Selecciona un campo en el PDF o en la lista para ver y editar sus propiedades.</p>
      </aside>
    );
  }

  const { kind, def } = selected;
  const isField = kind === 'field';

  const patch = (p: Record<string, unknown>) => {
    if (isField) onChangeField(def.id, p as Partial<FieldDef>);
    else onChangeCheck(def.id, p as Partial<CheckDef>);
  };

  const nudgeBy = (dx: number, dy: number) => {
    patch({ x: round1(def.x + dx), y: round1(def.y + dy) });
  };

  return (
    <aside className="property-panel">
      <div className="property-panel__header">
        <span className="property-panel__kind">{isField ? 'Campo de texto' : 'Casilla'}</span>
        <h3>{def.label}</h3>
        <code>{def.id}</code>
      </div>

      <div className="property-grid">
        <label>
          Página
          <select
            value={def.page}
            onChange={(e) => patch({ page: Number(e.target.value) as 1 | 2 })}
          >
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </label>

        <label>
          X (pt)
          <input type="number" step="0.1" value={def.x} onChange={(e) => patch({ x: Number(e.target.value) })} />
        </label>
        <label>
          Y (pt)
          <input type="number" step="0.1" value={def.y} onChange={(e) => patch({ y: Number(e.target.value) })} />
        </label>
        <label>
          Ancho (pt)
          <input
            type="number"
            step="0.1"
            value={def.width}
            onChange={(e) => patch({ width: Number(e.target.value) })}
          />
        </label>
        <label>
          Alto (pt)
          <input
            type="number"
            step="0.1"
            value={def.height}
            onChange={(e) => patch({ height: Number(e.target.value) })}
          />
        </label>

        {isField && (
          <>
            <label>
              Tamaño de fuente (pt)
              <input
                type="number"
                step="0.5"
                min={6.5}
                value={(def as FieldDef).fontSize}
                onChange={(e) => patch({ fontSize: Number(e.target.value) })}
              />
            </label>
            <label>
              Alineación horizontal
              <select
                value={(def as FieldDef).align}
                onChange={(e) => patch({ align: e.target.value })}
              >
                <option value="left">Izquierda</option>
                <option value="center">Centro</option>
                <option value="right">Derecha</option>
              </select>
            </label>
            <label>
              Longitud máxima
              <input
                type="number"
                min={0}
                value={(def as FieldDef).maxLength ?? ''}
                placeholder="Sin límite"
                onChange={(e) => patch({ maxLength: e.target.value ? Number(e.target.value) : undefined })}
              />
            </label>
          </>
        )}

        <label className="property-grid__full">
          Etiqueta
          <input type="text" value={def.label} onChange={(e) => patch({ label: e.target.value })} />
        </label>
      </div>

      <div className="nudge-panel">
        <span className="nudge-panel__label">Ajuste fino</span>
        <div className="nudge-panel__increments">
          {NUDGE_INCREMENTS.map((v) => (
            <button
              key={v}
              type="button"
              className={`chip chip--sm ${nudge === v ? 'chip--active' : ''}`}
              onClick={() => setNudge(v)}
            >
              {v} pt
            </button>
          ))}
        </div>
        <div className="nudge-panel__dpad">
          <button type="button" onClick={() => nudgeBy(0, nudge)} title="Arriba">
            ↑
          </button>
          <div className="nudge-panel__row">
            <button type="button" onClick={() => nudgeBy(-nudge, 0)} title="Izquierda">
              ←
            </button>
            <button type="button" onClick={() => nudgeBy(nudge, 0)} title="Derecha">
              →
            </button>
          </div>
          <button type="button" onClick={() => nudgeBy(0, -nudge)} title="Abajo">
            ↓
          </button>
        </div>
      </div>

      <div className="test-value-panel">
        <label>
          Probar campo con este texto
          <input
            type="text"
            value={testValue}
            onChange={(e) => onTestValueChange(def.id, e.target.value)}
            placeholder="Ej: JOSE ALBERTO TORRES"
          />
        </label>
      </div>

      <button type="button" className="btn btn--ghost btn--sm" onClick={() => onResetField(def.id)}>
        Restablecer este campo
      </button>
    </aside>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
