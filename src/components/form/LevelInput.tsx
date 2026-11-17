interface Props {
  id: string;
  value: string;
  onChange: (value: string) => void;
  max?: number;
}

export function LevelInput({ id, value, onChange, max = 5 }: Props) {
  const current = Number(value) || 0;
  return (
    <div id={id} className="level-input" role="radiogroup" aria-label="Livello">
      {Array.from({ length: max }, (_, index) => {
        const level = index + 1;
        return (
          <button
            key={level}
            type="button"
            role="radio"
            aria-checked={current === level}
            aria-label={`Livello ${level}`}
            className={level <= current ? 'level-input__cell is-filled' : 'level-input__cell'}
            onClick={() => onChange(String(level))}
          >
            {level}
          </button>
        );
      })}
      <span className="muted level-input__caption">{current ? `${current} su ${max}` : 'Non impostato'}</span>
    </div>
  );
}
