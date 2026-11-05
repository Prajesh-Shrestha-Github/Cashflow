// The Money Score as a ring. Decorative colours, but the meaning is also available as text (role="img" + label).
const SIZE = 220;
const STROKE = 18;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const ScoreRing = ({ score }) => {
  const filled = (Math.max(0, Math.min(100, score)) / 100) * CIRCUMFERENCE;
  return (
    <div className="relative h-[220px] w-[220px] shrink-0" role="img" aria-label={`Money score: ${score} out of 100`}>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} className="-rotate-90" aria-hidden="true">
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="rgba(245,239,224,0.16)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="#FFB400"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${filled} ${CIRCUMFERENCE}`}
          style={{ transition: 'stroke-dasharray .6s ease-out' }}
        />
      </svg>
      <div aria-hidden="true" className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-display text-7xl font-extrabold leading-none tracking-[-0.04em]">{score}</span>
        <span className="mt-1 text-lg text-paper/70">out of 100</span>
      </div>
    </div>
  );
};

export default ScoreRing;
