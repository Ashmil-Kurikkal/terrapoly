export type PropertyLevel = 1 | 2 | 3

export type OwnedProperty = {
  tileId: number
  level: PropertyLevel
}

export type Player = {
  id: number
  name: string
  position: number
  impactPoints: number
  ownedTiles: OwnedProperty[]
}