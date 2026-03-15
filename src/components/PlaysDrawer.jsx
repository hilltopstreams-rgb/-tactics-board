import { useEffect } from 'react'

export default function PlaysDrawer({ plays, open, onClose, onLoad, onDelete }) {
  // Close on Escape
  useEffect(() => {
    if (!open) return
    function onKey(e) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  return (
    <>
      <div
        className={`pl-backdrop${open ? ' pl-backdrop--visible' : ''}`}
        onClick={onClose}
      />

      <div className={`pl-drawer${open ? ' pl-drawer--open' : ''}`} role="dialog" aria-modal="true">
        <div className="pl-drawer-header">
          <span className="pl-drawer-title">My Plays</span>
          <button className="pl-close-btn" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="pl-list">
          {plays.length === 0 ? (
            <p className="pl-empty">No plays saved yet.<br />Arrange players and hit Save Play.</p>
          ) : (
            plays.map(play => (
              <div key={play.id} className="pl-item">
                <button
                  className="pl-item-load"
                  onClick={() => { onLoad(play); onClose() }}
                >
                  <span className="pl-item-name">{play.name}</span>
                  <span className="pl-item-meta">{play.format} · {play.formation}</span>
                </button>
                <button
                  className="pl-item-delete"
                  onClick={() => onDelete(play.id)}
                  aria-label={`Delete ${play.name}`}
                >
                  🗑
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </>
  )
}
