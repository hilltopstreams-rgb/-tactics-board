import { useRef, useCallback } from 'react'

// Human silhouette: trapezoid body (wide shoulders, narrower hips) + round head.
// All coords are relative to the player's pos (transform origin).
// The anchor sits at mid-torso so trail lines attach naturally.
//
// Head top ≈ y -4.1  |  Body bottom ≈ y +2.6  |  Total height ≈ 6.7 SVG units
// Body shoulder width ≈ 4.4  |  Body hip width ≈ 2.8
const HEAD_R  = 1.3
const HEAD_CY = -2.8
// Trapezoid body with a concave collar curve at the top (Q creates the shoulder dip)
const BODY    = 'M -2.2,-1.2 L -1.4,2.6 L 1.4,2.6 L 2.2,-1.2 Q 0,-2.1 -2.2,-1.2 Z'
const SHADOW  = 0.4

const TEAM_COLORS = {
  red:  { fill: '#e53e3e', stroke: '#fff' },
  blue: { fill: '#3182ce', stroke: '#fff' },
}

export default function PlayerToken({ id, number, team, pos, onMove, onDragEnd }) {
  const svgRef   = useRef(null)
  const dragging = useRef(false)
  const { fill, stroke } = TEAM_COLORS[team]

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
      transform={`translate(${pos.x},${pos.y})`}
      style={{ cursor: 'grab' }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {/* Invisible hit area covering the whole figure */}
      <rect x={-5} y={-5} width={10} height={9} fill="transparent" />

      {/* Drop shadow */}
      <g transform={`translate(${SHADOW},${SHADOW})`} style={{ pointerEvents: 'none' }}>
        <path d={BODY} fill="rgba(0,0,0,0.28)" />
        <circle cx={0} cy={HEAD_CY} r={HEAD_R} fill="rgba(0,0,0,0.28)" />
      </g>

      {/* Body */}
      <path d={BODY} fill={fill} stroke={stroke} strokeWidth={0.4} style={{ pointerEvents: 'none' }} />

      {/* Head */}
      <circle cx={0} cy={HEAD_CY} r={HEAD_R} fill={fill} stroke={stroke} strokeWidth={0.4} style={{ pointerEvents: 'none' }} />

      {/* Jersey number — centred in the body */}
      <text
        x={0} y={0.7}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#fff"
        fontSize={2.2}
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
        style={{ pointerEvents: 'none' }}
      >
        {number}
      </text>
    </g>
  )
}
