// Renders a soccer pitch in SVG.
// All markings are proportional to fieldW × fieldH so the same component
// works for every format (futsal → 11v11).
// `simplified` omits penalty arcs, spots and corner arcs for small-sided fields.

export default function SoccerField({ fieldW = 120, fieldH = 80, simplified = false, children }) {
  const W = fieldW
  const H = fieldH

  // Proportional markings — ratios derived from standard FIFA 120 × 80 field
  const pd   = W * 0.1375        // penalty area depth        (16.5 / 120)
  const phw  = H * 0.252         // penalty area half-width   (20.16 / 80)
  const gad  = W * 0.0458        // goal area depth           (5.5 / 120)
  const gahw = H * 0.1148        // goal area half-width      (9.16 / 80)
  const ghw  = H * 0.0458        // goal half-width           (3.66 / 80)
  const gdp  = Math.max(W * 0.02, 1.5) // goal depth (min 1.5 so it shows)
  const psx  = W * 0.0917        // penalty spot dist from goal (11 / 120)
  const ccr  = Math.min(W, H) * 0.115  // centre circle radius
  const cor  = Math.min(W, H) * 0.009  // corner arc radius
  const lw   = Math.max(W * 0.0033, 0.25) // line width

  const grass = '#2d8a4e'
  const dark  = '#278045'
  const line  = '#ffffff'

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      style={{ width: '100%', height: '100%', display: 'block' }}
      preserveAspectRatio="xMidYMid meet"
    >
      {/* Base grass */}
      <rect x={0} y={0} width={W} height={H} fill={grass} />

      {/* Alternating stripes */}
      {Array.from({ length: 10 }).map((_, i) => (
        <rect key={i} x={i * W / 10} y={0} width={W / 10} height={H}
          fill={i % 2 === 0 ? grass : dark} />
      ))}

      {/* Boundary */}
      <rect x={0} y={0} width={W} height={H} fill="none" stroke={line} strokeWidth={lw} />

      {/* Halfway line */}
      <line x1={W / 2} y1={0} x2={W / 2} y2={H} stroke={line} strokeWidth={lw} />

      {/* Centre circle + spot */}
      <circle cx={W / 2} cy={H / 2} r={ccr} fill="none" stroke={line} strokeWidth={lw} />
      <circle cx={W / 2} cy={H / 2} r={lw * 1.2} fill={line} />

      {/* ── Left side ── */}
      {/* Penalty area */}
      <rect x={0} y={H / 2 - phw} width={pd} height={phw * 2}
        fill="none" stroke={line} strokeWidth={lw} />
      {/* Goal area */}
      <rect x={0} y={H / 2 - gahw} width={gad} height={gahw * 2}
        fill="none" stroke={line} strokeWidth={lw} />
      {/* Goal */}
      <rect x={-gdp} y={H / 2 - ghw} width={gdp} height={ghw * 2}
        fill="#999" stroke={line} strokeWidth={lw} opacity={0.45} />
      {/* Penalty spot + arc (full fields only) */}
      {!simplified && <>
        <circle cx={psx} cy={H / 2} r={lw * 1.2} fill={line} />
        <path d={arc(psx, H / 2, ccr, -53, 53)}
          fill="none" stroke={line} strokeWidth={lw} clipPath="url(#lpc)" />
        <clipPath id="lpc">
          <rect x={pd} y={0} width={W} height={H} />
        </clipPath>
      </>}

      {/* ── Right side ── */}
      <rect x={W - pd} y={H / 2 - phw} width={pd} height={phw * 2}
        fill="none" stroke={line} strokeWidth={lw} />
      <rect x={W - gad} y={H / 2 - gahw} width={gad} height={gahw * 2}
        fill="none" stroke={line} strokeWidth={lw} />
      <rect x={W} y={H / 2 - ghw} width={gdp} height={ghw * 2}
        fill="#999" stroke={line} strokeWidth={lw} opacity={0.45} />
      {!simplified && <>
        <circle cx={W - psx} cy={H / 2} r={lw * 1.2} fill={line} />
        <path d={arc(W - psx, H / 2, ccr, 127, 233)}
          fill="none" stroke={line} strokeWidth={lw} clipPath="url(#rpc)" />
        <clipPath id="rpc">
          <rect x={0} y={0} width={W - pd} height={H} />
        </clipPath>
      </>}

      {/* Corner arcs */}
      {!simplified && <>
        <path d={arc(0, 0, cor, 0, 90)}     fill="none" stroke={line} strokeWidth={lw} />
        <path d={arc(W, 0, cor, 90, 180)}   fill="none" stroke={line} strokeWidth={lw} />
        <path d={arc(0, H, cor, 270, 360)}  fill="none" stroke={line} strokeWidth={lw} />
        <path d={arc(W, H, cor, 180, 270)}  fill="none" stroke={line} strokeWidth={lw} />
      </>}

      {children}
    </svg>
  )
}

function polarToCart(cx, cy, r, deg) {
  const rad = ((deg - 90) * Math.PI) / 180
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) }
}

function arc(cx, cy, r, start, end) {
  const s = polarToCart(cx, cy, r, end)
  const e = polarToCart(cx, cy, r, start)
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${end - start <= 180 ? 0 : 1} 0 ${e.x} ${e.y}`
}
