import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import type { LayoutTile } from "../../game/board/boardLayout"
import { getDirection } from "./getDirection"

type Direction = "up" | "down" | "left" | "right"

type Props = {
  targetPosition: number
  layout: LayoutTile[]
  playerIndex?: number
}

export default function PlayerToken({
  targetPosition,
  layout,
  playerIndex = 0
}: Props) {
  const [currentPosition, setCurrentPosition] = useState(targetPosition)

  useEffect(() => {
    if (targetPosition === currentPosition) return

    const interval = setInterval(() => {
      setCurrentPosition((prev) => {
        if (prev === targetPosition) {
          clearInterval(interval)
          return prev
        }

        let diff = targetPosition - prev
        if (diff < -20) diff += 40
        if (diff > 20) diff -= 40

        const step = diff > 0 ? 1 : -1
        const nextPos = (prev + step + 40) % 40

        if (nextPos === targetPosition) {
          clearInterval(interval)
        }

        return nextPos
      })
    }, 250) // 250ms per tile for standard speed

    return () => clearInterval(interval)
  }, [targetPosition])

  const tile = layout[currentPosition] || layout[0]
  const direction = getDirection(tile)

  const angleMap: Record<Direction, number> = {
    right: 0,
    up: -90,
    left: 180,
    down: 90
  }

  // 🎨 Different colors per player
  const playerColors = [
    "radial-gradient(circle at 35% 35%, #ff5e5e 0%, #e62e2e 100%)", // Player 1 — Red
    "radial-gradient(circle at 35% 35%, #5ea1ff 0%, #2e6fe6 100%)", // Player 2 — Blue
    "radial-gradient(circle at 35% 35%, #5eff9b 0%, #2ee67a 100%)", // Player 3 — Green
    "radial-gradient(circle at 35% 35%, #ffd45e 0%, #e6b82e 100%)", // Player 4 — Yellow
  ]

  const tokenColor = playerColors[playerIndex % playerColors.length]

  // Responsive offsets using cqi-relative values
  const offsetDir = playerIndex % 2 === 0 ? -1 : 1;
  const offsetYDir = playerIndex < 2 ? -1 : 1;

  return (
    <motion.div
      layout
      animate={{
        rotate: angleMap[direction],
        x: `calc(${offsetDir} * clamp(4px, 1.2cqi, 10px))`,
        y: `calc(${offsetYDir} * clamp(4px, 1.2cqi, 10px))`
      }}
      transition={{ type: "spring", stiffness: 120, damping: 14 }}
      className="rounded-full flex items-center justify-center z-[200]"
      style={{
        gridColumn: tile.gridColumn,
        gridRow: tile.gridRow,
        placeSelf: "center",
        width: "clamp(14px, 4cqi, 30px)",
        height: "clamp(14px, 4cqi, 30px)",
        background: tokenColor,
        boxShadow: "0 6px 12px rgba(0,0,0,0.35), inset -2px -4px 8px rgba(0,0,0,0.2)",
      }}
    >
      {/* Left Eye */}
      <div className="relative mr-2 mb-7 top-[18%] left-[20%] w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center">
        <div className="w-1/2 h-1/2 bg-black rounded-full" />
      </div>

      {/* Right Eye */}
      <div className="relative ml-2 mb-7 top-[18%] right-[20%] w-[28%] h-[28%] bg-white rounded-full flex items-center justify-center">
        <div className="w-1/2 h-1/2 bg-black rounded-full" />
      </div>
    </motion.div>
  )
}
