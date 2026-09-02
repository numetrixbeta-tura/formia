import { ZOOM_LEVELS } from '../services/coords';

interface Props {
  page: 1 | 2;
  onPageChange: (page: 1 | 2) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  showTestData: boolean;
  onToggleTestData: () => void;
  compareOriginal: boolean;
  onToggleCompareOriginal: () => void;
  overlayOpacity: number;
  onOverlayOpacityChange: (v: number) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onResetPage: () => void;
  onResetAll: () => void;
  onExport: () => void;
  onGenerateTestPdf: () => void;
  generating: boolean;
  savedLabel: string | null;
}

export default function EditorToolbar({
  page,
  onPageChange,
  zoom,
  onZoomChange,
  showTestData,
  onToggleTestData,
  compareOriginal,
  onToggleCompareOriginal,
  overlayOpacity,
  onOverlayOpacityChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onResetPage,
  onResetAll,
  onExport,
  onGenerateTestPdf,
  generating,
  savedLabel,
}: Props) {
  return (
    <div className="editor-toolbar">
      <div className="editor-toolbar__group">
        <span className="editor-toolbar__label">Página</span>
        <div className="segmented">
          <button className={page === 1 ? 'segmented__btn segmented__btn--active' : 'segmented__btn'} onClick={() => onPageChange(1)}>
            1
          </button>
          <button className={page === 2 ? 'segmented__btn segmented__btn--active' : 'segmented__btn'} onClick={() => onPageChange(2)}>
            2
          </button>
        </div>
      </div>

      <div className="editor-toolbar__group">
        <span className="editor-toolbar__label">Zoom</span>
        <select value={zoom} onChange={(e) => onZoomChange(Number(e.target.value))}>
          {ZOOM_LEVELS.map((z) => (
            <option key={z} value={z}>
              {Math.round(z * 100)}%
            </option>
          ))}
        </select>
      </div>

      <div className="editor-toolbar__group">
        <button
          type="button"
          className={`chip ${showTestData ? 'chip--active' : ''}`}
          onClick={onToggleTestData}
        >
          {showTestData ? 'Ocultar datos de prueba' : 'Mostrar datos de prueba'}
        </button>
      </div>

      <div className="editor-toolbar__group">
        <button
          type="button"
          className={`chip ${compareOriginal ? 'chip--active' : ''}`}
          onClick={onToggleCompareOriginal}
        >
          Comparar con original
        </button>
        {compareOriginal && (
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={overlayOpacity}
            onChange={(e) => onOverlayOpacityChange(Number(e.target.value))}
            title="Transparencia de los campos"
          />
        )}
      </div>

      <div className="editor-toolbar__group">
        <button className="btn btn--ghost btn--sm" onClick={onUndo} disabled={!canUndo}>
          ↶ Deshacer
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onRedo} disabled={!canRedo}>
          ↷ Rehacer
        </button>
      </div>

      <div className="editor-toolbar__group">
        <button className="btn btn--ghost btn--sm" onClick={onResetPage}>
          Restablecer página
        </button>
        <button className="btn btn--ghost btn--sm" onClick={onResetAll}>
          Restablecer todos
        </button>
      </div>

      <div className="editor-toolbar__group editor-toolbar__group--end">
        {savedLabel && <span className="save-indicator">{savedLabel}</span>}
        <button className="btn btn--ghost btn--sm" onClick={onExport}>
          Exportar configuración
        </button>
        <button className="btn btn--primary btn--sm" onClick={onGenerateTestPdf} disabled={generating}>
          {generating ? 'Generando…' : 'Generar PDF de prueba'}
        </button>
      </div>
    </div>
  );
}
