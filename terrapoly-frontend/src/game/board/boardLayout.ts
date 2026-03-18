import { TOTAL_TILES } from "./constants";

export type LayoutTile = {
  index: number;
  gridColumn: number;
  gridRow: number;
  side: "top" | "bottom" | "left" | "right";
};

export function generateBoardLayout(): LayoutTile[] {
  const layout: LayoutTile[] = [];

  for (let i = 0; i < TOTAL_TILES; i++) {
    let gridColumn = 1;
    let gridRow = 1;
    let side: "top" | "bottom" | "left" | "right" = "bottom";

    if (i === 0) {
      gridColumn = 11;
      gridRow = 11;
      side = "bottom";
    } else if (i > 0 && i < 10) {
      gridColumn = 11 - i;
      gridRow = 11;
      side = "bottom";
    } else if (i === 10) {
      gridColumn = 1;
      gridRow = 11;
      side = "bottom";
    } else if (i > 10 && i < 20) {
      gridColumn = 1;
      gridRow = 11 - (i - 10);
      side = "left";
    } else if (i === 20) {
      gridColumn = 1;
      gridRow = 1;
      side = "top";
    } else if (i > 20 && i < 30) {
      gridColumn = 1 + (i - 20);
      gridRow = 1;
      side = "top";
    } else if (i === 30) {
      gridColumn = 11;
      gridRow = 1;
      side = "top";
    } else if (i > 30 && i < 40) {
      gridColumn = 11;
      gridRow = 1 + (i - 30);
      side = "right";
    }

    layout.push({
      index: i,
      gridColumn,
      gridRow,
      side
    });
  }

  return layout;
}