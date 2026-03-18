import type { LayoutTile } from "../../game/board/boardLayout"

export type Direction = "up" | "down" | "left" | "right"

export function getDirection(tile: LayoutTile): Direction {
  switch (tile.side) {
    case "bottom": return "up"
    case "right":  return "left"
    case "top":    return "down"
    case "left":   return "right"
    default:       return "left"
  }
}