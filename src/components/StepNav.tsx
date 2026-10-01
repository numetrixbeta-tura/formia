import type { SectionDef } from '../config/sections';

interface Props {
  sections: SectionDef[];
  currentIndex: number;
  onSelect: (index: number) => void;
  sectionErrorCounts: number[];
}

export default function StepNav({ sections, currentIndex, onSelect, sectionErrorCounts }: Props) {
  const progressPct = Math.round((currentIndex / sections.length) * 100);

  return (
    <nav className="step-nav">
      <div className="step-nav__progress-track">
        <div className="step-nav__progress-fill" style={{ width: `${progressPct}%` }} />
      </div>
      <ol>
        {sections.map((s, i) => (
          <li key={s.id}>
            <button
              type="button"
              className={`step-nav__item ${i === currentIndex ? 'step-nav__item--active' : ''} ${
                i < currentIndex ? 'step-nav__item--done' : ''
              }`}
              onClick={() => onSelect(i)}
            >
              <span className="step-nav__num">{i + 1}</span>
              <span className="step-nav__title">{s.title}</span>
              {sectionErrorCounts[i] > 0 && (
                <span className="step-nav__badge">{sectionErrorCounts[i]}</span>
              )}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className={`step-nav__item ${currentIndex === sections.length ? 'step-nav__item--active' : ''}`}
            onClick={() => onSelect(sections.length)}
          >
            <span className="step-nav__num">✓</span>
            <span className="step-nav__title">Revisión final</span>
          </button>
        </li>
      </ol>
    </nav>
  );
}
