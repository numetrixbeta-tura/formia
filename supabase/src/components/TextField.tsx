import type { ChangeEvent } from 'react';
import { FIELD_BY_ID } from '../config/pdfFieldMapping';
import { formatFieldValue } from '../utils/validation';

interface Props {
  fieldId: string;
  value: string;
  onChange: (id: string, value: string) => void;
  error?: string;
  required?: boolean;
}

export default function TextField({ fieldId, value, onChange, error, required }: Props) {
  const def = FIELD_BY_ID[fieldId];
  if (!def) return null;

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const formatted = formatFieldValue(fieldId, e.target.value);
    onChange(fieldId, formatted);
  };

  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">
        {def.label}
        {required && <span className="field__required">*</span>}
      </span>
      <input
        id={`field-${fieldId}`}
        type="text"
        value={value ?? ''}
        onChange={handleChange}
        placeholder=""
        autoComplete="off"
      />
      {error && <span className="field__error-msg">{error}</span>}
    </label>
  );
}
