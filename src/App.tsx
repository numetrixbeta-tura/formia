import { useMemo, useState } from 'react';
import { SECTIONS, sectionIndexForField } from './config/sections';
import { useDraft } from './hooks/useDraft';
import { validate, errorsBySection } from './utils/validation';
import { appendIdentityToPdf, generateFilledPdf, flattenPdf } from './services/pdfGenerator';
import SectionForm from './components/SectionForm';
import StepNav from './components/StepNav';
import ReviewScreen from './components/ReviewScreen';
import PdfPreviewModal from './components/PdfPreviewModal';
import type { IdentityAttachments } from './types';
import './App.css';

const REVIEW_INDEX = SECTIONS.length;

export default function App() {
  const { values, setField, saveDraft, clearDraft, lastSavedAt, hasDraft } = useDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<IdentityAttachments>({ front: null, back: null, pdf: null });

  const errors = useMemo(() => validate(values, attachments), [values, attachments]);

  const sectionErrorCounts = useMemo(
    () =>
      SECTIONS.map((s) => {
        const ids: string[] = [];
        s.rows.forEach((r) => ids.push(...r.fieldIds));
        s.subgroups?.forEach((sg) => sg.rows.forEach((r) => ids.push(...r.fieldIds)));
        s.radioGroups?.forEach((group) => ids.push(group.id));
        return errorsBySection(errors, ids);
      }),
    [errors]
  );

  const handleFieldChange = (id: string, value: string) => setField(id, value);
  const handleRadioChange = (groupId: string, checkId: string) => setField(groupId, checkId);

  const goNext = () => setStepIndex((i) => Math.min(i + 1, REVIEW_INDEX));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  /** Navega a una sección y, opcionalmente, hace foco en un campo específico
   * dentro de ella (usado por "Corregir" en la Revisión final y por el botón
   * "Vista previa PDF" cuando hay errores pendientes). */
  const goToSection = (index: number, fieldId?: string) => {
    setStepIndex(index);
    setFocusFieldId(fieldId ?? null);
  };

  const handleGenerate = async () => {
    setGenError(null);
    if (errors.length > 0) {
      // No se intenta generar el PDF si hay errores: se lleva al usuario
      // directamente al primer campo pendiente para que lo corrija.
      const firstError = errors[0];
      const sectionIndex = sectionIndexForField(firstError.fieldId);
      if (sectionIndex >= 0) {
        goToSection(sectionIndex, firstError.fieldId);
      } else {
        setStepIndex(REVIEW_INDEX);
      }
      return;
    }
    setGenerating(true);
    try {
      const formBytes = await generateFilledPdf(values);
      const combinedBytes = await appendIdentityToPdf(formBytes, attachments);
      setPdfBytes(combinedBytes);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'Ocurrió un error generando el PDF.');
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = async (flatten: boolean) => {
    if (!pdfBytes) return;
    const finalBytes = flatten ? await flattenPdf(pdfBytes) : pdfBytes;
    const blob = new Blob([finalBytes.slice()], { type: 'application/pdf' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const nombre = values.primerNombre ? values.primerNombre.replace(/\s+/g, '_') : 'formulario';
    a.href = url;
    a.download = `solicitud-credito-vehiculo-${nombre}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleShare = async (flatten: boolean) => {
    if (!pdfBytes) return;
    const finalBytes = flatten ? await flattenPdf(pdfBytes) : pdfBytes;
    const nombre = values.primerNombre ? values.primerNombre.replace(/\s+/g, '_') : 'formulario';
    const fileName = `solicitud-credito-vehiculo-${nombre}.pdf`;
    const file = new File([finalBytes.slice()], fileName, { type: 'application/pdf' });

    if (typeof navigator.share === 'function' && typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: 'Solicitud de crédito de vehículo',
        text: 'Solicitud de crédito de vehículo y documentos adjuntos.',
        files: [file],
      });
      return;
    }

    if (typeof navigator.share === 'function') {
      await navigator.share({
        title: 'Solicitud de crédito de vehículo',
        text: 'Solicitud de crédito de vehículo y documentos adjuntos.',
      });
      return;
    }

    throw new Error('Este navegador no permite compartir archivos directamente. Descarga el PDF y envíalo al banco por WhatsApp, correo u otro medio.');
  };

  const handleNewForm = () => {
    setShowClearConfirm(false);
    clearDraft();
    setPdfBytes(null);
    setAttachments({ front: null, back: null, pdf: null });
    setStepIndex(0);
  };

  const isReview = stepIndex === REVIEW_INDEX;
  const currentSection = !isReview ? SECTIONS[stepIndex] : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title">
          <h1>Formato Universal y Solicitud de Crédito de Vehículo</h1>
          <p>Persona Natural — diligenciamiento digital</p>
        </div>
        <div className="app-header__actions">
          {lastSavedAt && (
            <span className="save-indicator">
              Guardado {new Date(lastSavedAt).toLocaleTimeString('es-CO')}
            </span>
          )}
          <button className="btn btn--ghost btn--sm" onClick={() => saveDraft(values)}>
            Guardar borrador
          </button>
          {hasDraft && (
            <button className="btn btn--ghost btn--sm" onClick={() => setShowClearConfirm(true)}>
              Limpiar formulario
            </button>
          )}
        </div>
      </header>

      <div className="app-body">
        <StepNav
          sections={SECTIONS}
          currentIndex={stepIndex}
          onSelect={(i) => goToSection(i)}
          sectionErrorCounts={sectionErrorCounts}
        />

        <main className="app-main">
          {currentSection && (
            <SectionForm
              section={currentSection}
              values={values}
              errors={errors}
              onFieldChange={handleFieldChange}
              onRadioChange={handleRadioChange}
              attachments={attachments}
              onAttachmentsChange={setAttachments}
              focusFieldId={focusFieldId}
            />
          )}

          {isReview && (
            <ReviewScreen values={values} errors={errors} attachments={attachments} onEditSection={goToSection} />
          )}

          {genError && <div className="alert alert--error">{genError}</div>}

          <div className="app-main__nav">
            <button className="btn btn--ghost" onClick={goPrev} disabled={stepIndex === 0}>
              Anterior
            </button>

            {!isReview ? (
              <button className="btn btn--primary" onClick={goNext}>
                Siguiente
              </button>
            ) : (
              <button className="btn btn--primary" onClick={handleGenerate} disabled={generating}>
                {generating ? 'Generando…' : 'Vista previa PDF'}
              </button>
            )}
          </div>
        </main>
      </div>

      <PdfPreviewModal
        pdfBytes={pdfBytes}
        onClose={() => setPdfBytes(null)}
        onDownload={handleDownload}
        onShare={handleShare}
      />

      {showClearConfirm && (
        <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal__header">
              <h2>¿Limpiar formulario?</h2>
            </div>
            <div className="modal__body">
              <p>Se borrará toda la información diligenciada y el borrador guardado. Esta acción no se puede deshacer.</p>
            </div>
            <div className="modal__footer">
              <button className="btn btn--ghost" onClick={() => setShowClearConfirm(false)}>
                Cancelar
              </button>
              <button className="btn btn--danger" onClick={handleNewForm}>
                Sí, limpiar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
