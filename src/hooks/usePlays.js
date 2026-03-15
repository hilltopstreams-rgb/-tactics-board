import { useState } from 'react'

const STORAGE_KEY = 'tactics-board-plays'

function load() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? [] }
  catch { return [] }
}

export function usePlays() {
  const [plays, setPlays] = useState(load)

  function savePlay(play) {
    setPlays(prev => {
      const next = [play, ...prev]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  function deletePlay(id) {
    setPlays(prev => {
      const next = prev.filter(p => p.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { plays, savePlay, deletePlay }
}
