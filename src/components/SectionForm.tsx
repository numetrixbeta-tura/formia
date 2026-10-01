import { useEffect } from 'react';
import type { SectionDef } from '../config/sections';
import type { FormValues, IdentityAttachments, ValidationError } from '../types';
import TextField from './TextField';
import DateField from './DateField';
import SignaturePad from './SignaturePad';
import RadioGroupField from './RadioGroupField';
import SelectField from './SelectField';
import IdentityAttachmentsField from './IdentityAttachments';
import { REQUIRED_FIELDS } from '../utils/validation';

interface Props {
  section: SectionDef;
  values: FormValues;
  errors: ValidationError[];
  attachments: IdentityAttachments;
  onFieldChange: (id: string, value: string) => void;
  onRadioChange: (groupId: string, checkId: string) => void;
  onAttachmentsChange: (attachments: IdentityAttachments) => void;
  focusFieldId?: string | null;
}

function errorFor(errors: ValidationError[], id: string) {
  return errors.find((e) => e.fieldId === id)?.message;
}

function SpecialField({
  fieldId,
  values,
  onFieldChange,
  error,
  required,
  attachments,
  onAttachmentsChange,
}: {
  fieldId: string;
  values: FormValues;
  onFieldChange: (id: string, value: string) => void;
  error?: string;
  required?: boolean;
  attachments: IdentityAttachments;
  onAttachmentsChange: (attachments: IdentityAttachments) => void;
}) {
  if (fieldId === 'fechaNacimiento') {
    return (
      <DateField
        value={values.fechaNacimiento ?? ''}
        onChange={(value) => onFieldChange('fechaNacimiento', value)}
        error={error}
        required={required}
      />
    );
  }

  if (fieldId === 'firmaDigital') {
    return (
      <SignaturePad
        value={values.firmaDigital ?? ''}
        onChange={(value) => onFieldChange('firmaDigital', value)}
        error={error}
        required={required}
      />
    );
  }

  if (fieldId === 'tipoContrato') {
    return (
      <SelectField
        fieldId={fieldId}
        value={values[fieldId] ?? ''}
        options={['INDEFINIDO', 'TERMINO FIJO', 'PRESTACION DE SERVICIO', 'OBRA LABOR', 'APRENDIZAJE']}
        onChange={onFieldChange}
        error={error}
        required={required}
      />
    );
  }

  if (fieldId === 'documentosIdentidad') {
    return (
      <IdentityAttachmentsField
        attachments={attachments}
        onChange={onAttachmentsChange}
        error={error}
      />
    );
  }

  return (
    <TextField
      fieldId={fieldId}
      value={values[fieldId] ?? ''}
      onChange={onFieldChange}
      error={error}
      required={required}
    />
  );
}

export default function SectionForm({
  section,
  values,
  errors,
  attachments,
  onFieldChange,
  onRadioChange,
  onAttachmentsChange,
  focusFieldId,
}: Props) {
  useEffect(() => {
    if (!focusFieldId) return;
    const el = document.getElementById(`field-${focusFieldId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if ('focus' in el && typeof (el as HTMLElement).focus === 'function') {
        (el as HTMLElement).focus({ preventScroll: true });
      }
    }
  }, [focusFieldId]);

  const renderField = (fid: string) => (
    <SpecialField
      key={fid}
      fieldId={fid}
      values={values}
      attachments={attachments}
      onFieldChange={onFieldChange}
      onAttachmentsChange={onAttachmentsChange}
      error={errorFor(errors, fid)}
      required={REQUIRED_FIELDS.includes(fid)}
    />
  );

  return (
    <div className="section-form">
      <header className="section-form__header">
        <h2>{section.title}</h2>
        {section.subtitle && <p className="section-form__subtitle">{section.subtitle}</p>}
      </header>

      {section.radioGroups && section.radioGroups.length > 0 && (
        <div className="radio-groups">
          {section.radioGroups.map((g) => (
            <RadioGroupField key={g.id} group={g} selected={values[g.id]} onChange={onRadioChange} />
          ))}
        </div>
      )}

      {section.rows.map((r, idx) => (
        <div className="field-row" key={idx}>
          {r.fieldIds.map(renderField)}
        </div>
      ))}

      {section.subgroups?.map((sg, i) => (
        <div className="subgroup" key={i}>
          <h3>{sg.title}</h3>
          {sg.rows.map((r, idx) => (
            <div className="field-row" key={idx}>
              {r.fieldIds.map(renderField)}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
