import { useState, useCallback, useRef } from 'react'
import SoccerField from './SoccerField'
import PlayerToken from './PlayerToken'
import BallToken from './BallToken'
import '../TacticsBoard.css'

// ── Format configs ────────────────────────────────────────────────────────────
const FORMAT_CONFIGS = {
  futsal:  { W: 60,  H: 30, label: 'Futsal', playerCount: 5,  defaultFormation: '2-1',   simplified: true  },
  '4v4':   { W: 60,  H: 45, label: '4v4',    playerCount: 4,  defaultFormation: '2-1',   simplified: true  },
  '7v7':   { W: 80,  H: 55, label: '7v7',    playerCount: 7,  defaultFormation: '2-3-1', simplified: false },
  '9v9':   { W: 100, H: 65, label: '9v9',    playerCount: 9,  defaultFormation: '3-2-3', simplified: false },
  '11v11': { W: 120, H: 80, label: '11v11',  playerCount: 11, defaultFormation: '4-4-2', simplified: false },
}

const DEFAULT_FORMAT = '7v7'

// ── Formations ────────────────────────────────────────────────────────────────
// All positions are for the RED team (attacks left → right).
// Blue is built by mirroring: x_blue = W - x_red.
// Player index 0 is always #1 (GK / deepest defender).

const FORMATIONS = {
  futsal: {
    '2-1': [
      { x: 4,  y: 15 },  // GK
      { x: 15, y: 9  },  // DefL
      { x: 15, y: 21 },  // DefR
      { x: 30, y: 15 },  // Pivot
      { x: 48, y: 15 },  // Fwd
    ],
    '1-2': [
      { x: 4,  y: 15 },  // GK
      { x: 14, y: 15 },  // Def
      { x: 28, y: 9  },  // MidL
      { x: 28, y: 21 },  // MidR
      { x: 48, y: 15 },  // Fwd
    ],
    'diamond': [
      { x: 4,  y: 15 },  // GK
      { x: 17, y: 15 },  // Back
      { x: 30, y: 8  },  // WideL
      { x: 30, y: 22 },  // WideR
      { x: 46, y: 15 },  // Top
    ],
  },

  '4v4': {
    '2-1': [
      { x: 5,  y: 22.5 }, // GK
      { x: 18, y: 14   }, // DefL
      { x: 18, y: 31   }, // DefR
      { x: 42, y: 22.5 }, // Fwd
    ],
    '1-2-1': [
      { x: 9,  y: 22.5 }, // Back
      { x: 26, y: 13   }, // MidL
      { x: 26, y: 32   }, // MidR
      { x: 44, y: 22.5 }, // Fwd
    ],
    '1-1-2': [
      { x: 5,  y: 22.5 }, // GK
      { x: 24, y: 22.5 }, // Mid
      { x: 40, y: 14   }, // FwdL
      { x: 40, y: 31   }, // FwdR
    ],
  },

  '7v7': {
    '2-3-1': [
      { x: 5,  y: 27.5 }, // GK
      { x: 19, y: 16   }, // DefL
      { x: 19, y: 39   }, // DefR
      { x: 36, y: 10   }, // MidL
      { x: 37, y: 27.5 }, // MidC
      { x: 36, y: 45   }, // MidR
      { x: 57, y: 27.5 }, // Fwd
    ],
    '3-2-1': [
      { x: 5,  y: 27.5 }, // GK
      { x: 19, y: 11   }, // DefL
      { x: 19, y: 27.5 }, // DefC
      { x: 19, y: 44   }, // DefR
      { x: 38, y: 18   }, // MidL
      { x: 38, y: 37   }, // MidR
      { x: 57, y: 27.5 }, // Fwd
    ],
    '2-2-2': [
      { x: 5,  y: 27.5 }, // GK
      { x: 19, y: 16   }, // DefL
      { x: 19, y: 39   }, // DefR
      { x: 38, y: 16   }, // MidL
      { x: 38, y: 39   }, // MidR
      { x: 57, y: 16   }, // FwdL
      { x: 57, y: 39   }, // FwdR
    ],
    '1-3-2': [
      { x: 5,  y: 27.5 }, // GK
      { x: 18, y: 27.5 }, // Sweeper
      { x: 34, y: 10   }, // MidL
      { x: 36, y: 27.5 }, // MidC
      { x: 34, y: 45   }, // MidR
      { x: 57, y: 18   }, // FwdL
      { x: 57, y: 37   }, // FwdR
    ],
  },

  '9v9': {
    '3-2-3': [
      { x: 6,  y: 32.5 }, // GK
      { x: 20, y: 13   }, // DefL
      { x: 20, y: 32.5 }, // DefC
      { x: 20, y: 52   }, // DefR
      { x: 43, y: 20   }, // MidL
      { x: 43, y: 45   }, // MidR
      { x: 65, y: 13   }, // FwdL
      { x: 67, y: 32.5 }, // FwdC
      { x: 65, y: 52   }, // FwdR
    ],
    '3-3-2': [
      { x: 6,  y: 32.5 }, // GK
      { x: 20, y: 13   }, // DefL
      { x: 20, y: 32.5 }, // DefC
      { x: 20, y: 52   }, // DefR
      { x: 43, y: 13   }, // MidL
      { x: 43, y: 32.5 }, // MidC
      { x: 43, y: 52   }, // MidR
      { x: 65, y: 22   }, // FwdL
      { x: 65, y: 43   }, // FwdR
    ],
    '2-4-2': [
      { x: 6,  y: 32.5 }, // GK
      { x: 20, y: 18   }, // DefL
      { x: 20, y: 47   }, // DefR
      { x: 43, y: 10   }, // MidLL
      { x: 43, y: 25   }, // MidL
      { x: 43, y: 40   }, // MidR
      { x: 43, y: 55   }, // MidRR
      { x: 65, y: 22   }, // FwdL
      { x: 65, y: 43   }, // FwdR
    ],
  },

  '11v11': {
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
  },
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const CLAMP_MARGIN = 3.5
const MAX_TRAIL = 30
const TRAIL_MIN_DIST = 1.2
const TRAIL_LINGER_MS = 700

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)) }

