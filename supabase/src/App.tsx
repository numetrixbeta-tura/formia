import { useMemo, useState } from 'react';
import { SECTIONS, sectionIndexForField } from './config/sections';
import { useDraft } from './hooks/useDraft';
import { validate, errorsBySection } from './utils/validation';
import { appendIdentityToPdf, flattenPdf, generateFilledPdf } from './services/pdfGenerator';
import { submitApplication } from './services/applicationApi';
import SectionForm from './components/SectionForm';
import StepNav from './components/StepNav';
import ReviewScreen from './components/ReviewScreen';
import type { IdentityAttachments } from './types';
import './App.css';

const REVIEW_INDEX = SECTIONS.length;

function SuccessScreen({ requestNumber, onNew }: { requestNumber: string; onNew: () => void }) {
  return (
    <div className="success-screen">
      <div className="success-screen__icon">✓</div>
      <h2>Solicitud enviada correctamente</h2>
      <p>Hemos recibido tu información, documento de identidad y firma digital.</p>
      <div className="success-screen__number">
        <span>Número de solicitud</span>
        <strong>{requestNumber}</strong>
      </div>
      <p className="success-screen__note">Conserva este número para futuras consultas. Nuestro equipo continuará el proceso.</p>
      <button className="btn btn--primary" onClick={onNew}>Nueva solicitud</button>
    </div>
  );
}

export default function App() {
  const { values, setField, saveDraft, clearDraft, lastSavedAt, hasDraft } = useDraft();
  const [stepIndex, setStepIndex] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [focusFieldId, setFocusFieldId] = useState<string | null>(null);
  const [attachments, setAttachments] = useState<IdentityAttachments>({ front: null, back: null, pdf: null });
  const [submittedNumber, setSubmittedNumber] = useState<string | null>(null);

  const errors = useMemo(() => validate(values, attachments), [values, attachments]);
  const sectionErrorCounts = useMemo(
    () => SECTIONS.map((s) => {
      const ids: string[] = [];
      s.rows.forEach((r) => ids.push(...r.fieldIds));
      s.subgroups?.forEach((sg) => sg.rows.forEach((r) => ids.push(...r.fieldIds)));
      s.radioGroups?.forEach((group) => ids.push(group.id));
      return errorsBySection(errors, ids);
    }), [errors]
  );

  const goToSection = (index: number, fieldId?: string) => {
    setStepIndex(index);
    setFocusFieldId(fieldId ?? null);
  };

  const goNext = () => setStepIndex((i) => Math.min(i + 1, REVIEW_INDEX));
  const goPrev = () => setStepIndex((i) => Math.max(i - 1, 0));

  const handleSubmit = async () => {
    setGenError(null);
    if (errors.length > 0) {
      const firstError = errors[0];
      const sectionIndex = sectionIndexForField(firstError.fieldId);
      if (sectionIndex >= 0) goToSection(sectionIndex, firstError.fieldId);
      return;
    }

    setGenerating(true);
    try {
      const formBytes = await generateFilledPdf(values);
      const combinedBytes = await appendIdentityToPdf(formBytes, attachments);
      const finalBytes = await flattenPdf(combinedBytes);
      const requestNumber = await submitApplication(values, attachments, finalBytes);
      clearDraft();
      setAttachments({ front: null, back: null, pdf: null });
      setSubmittedNumber(requestNumber);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : 'No fue posible enviar la solicitud.');
    } finally {
      setGenerating(false);
    }
  };

  const handleNewForm = () => {
    setShowClearConfirm(false);
    clearDraft();
    setAttachments({ front: null, back: null, pdf: null });
    setStepIndex(0);
    setFocusFieldId(null);
    setGenError(null);
    setSubmittedNumber(null);
  };

  if (submittedNumber) {
    return (
      <div className="app-shell">
        <header className="app-header"><div className="app-header__title"><h1>Formato Universal y Solicitud de Crédito de Vehículo</h1><p>Persona Natural — diligenciamiento digital</p></div></header>
        <main className="success-main"><SuccessScreen requestNumber={submittedNumber} onNew={handleNewForm} /></main>
      </div>
    );
  }

  const isReview = stepIndex === REVIEW_INDEX;
  const currentSection = !isReview ? SECTIONS[stepIndex] : null;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header__title"><h1>Formato Universal y Solicitud de Crédito de Vehículo</h1><p>Persona Natural — diligenciamiento digital</p></div>
        <div className="app-header__actions">
          {lastSavedAt && <span className="save-indicator">Guardado {new Date(lastSavedAt).toLocaleTimeString('es-CO')}</span>}
          <button className="btn btn--ghost btn--sm" onClick={() => saveDraft(values)}>Guardar borrador</button>
          {hasDraft && <button className="btn btn--ghost btn--sm" onClick={() => setShowClearConfirm(true)}>Limpiar formulario</button>}
        </div>
      </header>

      <div className="app-body">
        <StepNav sections={SECTIONS} currentIndex={stepIndex} onSelect={(i) => goToSection(i)} sectionErrorCounts={sectionErrorCounts} />
        <main className="app-main">
          {currentSection && <SectionForm section={currentSection} values={values} errors={errors} onFieldChange={setField} onRadioChange={(groupId, checkId) => setField(groupId, checkId)} attachments={attachments} onAttachmentsChange={setAttachments} focusFieldId={focusFieldId} />}
          {isReview && <ReviewScreen values={values} errors={errors} attachments={attachments} onEditSection={goToSection} />}
          {genError && <div className="alert alert--error">{genError}</div>}
          <div className="app-main__nav">
            <button className="btn btn--ghost" onClick={goPrev} disabled={stepIndex === 0 || generating}>Anterior</button>
            {!isReview ? <button className="btn btn--primary" onClick={goNext}>Siguiente</button> : <button className="btn btn--primary btn--submit" onClick={() => void handleSubmit()} disabled={generating}>{generating ? 'Enviando solicitud…' : 'Enviar solicitud'}</button>}
          </div>
          {isReview && <p className="submission-note">Al enviar, el formulario, la cédula y la firma quedarán registrados en nuestro sistema para continuar el proceso.</p>}
        </main>
      </div>

      {showClearConfirm && <div className="modal-overlay" onClick={() => setShowClearConfirm(false)}><div className="modal" onClick={(e) => e.stopPropagation()}><div className="modal__header"><h2>¿Limpiar formulario?</h2></div><div className="modal__body"><p>Se borrará toda la información diligenciada y el borrador guardado. Esta acción no se puede deshacer.</p></div><div className="modal__footer"><button className="btn btn--ghost" onClick={() => setShowClearConfirm(false)}>Cancelar</button><button className="btn btn--danger" onClick={handleNewForm}>Sí, limpiar</button></div></div></div>}
    </div>
  );
}
