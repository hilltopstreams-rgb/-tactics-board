import { useRef, useCallback } from 'react'

const VIS_R = 2.6
const HIT_R = 6.5

export default function BallToken({ pos, onMove, onDragEnd }) {
  const svgRef   = useRef(null)
  const dragging = useRef(false)

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
    if (p) onMove(p.x, p.y)
  }, [clientToSvg, onMove])

  const onPointerUp = useCallback(() => {
    dragging.current = false
    onDragEnd?.('ball')
  }, [onDragEnd])

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
      {/* Shadow */}
      <circle cx={0.3} cy={0.3} r={VIS_R} fill="rgba(0,0,0,0.4)" />
      {/* White ball */}
      <circle cx={0} cy={0} r={VIS_R} fill="#f0f0f0" stroke="#222" strokeWidth={0.25} />
      {/* Centre pentagon */}
      <polygon points={pentagon(0, 0, 0.9)} fill="#222" />
      {/* 5 outer patches */}
      {[0, 72, 144, 216, 288].map((angle) => {
        const rad = (angle * Math.PI) / 180
        return (
          <polygon
            key={angle}
            points={pentagon(Math.cos(rad) * 1.65, Math.sin(rad) * 1.65, 0.75)}
            fill="#222"
          />
        )
      })}
    </g>
  )
}

function pentagon(cx, cy, r) {
  return Array.from({ length: 5 }, (_, i) => {
    const a = (i * 72 - 90) * (Math.PI / 180)
    return `${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`
  }).join(' ')
}
