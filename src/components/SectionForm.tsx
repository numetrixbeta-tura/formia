import { useEffect } from 'react';
import type { SectionDef } from '../config/sections';
import type { FormValues, ValidationError } from '../types';
import TextField from './TextField';
import RadioGroupField from './RadioGroupField';
import { REQUIRED_FIELDS } from '../utils/validation';

interface Props {
  section: SectionDef;
  values: FormValues;
  errors: ValidationError[];
  onFieldChange: (id: string, value: string) => void;
  onRadioChange: (groupId: string, checkId: string) => void;
  /** Si se indica y el campo pertenece a esta sección, se le hace scroll y foco al montar. */
  focusFieldId?: string | null;
}

function errorFor(errors: ValidationError[], id: string) {
  return errors.find((e) => e.fieldId === id)?.message;
}

export default function SectionForm({
  section,
  values,
  errors,
  onFieldChange,
  onRadioChange,
  focusFieldId,
}: Props) {
  useEffect(() => {
    if (!focusFieldId) return;
    const el = document.getElementById(`field-${focusFieldId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      (el as HTMLInputElement).focus({ preventScroll: true });
    }
    // Solo debe ocurrir cuando cambia el campo a enfocar (p.ej. al entrar desde
    // "Corregir" en la Revisión final), no en cada render de la sección.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusFieldId]);

  return (
    <div className="section-form">
      <header className="section-form__header">
        <h2>{section.title}</h2>
        {section.subtitle && <p className="section-form__subtitle">{section.subtitle}</p>}
      </header>

      {section.radioGroups && section.radioGroups.length > 0 && (
        <div className="radio-groups">
          {section.radioGroups.map((g) => (
            <RadioGroupField
              key={g.id}
              group={g}
              selected={values[g.id]}
              onChange={onRadioChange}
            />
          ))}
        </div>
      )}

      {section.rows.map((r, idx) => (
        <div className="field-row" key={idx}>
          {r.fieldIds.map((fid) => (
            <TextField
              key={fid}
              fieldId={fid}
              value={values[fid] ?? ''}
              onChange={onFieldChange}
              error={errorFor(errors, fid)}
              required={REQUIRED_FIELDS.includes(fid)}
            />
          ))}
        </div>
      ))}

      {section.subgroups?.map((sg, i) => (
        <div className="subgroup" key={i}>
          <h3>{sg.title}</h3>
          {sg.rows.map((r, idx) => (
            <div className="field-row" key={idx}>
              {r.fieldIds.map((fid) => (
                <TextField
                  key={fid}
                  fieldId={fid}
                  value={values[fid] ?? ''}
                  onChange={onFieldChange}
                  error={errorFor(errors, fid)}
                  required={REQUIRED_FIELDS.includes(fid)}
                />
              ))}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
