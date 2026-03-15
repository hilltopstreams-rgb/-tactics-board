import { useState, useCallback, useRef } from 'react'
import SoccerField from './SoccerField'
import PlayerToken from './PlayerToken'
import BallToken from './BallToken'
import TacticsAssistant from './TacticsAssistant'
import PlaysDrawer from './PlaysDrawer'
import { usePlays } from '../hooks/usePlays'
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
  // All x values must be < W/2 so red tokens stay in the left half and
  // mirrored blue tokens stay in the right half.
  // W/2 per format: futsal=30, 4v4=30, 7v7=40, 9v9=50, 11v11=60

  futsal: {
    '2-1': [
      { x: 4,  y: 15 },  // GK
      { x: 14, y: 9  },  // DefL
      { x: 14, y: 21 },  // DefR
      { x: 21, y: 15 },  // Pivot
      { x: 27, y: 15 },  // Fwd
    ],
    '1-2': [
      { x: 4,  y: 15 },  // GK
      { x: 13, y: 15 },  // Def
      { x: 21, y: 8  },  // MidL
      { x: 21, y: 22 },  // MidR
      { x: 27, y: 15 },  // Fwd
    ],
    'diamond': [
      { x: 4,  y: 15 },  // GK
      { x: 14, y: 15 },  // Back
      { x: 21, y: 8  },  // SideL
      { x: 21, y: 22 },  // SideR
      { x: 27, y: 15 },  // Top
    ],
  },

  '4v4': {
    '2-1': [
      { x: 5,  y: 22.5 }, // GK
      { x: 17, y: 13   }, // DefL
      { x: 17, y: 32   }, // DefR
      { x: 27, y: 22.5 }, // Fwd
    ],
    '1-2-1': [
      { x: 8,  y: 22.5 }, // Back
      { x: 20, y: 12   }, // MidL
      { x: 20, y: 33   }, // MidR
      { x: 27, y: 22.5 }, // Fwd
    ],
    '1-1-2': [
      { x: 5,  y: 22.5 }, // GK
      { x: 18, y: 22.5 }, // Mid
      { x: 27, y: 13   }, // FwdL
      { x: 27, y: 32   }, // FwdR
    ],
  },

  '7v7': {
    '2-3-1': [
      { x: 5,  y: 27.5 }, // GK
      { x: 17, y: 15   }, // DefL
      { x: 17, y: 40   }, // DefR
      { x: 29, y: 9    }, // MidL
      { x: 30, y: 27.5 }, // MidC
      { x: 29, y: 46   }, // MidR
      { x: 38, y: 27.5 }, // Fwd
    ],
    '3-2-1': [
      { x: 5,  y: 27.5 }, // GK
      { x: 17, y: 10   }, // DefL
      { x: 17, y: 27.5 }, // DefC
      { x: 17, y: 45   }, // DefR
      { x: 29, y: 18   }, // MidL
      { x: 29, y: 37   }, // MidR
      { x: 38, y: 27.5 }, // Fwd
    ],
    '2-2-2': [
      { x: 5,  y: 27.5 }, // GK
      { x: 17, y: 15   }, // DefL
      { x: 17, y: 40   }, // DefR
      { x: 28, y: 15   }, // MidL
      { x: 28, y: 40   }, // MidR
      { x: 38, y: 15   }, // FwdL
      { x: 38, y: 40   }, // FwdR
    ],
    '1-3-2': [
      { x: 5,  y: 27.5 }, // GK
      { x: 16, y: 27.5 }, // Sweeper
      { x: 28, y: 9    }, // MidL
      { x: 29, y: 27.5 }, // MidC
      { x: 28, y: 46   }, // MidR
      { x: 38, y: 17   }, // FwdL
      { x: 38, y: 38   }, // FwdR
    ],
  },

  '9v9': {
    '3-2-3': [
      { x: 6,  y: 32.5 }, // GK
      { x: 19, y: 12   }, // DefL
      { x: 19, y: 32.5 }, // DefC
      { x: 19, y: 53   }, // DefR
      { x: 34, y: 20   }, // MidL
      { x: 34, y: 45   }, // MidR
      { x: 46, y: 12   }, // FwdL
      { x: 47, y: 32.5 }, // FwdC
      { x: 46, y: 53   }, // FwdR
    ],
    '3-3-2': [
      { x: 6,  y: 32.5 }, // GK
      { x: 19, y: 12   }, // DefL
      { x: 19, y: 32.5 }, // DefC
      { x: 19, y: 53   }, // DefR
      { x: 34, y: 12   }, // MidL
      { x: 34, y: 32.5 }, // MidC
      { x: 34, y: 53   }, // MidR
      { x: 46, y: 22   }, // FwdL
      { x: 46, y: 43   }, // FwdR
    ],
    '2-4-2': [
      { x: 6,  y: 32.5 }, // GK
      { x: 19, y: 18   }, // DefL
      { x: 19, y: 47   }, // DefR
      { x: 34, y: 10   }, // MidLL
      { x: 34, y: 25   }, // MidL
      { x: 34, y: 40   }, // MidR
      { x: 34, y: 55   }, // MidRR
      { x: 46, y: 22   }, // FwdL
      { x: 46, y: 43   }, // FwdR
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

// Iterative separation: push players apart until no two are closer than 8% of W.
// Runs up to MAX_ITER passes; exits early once nothing moves.
function separatePlayers(players, W, H) {
  const MIN_DIST = W * 0.08
  const MAX_ITER = 60
  const pos = players.map(p => ({ x: p.pos.x, y: p.pos.y }))

  for (let iter = 0; iter < MAX_ITER; iter++) {
    let anyMoved = false
    for (let i = 0; i < pos.length; i++) {
      for (let j = i + 1; j < pos.length; j++) {
        const dx = pos[j].x - pos[i].x
        const dy = pos[j].y - pos[i].y
        const dist = Math.hypot(dx, dy)
        if (dist < MIN_DIST) {
          if (dist < 1e-6) {
            // Exact overlap — nudge apart horizontally
            pos[i].x -= MIN_DIST * 0.5
            pos[j].x += MIN_DIST * 0.5
          } else {
            const push = (MIN_DIST - dist) * 0.5
            const nx = dx / dist
            const ny = dy / dist
            pos[i].x -= nx * push
            pos[i].y -= ny * push
            pos[j].x += nx * push
            pos[j].y += ny * push
          }
          anyMoved = true
        }
      }
    }
    // Clamp to field after every full sweep
    for (let i = 0; i < pos.length; i++) {
      pos[i].x = clamp(pos[i].x, CLAMP_MARGIN, W - CLAMP_MARGIN)
      pos[i].y = clamp(pos[i].y, CLAMP_MARGIN, H - CLAMP_MARGIN)
    }
    if (!anyMoved) break
  }

  return players.map((p, i) => ({ ...p, pos: pos[i] }))
}

function appendTrail(prev, id, x, y) {
  const existing = prev[id] ?? []
  const last = existing[existing.length - 1]
  if (last && Math.hypot(x - last.x, y - last.y) < TRAIL_MIN_DIST) return prev
  return { ...prev, [id]: [...existing.slice(-(MAX_TRAIL - 1)), { x, y }] }
}

function buildPlayers(format, formation) {
  const { W, H } = FORMAT_CONFIGS[format]
  const positions = FORMATIONS[format][formation]
  const players = []
  positions.forEach((pos, i) => {
    players.push({ id: `red-${i + 1}`,  team: 'red',  number: i + 1, pos: { ...pos } })
    players.push({ id: `blue-${i + 1}`, team: 'blue', number: i + 1, pos: { x: W - pos.x, y: pos.y } })
  })
  return separatePlayers(players, W, H)
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function TacticsBoard() {
  const [format,    setFormat]    = useState(DEFAULT_FORMAT)
  const [formation, setFormation] = useState(FORMAT_CONFIGS[DEFAULT_FORMAT].defaultFormation)
  const [players,   setPlayers]   = useState(() => buildPlayers(DEFAULT_FORMAT, FORMAT_CONFIGS[DEFAULT_FORMAT].defaultFormation))
  const [ballPos,   setBallPos]   = useState(() => { const c = FORMAT_CONFIGS[DEFAULT_FORMAT]; return { x: c.W / 2, y: c.H / 2 } })
  const [trails,    setTrails]    = useState({})
  const trailTimers = useRef({})

  // ── Plays (save / load) ───────────────────────────────────────
  const { plays, savePlay, deletePlay } = usePlays()
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [saving,     setSaving]     = useState(false)
  const [playName,   setPlayName]   = useState('')

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

  const handleApplyVariation = useCallback((variation) => {
    const { positions } = variation
    setPlayers(prev => {
      const updated = prev.map(p => {
        const idx = parseInt(p.id.split('-')[1]) - 1
        if (p.id.startsWith('red')  && positions.red?.[idx])  return { ...p, pos: { x: positions.red[idx][0],  y: positions.red[idx][1]  } }
        if (p.id.startsWith('blue') && positions.blue?.[idx]) return { ...p, pos: { x: positions.blue[idx][0], y: positions.blue[idx][1] } }
        return p
      })
      return separatePlayers(updated, W, H)
    })
    clearTrails()
  }, [W, H, clearTrails])

  const handleSaveConfirm = useCallback(() => {
    const name = playName.trim()
    if (!name) return
    savePlay({ id: Date.now().toString(), name, format, formation, players, savedAt: Date.now() })
    setSaving(false)
    setPlayName('')
  }, [playName, format, formation, players, savePlay])

  const handleSaveCancel = useCallback(() => { setSaving(false); setPlayName('') }, [])

  const handleLoadPlay = useCallback((play) => {
    const cfg = FORMAT_CONFIGS[play.format]
    setFormat(play.format)
    setFormation(play.formation)
    setPlayers(play.players)
    setBallPos({ x: cfg.W / 2, y: cfg.H / 2 })
    clearTrails()
  }, [clearTrails])

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
        <div className="tb-controls-row">
          {/* Title + legend + reset */}
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

          {/* Format + formation selectors (side-by-side on desktop) */}
          <div className="tb-selectors">
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

        {/* Save Play / My Plays row */}
        <div className="tb-plays-row">
          {saving ? (
            <>
              <input
                className="tb-save-input"
                autoFocus
                placeholder="Play name…"
                value={playName}
                onChange={e => setPlayName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter')  handleSaveConfirm()
                  if (e.key === 'Escape') handleSaveCancel()
                }}
              />
              <button className="tb-save-confirm-btn" onClick={handleSaveConfirm} disabled={!playName.trim()}>✓</button>
              <button className="tb-save-cancel-btn"  onClick={handleSaveCancel}>✕</button>
            </>
          ) : (
            <>
              <button className="tb-save-btn"  onClick={() => setSaving(true)}>Save Play</button>
              <button className="tb-plays-btn" onClick={() => setDrawerOpen(true)}>
                My Plays
                {plays.length > 0 && <span className="tb-plays-count">{plays.length}</span>}
              </button>
            </>
          )}
        </div>

        <TacticsAssistant
          format={format}
          formation={formation}
          playerCount={FORMAT_CONFIGS[format].playerCount}
          fieldW={W}
          fieldH={H}
          onApply={handleApplyVariation}
        />
      </div>

      <PlaysDrawer
        plays={plays}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        onLoad={handleLoadPlay}
        onDelete={deletePlay}
      />
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
