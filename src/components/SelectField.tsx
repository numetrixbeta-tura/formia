import type { ChangeEvent } from 'react';
import { FIELD_BY_ID } from '../config/pdfFieldMapping';

interface Props {
  fieldId: string;
  value: string;
  options: string[];
  onChange: (id: string, value: string) => void;
  error?: string;
  required?: boolean;
}

export default function SelectField({ fieldId, value, options, onChange, error, required }: Props) {
  const def = FIELD_BY_ID[fieldId];
  if (!def) return null;

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(fieldId, e.target.value);
  };

  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">
        {def.label}
        {required && <span className="field__required">*</span>}
      </span>
      <select id={`field-${fieldId}`} value={value ?? ''} onChange={handleChange}>
        <option value="">Selecciona una opción</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
      {error && <span className="field__error-msg">{error}</span>}
    </label>
  );
}
