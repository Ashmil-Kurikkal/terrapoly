import { useState } from "react"

export function usePlayerMovement(totalTiles: number) {
  const [position, setPosition] = useState(0)
  const [moving, setMoving] = useState(false)

  const moveSteps = async (steps: number) => {
    if (moving) return
    setMoving(true)

    for (let i = 0; i < steps; i++) {
      await new Promise(r => setTimeout(r, 220))
      setPosition(prev => (prev + 1) % totalTiles)
    }

    setMoving(false)
  }

  return { position, moveSteps, moving }
}