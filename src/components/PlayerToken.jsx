import { useRef, useCallback } from 'react'

// Visual radius and touch-target radius in SVG units.
// On a 375px-wide phone (viewBox 120) 1 SVG unit ≈ 3.1px.
// HIT_R = 7.2 → ~44px diameter touch target on the smallest common phone.
const VIS_R = 3.8
const HIT_R = 7.2

const TEAM_COLORS = {
  red:  { fill: '#e53e3e', stroke: '#fff', text: '#fff' },
  blue: { fill: '#3182ce', stroke: '#fff', text: '#fff' },
}

export default function PlayerToken({ id, number, team, pos, onMove, onDragEnd }) {
  const svgRef   = useRef(null)
  const dragging = useRef(false)
  const { fill, stroke, text } = TEAM_COLORS[team]

  const clientToSvg = useCallback((clientX, clientY) => {
    const svg = svgRef.current
    if (!svg) return null
    const pt = svg.createSVGPoint()
    pt.x = clientX
    pt.y = clientY
    return pt.matrixTransform(svg.getScreenCTM().inverse())
  }, [])

  const onPointerDown = useCallback((e) => {
    e.stopPropagation()
    dragging.current = true
    svgRef.current = e.currentTarget.closest('svg')
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [])

  const onPointerMove = useCallback((e) => {
    if (!dragging.current) return
    const p = clientToSvg(e.clientX, e.clientY)
    if (p) onMove(id, p.x, p.y)
  }, [clientToSvg, id, onMove])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    onDragEnd?.(id)
  }, [id, onDragEnd])

  return (
    <g
      transform={`translate(${pos.x}, ${pos.y})`}
      style={{ cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Invisible oversized hit area for touch */}
      <circle cx={0} cy={0} r={HIT_R} fill="transparent" />
      {/* Drop shadow */}
      <circle cx={0.4} cy={0.4} r={VIS_R} fill="rgba(0,0,0,0.35)" />
      {/* Main circle */}
      <circle cx={0} cy={0} r={VIS_R} fill={fill} stroke={stroke} strokeWidth={0.5} />
      {/* Jersey number */}
      <text
        x={0} y={0}
        textAnchor="middle"
        dominantBaseline="central"
        fill={text}
        fontSize={2.9}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {number}
      </text>
    </g>
  )
}
