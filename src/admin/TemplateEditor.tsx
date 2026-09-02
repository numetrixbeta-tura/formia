import { useCallback, useMemo, useState } from 'react';
import PdfPageCanvas from './PdfPageCanvas';
import FieldBox, { measureOverflow, type EditableRect } from './FieldBox';
import PropertyPanel from './PropertyPanel';
import FieldListPanel from './FieldListPanel';
import EditorToolbar from './EditorToolbar';
import PdfPreviewModal from '../components/PdfPreviewModal';
import {
  getEffectiveFieldMap,
  getEffectiveCheckMap,
  setFieldOverride,
  setCheckOverride,
  resetFieldOverride,
  resetCheckOverride,
  resetPageOverrides,
  resetAllOverrides,
  snapshotOverrides,
  restoreOverridesSnapshot,
  exportEffectiveMappingAsTs,
  type FieldOverride,
  type CheckOverride,
} from '../services/fieldOverrides';
import { generateFilledPdf, flattenPdf, groupIdFor } from '../services/pdfGenerator';
import { SAMPLE_TEST_DATA } from '../config/sampleTestData';
import type { FieldDef, CheckDef } from '../config/pdfFieldMapping';
import './admin.css';

type SelectedRef = { id: string; kind: 'field' | 'check' } | null;

const MAX_HISTORY = 50;

