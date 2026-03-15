import { useState } from 'react'

const API_URL = 'https://api.anthropic.com/v1/messages'
const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY

function buildPrompt(situation, { format, formation, playerCount, fieldW, fieldH }) {
  const half = fieldW / 2
  return `You are a soccer/football tactics coach. The tactics board uses SVG coordinates.

Current setup:
- Format: ${format} (${playerCount} players per team including GK)
- Current formation: ${formation}
- Field dimensions: ${fieldW}×${fieldH} SVG units

Coordinate rules (strictly enforce):
- Red team attacks left→right. Blue team attacks right→left.
- Player index 0 = GK, indices 1–${playerCount - 1} = outfield.
- Red GK: x ≈ 5,  y ≈ ${(fieldH / 2).toFixed(1)}
- Blue GK: x ≈ ${fieldW - 5}, y ≈ ${(fieldH / 2).toFixed(1)}
- Red outfield: x in [6, ${half - 2}]
- Blue outfield: x in [${half + 2}, ${fieldW - 6}]
- All players: y in [3.5, ${(fieldH - 3.5).toFixed(1)}]
- NEVER place a red player at x ≥ ${half} or a blue player at x ≤ ${half}

Situation: ${situation}

Respond with ONLY valid JSON — no markdown fences, no explanation outside the JSON:
{
  "variations": [
    {
      "label": "Safe",
      "description": "One sentence describing this tactic.",
      "formation": "X-X-X",
      "positions": {
        "red":  [[x,y], ...],
        "blue": [[x,y], ...]
      }
    },
    { "label": "Balanced", ... },
    { "label": "Aggressive", ... }
  ]
}

Each team must have exactly ${playerCount} [x,y] pairs. All values must be numbers.`
}

export default function TacticsAssistant({ format, formation, playerCount, fieldW, fieldH, onApply }) {
  const [situation, setSituation]   = useState('')
  const [loading,   setLoading]     = useState(false)
  const [variations, setVariations] = useState([])
  const [error,     setError]       = useState(null)
  const [selected,  setSelected]    = useState(null)

  async function handleGetTactics() {
    const trimmed = situation.trim()
    if (!trimmed || loading) return

    setLoading(true)
    setError(null)
    setVariations([])
    setSelected(null)

    const prompt = buildPrompt(trimmed, { format, formation, playerCount, fieldW, fieldH })

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'x-api-key': API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1024,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err?.error?.message || `API error ${res.status}`)
      }

      const data  = await res.json()
      const text  = data.content[0].text.trim()
      const parsed = JSON.parse(text)

      if (!Array.isArray(parsed.variations) || parsed.variations.length === 0) {
        throw new Error('No variations in response. Please try again.')
      }

      setVariations(parsed.variations.slice(0, 3))
    } catch (e) {
      setError(e.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  function handleApply(v, i) {
    setSelected(i)
    onApply(v)
  }

  return (
    <div className="ta-root">
      <div className="ta-input-row">
        <input
          className="ta-input"
          type="text"
          placeholder="Describe the situation (e.g. losing 1-0, 10 min left)…"
          value={situation}
          onChange={e => setSituation(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleGetTactics()}
          disabled={loading}
        />
        <button
          className={`ta-btn${loading ? ' ta-btn--loading' : ''}`}
          onClick={handleGetTactics}
          disabled={loading || !situation.trim()}
        >
          {loading ? <span className="ta-spinner" /> : 'Get Tactics'}
        </button>
      </div>

      {error && <p className="ta-error">{error}</p>}

      {variations.length > 0 && (
        <div className="ta-cards">
          {variations.map((v, i) => (
            <button
              key={v.label}
              className={`ta-card${selected === i ? ' ta-card--active' : ''}`}
              onClick={() => handleApply(v, i)}
            >
              <div className="ta-card-header">
                <span className="ta-card-label">{v.label}</span>
                <span className="ta-card-formation">{v.formation}</span>
              </div>
              <span className="ta-card-desc">{v.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
