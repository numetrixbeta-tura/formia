import type { RadioGroupDef } from '../config/sections';

interface Props {
  group: RadioGroupDef;
  selected?: string;
  onChange: (groupId: string, checkId: string) => void;
}

export default function RadioGroupField({ group, selected, onChange }: Props) {
  return (
    <div className="radio-group" id={`field-${group.id}`}>
      <span className="radio-group__label">{group.label}</span>
      <div className="radio-group__options">
        {group.options.map((opt) => (
          <button
            type="button"
            key={opt.checkId}
            className={`chip ${selected === opt.checkId ? 'chip--active' : ''}`}
            onClick={() => onChange(group.id, selected === opt.checkId ? '' : opt.checkId)}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
