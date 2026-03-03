import { useState, useCallback, useRef } from 'react'
import SoccerField from './SoccerField'
import PlayerToken from './PlayerToken'
import BallToken from './BallToken'
import '../TacticsBoard.css'

const W = 120
const H = 80
const CLAMP_MARGIN = 3.5
const BALL_START = { x: W / 2, y: H / 2 }
const MAX_TRAIL = 30
const TRAIL_MIN_DIST = 1.2
const TRAIL_LINGER_MS = 700

// ── Formations (red team, left-to-right, index = player number - 1) ──────────
const FORMATIONS = {
  '4-4-2': [
    { x: 6,  y: 40 },
    { x: 20, y: 13 }, { x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 67 },
    { x: 38, y: 13 }, { x: 38, y: 30 }, { x: 38, y: 50 }, { x: 38, y: 67 },
    { x: 54, y: 30 }, { x: 54, y: 50 },
  ],
  '4-3-3': [
    { x: 6,  y: 40 },
    { x: 20, y: 13 }, { x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 67 },
    { x: 40, y: 20 }, { x: 42, y: 40 }, { x: 40, y: 60 },
    { x: 56, y: 13 }, { x: 58, y: 40 }, { x: 56, y: 67 },
  ],
  '4-2-3-1': [
    { x: 6,  y: 40 },
    { x: 20, y: 13 }, { x: 20, y: 30 }, { x: 20, y: 50 }, { x: 20, y: 67 },
    { x: 33, y: 28 }, { x: 33, y: 52 },
    { x: 48, y: 13 }, { x: 50, y: 40 }, { x: 48, y: 67 },
    { x: 58, y: 40 },
  ],
  '3-5-2': [
    { x: 6,  y: 40 },
    { x: 20, y: 20 }, { x: 20, y: 40 }, { x: 20, y: 60 },
    { x: 35, y: 10 }, { x: 38, y: 27 }, { x: 38, y: 40 }, { x: 38, y: 53 }, { x: 35, y: 70 },
    { x: 54, y: 30 }, { x: 54, y: 50 },
  ],
}

const DEFAULT_FORMATION = '4-4-2'

// Blue always starts in a mirrored 4-4-2
const BLUE_START = [
  { x: W - 6,  y: 40 },
  { x: W - 20, y: 13 }, { x: W - 20, y: 30 }, { x: W - 20, y: 50 }, { x: W - 20, y: 67 },
  { x: W - 38, y: 13 }, { x: W - 38, y: 30 }, { x: W - 38, y: 50 }, { x: W - 38, y: 67 },
  { x: W - 54, y: 30 }, { x: W - 54, y: 50 },
]

function buildPlayers(formation = DEFAULT_FORMATION) {
  const players = []
  FORMATIONS[formation].forEach((pos, i) => {
    players.push({ id: `red-${i + 1}`, team: 'red', number: i + 1, pos: { ...pos } })
  })
  BLUE_START.forEach((pos, i) => {
    players.push({ id: `blue-${i + 1}`, team: 'blue', number: i + 1, pos: { ...pos } })
  })
  return players
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function appendTrail(prev, id, x, y) {
  const existing = prev[id] ?? []
  const last = existing[existing.length - 1]
  if (last && Math.hypot(x - last.x, y - last.y) < TRAIL_MIN_DIST) return prev
  return { ...prev, [id]: [...existing.slice(-(MAX_TRAIL - 1)), { x, y }] }
}

export default function TacticsBoard() {
  const [players, setPlayers] = useState(() => buildPlayers())
  const [ballPos, setBallPos] = useState(BALL_START)
  const [trails, setTrails] = useState({})
  const [formation, setFormation] = useState(DEFAULT_FORMATION)
  const trailTimers = useRef({})

  const handleMove = useCallback((id, x, y) => {
    const cx = clamp(x, CLAMP_MARGIN, W - CLAMP_MARGIN)
    const cy = clamp(y, CLAMP_MARGIN, H - CLAMP_MARGIN)
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, pos: { x: cx, y: cy } } : p))
    setTrails(prev => appendTrail(prev, id, cx, cy))
  }, [])

  const handleBallMove = useCallback((x, y) => {
    const cx = clamp(x, CLAMP_MARGIN, W - CLAMP_MARGIN)
    const cy = clamp(y, CLAMP_MARGIN, H - CLAMP_MARGIN)
    setBallPos({ x: cx, y: cy })
    setTrails(prev => appendTrail(prev, 'ball', cx, cy))
  }, [])

  const handleDragEnd = useCallback((id) => {
    clearTimeout(trailTimers.current[id])
    trailTimers.current[id] = setTimeout(() => {
      setTrails(prev => { const next = { ...prev }; delete next[id]; return next })
    }, TRAIL_LINGER_MS)
  }, [])

  const clearTrails = useCallback(() => {
    setTrails({})
    Object.values(trailTimers.current).forEach(clearTimeout)
    trailTimers.current = {}
  }, [])

  const handleFormationChange = useCallback((f) => {
    setFormation(f)
    const positions = FORMATIONS[f]
    setPlayers(prev => prev.map(p => {
      if (!p.id.startsWith('red')) return p
      const idx = parseInt(p.id.split('-')[1]) - 1
      return { ...p, pos: { ...positions[idx] } }
    }))
    clearTrails()
  }, [clearTrails])

  const handleReset = useCallback(() => {
    setPlayers(buildPlayers(formation))
    setBallPos(BALL_START)
    clearTrails()
  }, [formation, clearTrails])

  return (
    <div className="tb-root">
      <div className="tb-field-wrapper">
        <SoccerField>
          {Object.entries(trails).map(([id, points]) => (
            <Trail
              key={id}
              points={points}
              color={id === 'ball' ? '#f5f5f5' : id.startsWith('red') ? '#e53e3e' : '#3182ce'}
            />
          ))}
          {players.map(p => (
            <PlayerToken
              key={p.id}
              id={p.id}
              number={p.number}
              team={p.team}
              pos={p.pos}
              onMove={handleMove}
              onDragEnd={handleDragEnd}
            />
          ))}
          <BallToken pos={ballPos} onMove={handleBallMove} onDragEnd={handleDragEnd} />
        </SoccerField>
      </div>

      <div className="tb-controls">
        <div className="tb-header">
          <div className="tb-header-left">
            <span className="tb-title">Tactics Board</span>
            <div className="tb-legend">
              <span className="tb-legend-dot" style={{ background: '#e53e3e' }} />
              Red
              <span className="tb-legend-sep" />
              <span className="tb-legend-dot" style={{ background: '#3182ce' }} />
              Blue
            </div>
          </div>
          <button className="tb-reset-btn" onClick={handleReset}>Reset</button>
        </div>

        <div className="tb-formation-row">
          {Object.keys(FORMATIONS).map(f => (
            <button
              key={f}
              className={`tb-formation-btn${formation === f ? ' active' : ''}`}
              onClick={() => handleFormationChange(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function Trail({ points, color }) {
  if (points.length < 2) return null
  return (
    <g style={{ pointerEvents: 'none' }}>
      {points.slice(1).map((pt, i) => {
        const prev = points[i]
        const t = (i + 1) / points.length
        return (
          <line
            key={i}
            x1={prev.x} y1={prev.y}
            x2={pt.x}   y2={pt.y}
            stroke={color}
            strokeOpacity={t * 0.65}
            strokeWidth={t * 2.2}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}