export default function TemplateEditor() {
  const [page, setPage] = useState<1 | 2>(1);
  const [zoom, setZoom] = useState(1);
  const [pageSizes, setPageSizes] = useState<Record<1 | 2, { pdfWidth: number; pdfHeight: number }>>({
    1: { pdfWidth: 595, pdfHeight: 842 },
    2: { pdfWidth: 595, pdfHeight: 842 },
  });
  const [selected, setSelected] = useState<SelectedRef>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showTestData, setShowTestData] = useState(true);
  const [compareOriginal, setCompareOriginal] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.85);
  const [testOverrides, setTestOverrides] = useState<Record<string, string>>({});
  const [undoStack, setUndoStack] = useState<ReturnType<typeof snapshotOverrides>[]>([]);
  const [redoStack, setRedoStack] = useState<ReturnType<typeof snapshotOverrides>[]>([]);
  const [savedLabel, setSavedLabel] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [previewBytes, setPreviewBytes] = useState<Uint8Array | null>(null);
  const [genError, setGenError] = useState<string | null>(null);

  const fields = useMemo(() => getEffectiveFieldMap(), [refreshKey]);
  const checks = useMemo(() => getEffectiveCheckMap(), [refreshKey]);

  const fieldsOnPage = useMemo(() => fields.filter((f) => f.page === page), [fields, page]);
  const checksOnPage = useMemo(() => checks.filter((c) => c.page === page), [checks, page]);

  const geometry = { ...pageSizes[page], zoom };

  const pushUndo = useCallback(() => {
    setUndoStack((s) => [...s.slice(-MAX_HISTORY + 1), snapshotOverrides()]);
    setRedoStack([]);
  }, []);

  const markSaved = useCallback(() => {
    setRefreshKey((k) => k + 1);
    setSavedLabel(`Guardado ${new Date().toLocaleTimeString('es-CO')}`);
  }, []);

  const handleChangeField = useCallback(
    (id: string, patch: Partial<FieldDef>) => {
      pushUndo();
      setFieldOverride(id, patch as FieldOverride);
      markSaved();
    },
    [pushUndo, markSaved]
  );

  const handleChangeCheck = useCallback(
    (id: string, patch: Partial<CheckDef>) => {
      pushUndo();
      setCheckOverride(id, patch as CheckOverride);
      markSaved();
    },
    [pushUndo, markSaved]
  );

  // Aplica un cambio SIN apilar deshacer — usado durante el arrastre continuo
  // (pointermove dispara muchas veces por segundo; el undo se apila una sola
  // vez al iniciar el gesto, ver handleDragStart).
  const applyFieldPatchQuiet = useCallback((id: string, patch: Partial<FieldDef>) => {
    setFieldOverride(id, patch as FieldOverride);
    setRefreshKey((k) => k + 1);
    setSavedLabel(`Guardado ${new Date().toLocaleTimeString('es-CO')}`);
  }, []);

  const applyCheckPatchQuiet = useCallback((id: string, patch: Partial<CheckDef>) => {
    setCheckOverride(id, patch as CheckOverride);
    setRefreshKey((k) => k + 1);
    setSavedLabel(`Guardado ${new Date().toLocaleTimeString('es-CO')}`);
  }, []);

  const handleDragStart = useCallback(() => {
    pushUndo();
  }, [pushUndo]);

  const handleFieldBoxChange = (id: string, kind: 'field' | 'check', rect: EditableRect) => {
    if (kind === 'field') applyFieldPatchQuiet(id, rect);
    else applyCheckPatchQuiet(id, rect);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((s) => [...s, snapshotOverrides()]);
    setUndoStack((s) => s.slice(0, -1));
    restoreOverridesSnapshot(prev);
    setRefreshKey((k) => k + 1);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((s) => [...s, snapshotOverrides()]);
    setRedoStack((s) => s.slice(0, -1));
    restoreOverridesSnapshot(next);
    setRefreshKey((k) => k + 1);
  };

  const handleResetField = (id: string) => {
    pushUndo();
    resetFieldOverride(id);
    resetCheckOverride(id);
    markSaved();
  };

  const handleResetPage = () => {
    if (!confirm(`¿Restablecer todos los campos de la página ${page} a su posición original?`)) return;
    pushUndo();
    resetPageOverrides(page);
    markSaved();
  };

  const handleResetAll = () => {
    if (!confirm('¿Restablecer TODOS los campos (ambas páginas) a su posición original? Esta acción no se puede deshacer con "Deshacer".')) return;
    pushUndo();
    resetAllOverrides();
    markSaved();
  };

  const handleExport = () => {
    const ts = exportEffectiveMappingAsTs();
    const blob = new Blob([ts], { type: 'text/typescript' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pdfFieldMapping.ts';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const effectiveTestValues = useMemo(
    () => ({ ...SAMPLE_TEST_DATA, ...testOverrides }),
    [testOverrides]
  );

  const handleGenerateTestPdf = async () => {
    setGenError(null);
    setGenerating(true);
    try {
      const bytes = await generateFilledPdf(effectiveTestValues, { flatten: false });
      setPreviewBytes(bytes);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Error generando el PDF de prueba.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownloadPreview = async (flatten: boolean) => {
    if (!previewBytes) return;
    const finalBytes = flatten ? await flattenPdf(previewBytes) : previewBytes;
    const blob = new Blob([finalBytes.slice()], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formia-pdf-de-prueba.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const selectedDef: FieldDef | CheckDef | null = selected
    ? selected.kind === 'field'
      ? fields.find((f) => f.id === selected.id) ?? null
      : checks.find((c) => c.id === selected.id) ?? null
    : null;

  const selectedForPanel =
    selected && selectedDef
      ? selected.kind === 'field'
        ? ({ kind: 'field' as const, def: selectedDef as FieldDef })
        : ({ kind: 'check' as const, def: selectedDef as CheckDef })
      : null;

  return (
    <div className="template-editor">
      <header className="template-editor__header">
        <h1>FORMIA — Editor de Plantilla</h1>
        <p>Sección exclusiva de administración. Ajusta visualmente los 144 campos y 47 casillas sobre el PDF original.</p>
      </header>

      <EditorToolbar
        page={page}
        onPageChange={(p) => {
          setPage(p);
          setSelected(null);
        }}
        zoom={zoom}
        onZoomChange={setZoom}
        showTestData={showTestData}
        onToggleTestData={() => setShowTestData((v) => !v)}
        compareOriginal={compareOriginal}
        onToggleCompareOriginal={() => setCompareOriginal((v) => !v)}
        overlayOpacity={overlayOpacity}
        onOverlayOpacityChange={setOverlayOpacity}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onResetPage={handleResetPage}
        onResetAll={handleResetAll}
        onExport={handleExport}
        onGenerateTestPdf={handleGenerateTestPdf}
        generating={generating}
        savedLabel={savedLabel}
      />

      {genError && <div className="alert alert--error">{genError}</div>}

      <div className="template-editor__body">
        <FieldListPanel
          fields={fields}
          checks={checks}
          selectedId={selected?.id ?? null}
          onSelect={(id, kind) => {
            const def = kind === 'field' ? fields.find((f) => f.id === id) : checks.find((c) => c.id === id);
            if (def) setPage(def.page);
            setSelected({ id, kind });
          }}
        />

        <div className="template-editor__canvas-area" style={{ opacity: compareOriginal ? 1 : 1 }}>
          <div className="template-editor__canvas-stage">
            <PdfPageCanvas
              page={page}
              zoom={zoom}
              onPageSize={(size) => setPageSizes((s) => ({ ...s, [page]: size }))}
            />
            <div
              className="field-box-layer"
              style={{ opacity: compareOriginal ? overlayOpacity : 1 }}
              onPointerDown={() => setSelected(null)}
            >
              {fieldsOnPage.map((f) => {
                const testValue = effectiveTestValues[f.id];
                const overflow = showTestData ? measureOverflow(testValue ?? '', f.fontSize, f.width) : false;
                return (
                  <FieldBox
                    key={f.id}
                    id={f.id}
                    kind="field"
                    label={f.label}
                    rect={f}
                    fontSize={f.fontSize}
                    geometry={geometry}
                    selected={selected?.id === f.id}
                    showTestData={showTestData}
                    testValue={testValue}
                    overflow={overflow}
                    onSelect={() => setSelected({ id: f.id, kind: 'field' })}
                    onDragStart={handleDragStart}
                    onChange={(rect) => handleFieldBoxChange(f.id, 'field', rect)}
                  />
                );
              })}
              {checksOnPage.map((c) => {
                const groupSel = effectiveTestValues[groupIdFor(c.id)];
                const isChecked = showTestData && groupSel === c.id;
                return (
                  <FieldBox
                    key={c.id}
                    id={c.id}
                    kind="check"
                    label={c.label}
                    rect={c}
                    geometry={geometry}
                    selected={selected?.id === c.id}
                    showTestData={isChecked}
                    testValue={isChecked ? '✓' : ''}
                    onSelect={() => setSelected({ id: c.id, kind: 'check' })}
                    onDragStart={handleDragStart}
                    onChange={(rect) => handleFieldBoxChange(c.id, 'check', rect)}
                  />
                );
              })}
            </div>
          </div>
        </div>

        <PropertyPanel
          selected={selectedForPanel}
          onChangeField={handleChangeField}
          onChangeCheck={handleChangeCheck}
          onResetField={handleResetField}
          testValue={selected ? (testOverrides[selected.id] ?? effectiveTestValues[selected.id] ?? '') : ''}
          onTestValueChange={(id, value) => setTestOverrides((s) => ({ ...s, [id]: value }))}
        />
      </div>

      <PdfPreviewModal pdfBytes={previewBytes} onClose={() => setPreviewBytes(null)} onDownload={handleDownloadPreview} />
    </div>
  );
}
