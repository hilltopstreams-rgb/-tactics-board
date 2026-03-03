// Renders a standard soccer pitch in SVG.
// The viewBox coordinate space is 120 x 80 (metres, roughly).
// All markings follow FIFA pitch proportions.

const W = 120
const H = 80

export default function SoccerField({ children }) {
  const grass = '#2d8a4e'
  const line = '#ffffff'
  const lw = 0.4  // line width in SVG units

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Pitch background */}
      <rect x={0} y={0} width={W} height={H} fill={grass} />

      {/* Alternating grass stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect
          key={i}
          x={i * 12}
          y={0}
          width={12}
          height={H}
          fill={i % 2 === 0 ? '#2d8a4e' : '#278045'}
        />
      ))}

      {/* Outer boundary */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke={line} strokeWidth={lw} />

      {/* Halfway line */}
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={line} strokeWidth={lw} />

      {/* Centre circle (r=9.15) */}
      <circle cx={W / 2} cy={H / 2} r={9.15} fill="none" stroke={line} strokeWidth={lw} />
      {/* Centre spot */}
      <circle cx={W / 2} cy={H / 2} r={0.5} fill={line} />

      {/* ── Left penalty area: 40.32 wide × 16.5 deep ── */}
      <rect
        x={0}
        y={(H - 40.32) / 2}
        width={16.5}
        height={40.32}
        fill="none"
        stroke={line}
        strokeWidth={lw}
      />
      {/* Left goal area: 18.32 wide × 5.5 deep */}
      <rect
        x={0}
        y={(H - 18.32) / 2}
        width={5.5}
        height={18.32}
        fill="none"
        stroke={line}
        strokeWidth={lw}
      />
      {/* Left goal (7.32 wide × 2.44 deep) */}
      <rect
        x={-2.44}
        y={(H - 7.32) / 2}
        width={2.44}
        height={7.32}
        fill="#aaa"
        stroke={line}
        strokeWidth={lw}
        opacity={0.5}
      />
      {/* Left penalty spot */}
      <circle cx={11} cy={H / 2} r={0.5} fill={line} />
      {/* Left penalty arc (only the part outside the box) */}
      <path
        d={describeArc(11, H / 2, 9.15, -53, 53)}
        fill="none"
        stroke={line}
        strokeWidth={lw}
        clipPath="url(#leftPenaltyClip)"
      />
      <clipPath id="leftPenaltyClip">
        <rect x={16.5} y={0} width={W} height={H} />
      </clipPath>

      {/* ── Right penalty area ── */}
      <rect
        x={W - 16.5}
        y={(H - 40.32) / 2}
        width={16.5}
        height={40.32}
        fill="none"
        stroke={line}
        strokeWidth={lw}
      />
      <rect
        x={W - 5.5}
        y={(H - 18.32) / 2}
        width={5.5}
        height={18.32}
        fill="none"
        stroke={line}
        strokeWidth={lw}
      />
      {/* Right goal */}
      <rect
        x={W}
        y={(H - 7.32) / 2}
        width={2.44}
        height={7.32}
        fill="#aaa"
        stroke={line}
        strokeWidth={lw}
        opacity={0.5}
      />
      {/* Right penalty spot */}
      <circle cx={W - 11} cy={H / 2} r={0.5} fill={line} />
      {/* Right penalty arc */}
      <path
        d={describeArc(W - 11, H / 2, 9.15, 127, 233)}
        fill="none"
        stroke={line}
        strokeWidth={lw}
        clipPath="url(#rightPenaltyClip)"
      />
      <clipPath id="rightPenaltyClip">
        <rect x={0} y={0} width={W - 16.5} height={H} />
      </clipPath>

      {/* Corner arcs */}
      <path d={describeArc(0, 0, 1, 0, 90)} fill="none" stroke={line} strokeWidth={lw} />
      <path d={describeArc(W, 0, 1, 90, 180)} fill="none" stroke={line} strokeWidth={lw} />
      <path d={describeArc(0, H, 1, 270, 360)} fill="none" stroke={line} strokeWidth={lw} />
      <path d={describeArc(W, H, 1, 180, 270)} fill="none" stroke={line} strokeWidth={lw} />

      {/* Player tokens rendered on top of the field */}
      {children}
    </svg>
  )
}

// Helpers for SVG arcs
function polarToCartesian(cx, cy, r, angleDeg) {
  const rad = ((angleDeg - 90) * Math.PI) / 180
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  }
}

function describeArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle)
  const end = polarToCartesian(cx, cy, r, startAngle)
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1'
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`
}
