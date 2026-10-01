interface Props {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
}

export default function DateField({ value, onChange, error, required }: Props) {
  return (
    <label className={`field ${error ? 'field--error' : ''}`}>
      <span className="field__label">
        Fecha de nacimiento
        {required && <span className="field__required">*</span>}
      </span>
      <input
        id="field-fechaNacimiento"
        type="date"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field__error-msg">{error}</span>}
    </label>
  );
}
