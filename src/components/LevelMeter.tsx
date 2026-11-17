export function LevelMeter({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <span className="level" role="img" aria-label={`Livello ${value} su ${max}`}>
      {Array.from({ length: max }, (_, index) => (
        <span key={index} className={index < value ? 'level__cell is-filled' : 'level__cell'} />
      ))}
    </span>
  );
}
