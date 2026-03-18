import type { LayoutTile } from "../../game/board/boardLayout";
import type { TileData } from "../../game/data/tiles";

type Props = {
  tile: LayoutTile;
  data: TileData;
  ownerColor?: string;
  level?: number;
  onClick?: () => void;
};

export default function Tile({ tile, data, ownerColor, onClick }: Props) {
  const isProperty = data.type === "property";
  const isCorner = ["start", "jail", "goToJail", "parking"].includes(data.type || "");
  const isEdgeTile = !isCorner;
  const isSideTile = tile.side === "left" || tile.side === "right";

  let textRotation = "none";
  let writingMode: "horizontal-tb" | "vertical-rl" = "horizontal-tb";

  if (tile.side === "left") {
    writingMode = "vertical-rl";
    textRotation = "rotate(180deg)";
  } else if (tile.side === "right") {
    writingMode = "vertical-rl";
  }

  const containerDirection = isSideTile ? "row" : "column";
  const stripOrder = (tile.side === "top" || tile.side === "left") ? 0 : 1;
  const bodyOrder = stripOrder === 0 ? 1 : 0;
  const stripSize = "28%";

  const borderColor = "#0e1621"; // Define your border color here

  const stripColor = ownerColor || "white";

  const getTileColor = (cat?: string) => {
    switch (cat) {
      case "green": return "#4ade80";
      case "yellow": return "#fde047";
      case "blue": return "#60a5fa";
      case "orange": return "#fb923c";
      case "purple": return "#c084fc";
      case "event": return "#1f3b5b";
      case "corner": return "#1f3b5b";
      default: return "#1f3b5b";
    }
  };

  const getAlignment = () => {
    if (tile.side === "bottom") return { justifyContent: "flex-start" };
    if (tile.side === "top") return { justifyContent: "flex-end" };
    if (tile.side === "left") return { justifyContent: "flex-end" };
    if (tile.side === "right") return { justifyContent: "flex-start" };
    return { justifyContent: "center" };
  };

  if (isCorner) {
    return (
      <div
        className={onClick ? "cursor-pointer transition-all duration-200 hover:brightness-110 hover:scale-[1.02] relative hover:z-20 hover:shadow-xl" : ""}
        onClick={onClick}
        style={{
          gridColumn: tile.gridColumn,
          gridRow: tile.gridRow,
          background: data.bgImage
            ? `url(${data.bgImage}) center/cover no-repeat`
            : getTileColor(data.cat),
          width: "100%",
          height: "100%",
          boxSizing: "border-box",
          boxShadow: `inset 0 0 0 2px ${borderColor}`,
        }}
      />
    );
  }

  return (
    <div
      className={onClick ? "cursor-pointer transition-all duration-200 hover:brightness-110 hover:scale-[1.02] relative hover:z-20 hover:shadow-xl" : ""}
      onClick={onClick}
      style={{
        gridColumn: tile.gridColumn,
        gridRow: tile.gridRow,
        display: "flex",
        flexDirection: containerDirection,
        boxSizing: "border-box",
        overflow: "hidden",
        background: "#1f3b5b",
        color: "white",
        width: "100%",
        height: "100%",
        // FIX: Replaced 'border' with 'boxShadow inset' to prevent doubling
        boxShadow: `inset 0 0 0 2px ${borderColor}`,
      }}
    >
      {/* SDG STRIP */}
      {isEdgeTile && isProperty && (
        <div
          style={{
            order: stripOrder,
            width: isSideTile ? stripSize : "100%",
            height: isSideTile ? "100%" : stripSize,
            background: stripColor,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            // FIX: Using inset shadow for the internal divider too
            boxShadow: `inset 0 0 0 1px ${borderColor}`,
          }}
        />
      )}

      {/* MAIN BODY */}
      <div
        style={{
          order: bodyOrder,
          flex: 1,
          display: "flex",
          flexDirection: isSideTile ? "row" : "column",
          alignItems: "center",
          padding: isSideTile ? "0 4px" : "4px 0",
          background: (data as any).catsec || getTileColor(data.cat),
          boxShadow: `inset 0 0 0 1px ${borderColor}`,
          minHeight: 0,
          minWidth: 0,
          overflow: "hidden",
          ...getAlignment(),
        }}
      >
        {data.sdgno && (
          <div
            style={{
              writingMode: writingMode,
              transform: textRotation,
              fontSize: "clamp(6px, 1.25cqi, 10px)",
              fontFamily: "ITCKabel, sans-serif",
              color: "black",
              fontWeight: 700,
              whiteSpace: "nowrap",
              marginBottom: isSideTile ? 0 : "2px",
              marginRight: isSideTile ? "2px" : 0,
            }}
          >
            {data.sdgno}
          </div>
        )}
        <div
          style={{
            writingMode: writingMode,
            transform: textRotation,
            fontSize: "clamp(7px, 1.4cqi, 11px)",
            fontWeight: 300,
            color: data.cat === "event" || data.cat === "corner" ? "white" : "black",
            fontFamily: "ITCKabel, sans-serif",
            textAlign: "center",
            lineHeight: 1.1,
            width: "100%",
            overflow: "hidden",
          }}
        >
          {data.name}
        </div>
      </div>
    </div>
  );
}