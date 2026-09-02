import { useRef, useState } from 'react';
import { pdfRectToScreen, screenDeltaToPdfDelta, type PageGeometry } from '../services/coords';

export interface EditableRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Props {
  id: string;
  kind: 'field' | 'check';
  label: string;
  rect: EditableRect;
  fontSize?: number;
  geometry: PageGeometry;
  selected: boolean;
  showTestData: boolean;
  testValue?: string;
  overflow?: boolean;
  onSelect: () => void;
  onDragStart: () => void;
  onChange: (rect: EditableRect) => void;
}

/** Mide si un texto de prueba se saldría del ancho/alto del campo, con una fuente aproximada. */
export function measureOverflow(text: string, fontSize: number, width: number): boolean {
  if (!text) return false;
  const canvas = measureOverflow.canvas ?? (measureOverflow.canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  if (!ctx) return false;
  ctx.font = `${fontSize}pt Helvetica, Arial, sans-serif`;
  const textWidth = ctx.measureText(text).width;
  return textWidth > width;
}
measureOverflow.canvas = undefined as HTMLCanvasElement | undefined;

export default function FieldBox({
  id,
  kind,
  label,
  rect,
  fontSize,
  geometry,
  selected,
  showTestData,
  testValue,
  overflow,
  onSelect,
  onDragStart,
  onChange,
}: Props) {
  const screen = pdfRectToScreen(rect, geometry);
  const dragState = useRef<{ startX: number; startY: number; mode: 'move' | 'resize'; rect: EditableRect } | null>(
    null
  );
  const [, forceRender] = useState(0);

  const startDrag = (e: React.PointerEvent, mode: 'move' | 'resize') => {
    e.stopPropagation();
    e.preventDefault();
    onSelect();
    onDragStart();
    (e.target as Element).setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startY: e.clientY, mode, rect: { ...rect } };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const ds = dragState.current;
    if (!ds) return;
    const dxPx = e.clientX - ds.startX;
    const dyPx = e.clientY - ds.startY;
    const { dx, dy } = screenDeltaToPdfDelta(dxPx, dyPx, geometry);

    if (ds.mode === 'move') {
      onChange({ ...ds.rect, x: round1(ds.rect.x + dx), y: round1(ds.rect.y + dy) });
    } else {
      const newWidth = Math.max(6, round1(ds.rect.width + dx));
      const newHeight = Math.max(6, round1(ds.rect.height - dy));
      onChange({ ...ds.rect, width: newWidth, height: newHeight });
    }
    forceRender((n) => n + 1);
  };

  const endDrag = (e: React.PointerEvent) => {
    dragState.current = null;
    (e.target as Element).releasePointerCapture(e.pointerId);
  };

  return (
    <div
      className={[
        'field-box',
        kind === 'check' ? 'field-box--check' : '',
        selected ? 'field-box--selected' : '',
        overflow ? 'field-box--overflow' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{
        left: screen.left,
        top: screen.top,
        width: screen.width,
        height: screen.height,
      }}
      onPointerDown={(e) => startDrag(e, 'move')}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      title={`${id} — ${label}`}
    >
      {showTestData && testValue && (
        <span className="field-box__value" style={{ fontSize: Math.max(6, (fontSize ?? 8) * geometry.zoom) }}>
          {testValue}
        </span>
      )}
      {selected && (
        <div
          className="field-box__resize-handle"
          onPointerDown={(e) => startDrag(e, 'resize')}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
        />
      )}
      {overflow && <span className="field-box__overflow-badge">⚠</span>}
    </div>
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
