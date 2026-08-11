export default function ScoreDial({ score = 0, size = 96, label = 'SCORE' }) {
  const radius = (size - 10) / 2
  const circumference = 2 * Math.PI * radius
  const pct = Math.max(0, Math.min(100, score))
  const offset = circumference - (pct / 100) * circumference
  const color = pct >= 80 ? '#34D399' : pct >= 50 ? '#FFB020' : '#F87171'

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size/2} cy={size/2} r={radius} fill="none" stroke="#1F2937" strokeWidth="6" />
          <circle
            cx={size/2} cy={size/2} r={radius} fill="none"
            stroke={color} strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.3s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center font-mono font-semibold text-lg" style={{color}}>
          {Math.round(pct)}
        </div>
      </div>
      <div className="text-[10px] font-mono tracking-widest text-[#6B7280]">{label}</div>
    </div>
  )
}