function appendTrail(prev, id, x, y) {
  const existing = prev[id] ?? []
  const last = existing[existing.length - 1]
  if (last && Math.hypot(x - last.x, y - last.y) < TRAIL_MIN_DIST) return prev
  return { ...prev, [id]: [...existing.slice(-(MAX_TRAIL - 1)), { x, y }] }
}

function buildPlayers(format, formation) {
  const { W } = FORMAT_CONFIGS[format]
  const positions = FORMATIONS[format][formation]
  const players = []
  positions.forEach((pos, i) => {
    players.push({ id: `red-${i + 1}`,  team: 'red',  number: i + 1, pos: { ...pos } })
    players.push({ id: `blue-${i + 1}`, team: 'blue', number: i + 1, pos: { x: W - pos.x, y: pos.y } })
  })
  return players
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TacticsBoard() {
  const [format,    setFormat]    = useState(DEFAULT_FORMAT)
  const [formation, setFormation] = useState(FORMAT_CONFIGS[DEFAULT_FORMAT].defaultFormation)
  const [players,   setPlayers]   = useState(() => buildPlayers(DEFAULT_FORMAT, FORMAT_CONFIGS[DEFAULT_FORMAT].defaultFormation))
  const [ballPos,   setBallPos]   = useState(() => { const c = FORMAT_CONFIGS[DEFAULT_FORMAT]; return { x: c.W / 2, y: c.H / 2 } })
  const [trails,    setTrails]    = useState({})
  const trailTimers = useRef({})

  // Derived field dims — safe to use in callbacks via closure (deps include format)
  const { W, H, simplified } = FORMAT_CONFIGS[format]

  const clearTrails = useCallback(() => {
    setTrails({})
    Object.values(trailTimers.current).forEach(clearTimeout)
    trailTimers.current = {}
  }, [])

  const handleMove = useCallback((id, x, y) => {
    const cx = clamp(x, CLAMP_MARGIN, W - CLAMP_MARGIN)
    const cy = clamp(y, CLAMP_MARGIN, H - CLAMP_MARGIN)
    setPlayers(prev => prev.map(p => p.id === id ? { ...p, pos: { x: cx, y: cy } } : p))
    setTrails(prev => appendTrail(prev, id, cx, cy))
  }, [W, H])

  const handleBallMove = useCallback((x, y) => {
    const cx = clamp(x, CLAMP_MARGIN, W - CLAMP_MARGIN)
    const cy = clamp(y, CLAMP_MARGIN, H - CLAMP_MARGIN)
    setBallPos({ x: cx, y: cy })
    setTrails(prev => appendTrail(prev, 'ball', cx, cy))
  }, [W, H])

  const handleDragEnd = useCallback((id) => {
    clearTimeout(trailTimers.current[id])
    trailTimers.current[id] = setTimeout(() => {
      setTrails(prev => { const next = { ...prev }; delete next[id]; return next })
    }, TRAIL_LINGER_MS)
  }, [])

  const handleFormationChange = useCallback((f) => {
    setFormation(f)
    const positions = FORMATIONS[format][f]
    const { W: fw } = FORMAT_CONFIGS[format]
    setPlayers(prev => prev.map(p => {
      const idx = parseInt(p.id.split('-')[1]) - 1
      if (p.id.startsWith('red'))  return { ...p, pos: { ...positions[idx] } }
      if (p.id.startsWith('blue')) return { ...p, pos: { x: fw - positions[idx].x, y: positions[idx].y } }
      return p
    }))
    clearTrails()
  }, [format, clearTrails])

  const handleFormatChange = useCallback((f) => {
    const cfg = FORMAT_CONFIGS[f]
    const def = cfg.defaultFormation
    setFormat(f)
    setFormation(def)
    setPlayers(buildPlayers(f, def))
    setBallPos({ x: cfg.W / 2, y: cfg.H / 2 })
    clearTrails()
  }, [clearTrails])

  const handleReset = useCallback(() => {
    setPlayers(buildPlayers(format, formation))
    setBallPos({ x: W / 2, y: H / 2 })
    clearTrails()
  }, [format, formation, W, H, clearTrails])

  const formatKeys    = Object.keys(FORMAT_CONFIGS)
  const formationKeys = Object.keys(FORMATIONS[format])

  return (
    <div className="tb-root">
      <div className="tb-field-wrapper">
        <SoccerField fieldW={W} fieldH={H} simplified={simplified}>
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
        {/* Row 1: title + legend + reset */}
        <div className="tb-header">
          <div className="tb-header-left">
            <span className="tb-title">Tactics Board</span>
            <div className="tb-legend">
              <span className="tb-legend-dot" style={{ background: '#e53e3e' }} /> Red
              <span className="tb-legend-sep" />
              <span className="tb-legend-dot" style={{ background: '#3182ce' }} /> Blue
            </div>
          </div>
          <button className="tb-reset-btn" onClick={handleReset}>Reset</button>
        </div>

        {/* Row 2 + 3 (side-by-side on desktop) */}
        <div className="tb-selectors">
          {/* Format selector */}
          <div className="tb-format-row">
            {formatKeys.map(f => (
              <button
                key={f}
                className={`tb-format-btn${format === f ? ' active' : ''}`}
                onClick={() => handleFormatChange(f)}
              >
                {FORMAT_CONFIGS[f].label}
              </button>
            ))}
          </div>

          {/* Formation selector */}
          <div className="tb-formation-row">
            {formationKeys.map(f => (
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
    </div>
  )
}

// ── Trail ─────────────────────────────────────────────────────────────────────
function Trail({ points, color }) {
  if (points.length < 2) return null
  return (
    <g style={{ pointerEvents: 'none' }}>
      {points.slice(1).map((pt, i) => {
        const prev = points[i]
        const t = (i + 1) / points.length
        return (
          <line key={i}
            x1={prev.x} y1={prev.y} x2={pt.x} y2={pt.y}
            stroke={color} strokeOpacity={t * 0.65} strokeWidth={t * 2.2}
            strokeLinecap="round"
          />
        )
      })}
    </g>
  )
}
