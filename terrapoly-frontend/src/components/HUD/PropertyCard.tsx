import { Flag, Siren, Landmark, Building2, Navigation, Car, Ticket } from "lucide-react";
import type { TileData } from "../../game/data/tiles";
import { BUY_COST, UPGRADE_COST, EXPECTED_RETURN, LEVEL_LABELS } from "../../game/investRules";
import { sdgFacts } from "../../game/data/sdgFacts";

export type PropertyCardVariant = "action" | "info";

export type PropertyCardProps = {
    tileData: TileData;
    variant?: PropertyCardVariant;
    isOwned?: boolean;
    isOwnedByMe?: boolean;
    isProperty?: boolean;
    amICurrentPlayer?: boolean;
    hasRolled?: boolean;
    hasActed?: boolean;
    countdown?: number | null;
    onInvest?: () => void;
    onPayRent?: () => void;
    onPass?: () => void;
    onUpgrade?: () => void;
    investmentLevel?: string;
    synergyCount?: number;
    className?: string; // Additional classes for the container
    style?: React.CSSProperties; // Additional styles for the container
    children?: React.ReactNode; // Optional additional elements like a close button
    myImpactPoints?: number;
};

export default function PropertyCard({
    tileData,
    variant = "action",
    isOwned = false,
    isOwnedByMe = false,
    isProperty = false,
    amICurrentPlayer = false,
    hasRolled = false,
    hasActed = false,
    countdown = null,
    onInvest,
    onPayRent,
    onPass,
    onUpgrade,
    investmentLevel = "SEED",
    synergyCount = 0,
    className = "",
    style = {},
    children,
    myImpactPoints = 0
}: PropertyCardProps) {
    const getBgColor = () => {
        if (!isProperty) return "#e5e7eb";
        switch (tileData.cat) {
            case "#26B68A": return "#4ade80";
            case "#E6A70A": return "#fde047";
            case "#2B77C2": return "#93c5fd";
            case "#E4693F": return "#fb923c";
            case "#DBADCA": return "#c084fc";
            case "green": return "#4ade80"; // Fallback for old refs
            case "yellow": return "#fde047";
            case "blue": return "#93c5fd";
            case "orange": return "#fb923c";
            case "purple": return "#c084fc";
            default: return "#e5e7eb";
        }
    };

    const getCategoryName = (cat?: string) => {
        if (!cat) return "SPECIAL";
        if (cat === "#26B68A" || cat === "green") return "ENVIRONMENT";
        if (cat === "#E6A70A" || cat === "yellow") return "SOCIETY";
        if (cat === "#2B77C2" || cat === "blue") return "WELL-BEING";
        if (cat === "#E4693F" || cat === "orange") return "INFRASTRUCTURE";
        if (cat === "#DBADCA" || cat === "purple") return "GOVERNANCE";
        if (cat === "event") return "EVENT";
        if (cat === "corner") return "SPECIAL";
        return cat.toUpperCase();
    };

    const bgColor = getBgColor();
    const categoryName = getCategoryName(tileData.cat);
    const showActions = variant === "action" && amICurrentPlayer && hasRolled && !hasActed && isProperty;
    const factData = tileData.sdgno ? sdgFacts[tileData.sdgno] : null;

    return (
        <div
            className={`border-4 border-black shadow-[4px_4px_0px_#000] p-4 flex flex-col relative overflow-hidden font-nunito text-black ${className}`}
            style={{ backgroundColor: bgColor, ...style }}
        >
            {children}

            {/* CATEGORY TAG */}
            <div className="bg-black text-white text-xs font-bold px-4 py-1 rounded-full self-center uppercase tracking-widest mb-4 z-10">
                {categoryName}
            </div>

            {/* ICON / VISUAL */}
            <div className="flex-1 flex items-center justify-center z-10">
                <div className="text-black/80">
                    {tileData.type === 'start' ? <Flag size={64} /> :
                        tileData.type === 'jail' || tileData.type === 'goToJail' ? <Siren size={64} /> :
                            tileData.type === 'tax' ? <Landmark size={64} /> :
                                tileData.type === 'chance' || tileData.type === 'treasure' ? <Ticket size={64} /> :
                                    tileData.type === 'parking' ? <Car size={64} /> :
                                        tileData.type === 'airport' || tileData.type === 'utility' ? <Navigation size={64} /> :
                                            <Building2 size={64} />}
                </div>
            </div>

            {/* DETAILS */}
            <div className="text-center z-10 px-2">
                <h2 className="text-xl font-bold uppercase leading-tight mb-2">{tileData.name}</h2>
                <p className="text-xs mb-3 font-medium opacity-80 line-clamp-3">
                    {tileData.desc || "A standard tile on the board."}
                </p>

                {isProperty && (
                    <div className="flex flex-col items-center gap-1 mb-4 z-10 relative">
                        <div className="flex justify-center gap-2">
                            {tileData.sdgno && (
                                <span className="bg-white text-black rounded-full px-2 py-1 text-[10px] font-bold border-2 border-black flex items-center shadow-sm">
                                    {tileData.sdgno}
                                </span>
                            )}
                            {tileData.region && (
                                <span className="bg-white text-black rounded-full px-2 py-1 text-[10px] font-bold border-2 border-black flex items-center shadow-sm">
                                    {tileData.region}
                                </span>
                            )}
                        </div>
                        {tileData.sdgno && (
                            <div className="text-[10px] font-black uppercase tracking-widest bg-black text-white px-2 py-0.5 rounded shadow-sm mt-1">
                                {synergyCount > 0 ? `Your ${tileData.sdgno} Portfolio: ${synergyCount}` : 'Build an SDG Portfolio!'}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* PRICING */}
            {isProperty && (
                <div className="text-center mb-4 z-10">
                    <p className="text-lg font-black tracking-tight">COST: {isOwnedByMe ? (investmentLevel !== 'FLAGSHIP' ? `${UPGRADE_COST[investmentLevel]}pts` : 'MAX') : `${BUY_COST}pts`}</p>
                    <p className="text-[10px] font-bold uppercase text-black/70">
                        EARN: {EXPECTED_RETURN[isOwnedByMe ? investmentLevel : 'SEED']} pts / round
                    </p>
                    {isOwnedByMe && (
                        <p className="text-[10px] font-bold uppercase text-black/70 mt-1">
                            Level: {LEVEL_LABELS[investmentLevel] || investmentLevel}
                        </p>
                    )}
                </div>
            )}

            {/* OWNER TAG */}
            {isOwned && (variant === "action" || variant === "info") && (
                <div className="absolute top-4 left-[-30px] bg-red-500 text-white text-[10px] font-bold px-10 py-1 -rotate-45 border-y-2 border-black shadow-md z-20">
                    {isOwnedByMe ? "OWNED BY YOU" : "OWNED"}
                </div>
            )}

            {/* VARIANT SECTION */}
            {variant === "action" && (
                <div className="mt-auto z-10 flex flex-col justify-end">
                    {showActions ? (
                        <>
                            {/* Alert Notification for Available Actions */}
                            <div className="mb-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-900 p-2 text-xs font-bold shadow-md rounded-sm animate-pulse">
                                {!isOwned ? (
                                    myImpactPoints >= BUY_COST ?
                                        "Available to Buy! Invest now or Pass." :
                                        "Not enough points to buy. Press SKIP."
                                ) : isOwnedByMe ? (
                                    (investmentLevel !== 'FLAGSHIP' && myImpactPoints >= UPGRADE_COST[investmentLevel]) ?
                                        "Upgrade available! Increase your returns." :
                                        (investmentLevel !== 'FLAGSHIP' ? "Not enough points to upgrade right now." : "Property is at Max Level.")
                                ) : (
                                    "You landed on an owned property. Must donate!"
                                )}
                            </div>

                            <div className="flex gap-2 h-12">
                                {!isOwned ? (
                                    <>
                                        <button
                                            className={`flex-1 font-black text-lg border-4 border-black transition-transform shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] ${myImpactPoints >= BUY_COST ? 'bg-[#ef4444] text-white active:translate-y-1 active:border-b-0' : 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed'}`}
                                            onClick={onInvest}
                                            disabled={myImpactPoints < BUY_COST}
                                        >
                                            BUY
                                        </button>
                                        <button
                                            className="flex-1 bg-[#d1d5db] text-black font-black text-lg border-4 border-black active:translate-y-1 active:border-b-0 transition-transform shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)]"
                                            onClick={onPass}
                                        >
                                            SKIP
                                        </button>
                                    </>
                                ) : isOwnedByMe ? (
                                    investmentLevel !== 'FLAGSHIP' ? (
                                        <button
                                            className={`w-full font-black text-lg border-4 border-black transition-transform shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] ${myImpactPoints >= UPGRADE_COST[investmentLevel] ? 'bg-[#3b82f6] text-white active:translate-y-1 active:border-b-0' : 'bg-gray-400 text-gray-700 opacity-50 cursor-not-allowed'}`}
                                            onClick={onUpgrade}
                                            disabled={myImpactPoints < UPGRADE_COST[investmentLevel]}
                                        >
                                            UPGRADE ({UPGRADE_COST[investmentLevel]}pts)
                                        </button>
                                    ) : (
                                        <div className="w-full bg-emerald-500/30 flex items-center justify-center font-bold text-sm border-2 border-black/20 text-black/80 rounded">
                                            ⭐ MAX LEVEL
                                        </div>
                                    )
                                ) : (
                                    <button
                                        className="w-full bg-[#fb923c] text-white font-black text-lg border-4 border-black active:translate-y-1 active:border-b-0 transition-transform shadow-[inset_0_-4px_0_rgba(0,0,0,0.2)] animate-pulse"
                                        onClick={onPayRent}
                                    >
                                        {myImpactPoints > 0 ? `DONATE ${Math.min(15, myImpactPoints)}` : 'BANKRUPT (DONATE 0)'}
                                    </button>
                                )}
                            </div>
                        </>
                    ) : (
                        <div className="h-12 border-4 border-black/10 bg-black/5 flex items-center justify-center text-black/40 font-bold text-sm">
                            {countdown !== null ? `Auto-passing in ${countdown}s...` : "NO ACTIONS"}
                        </div>
                    )}
                </div>
            )}

            {/* INFO VARIANT - REAL WORLD FACT */}
            {variant === "info" && tileData.sdgno && factData && (
                <div className="bg-white border-4 border-black p-4 rounded-xl shadow-[4px_4px_0px_rgba(0,0,0,0.1)] text-left flex flex-col gap-2 relative overflow-hidden mt-2 z-10">
                    <div className="absolute top-0 right-0 bg-[#fef08a] px-3 py-1 font-black text-[10px] border-b-2 border-l-2 border-black tracking-widest uppercase">
                        REAL WORLD FACT
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="bg-[#3b82f6] text-white rounded-md px-2 py-0.5 text-xs font-bold border-2 border-black shadow-[2px_2px_0px_rgba(0,0,0,1)]">
                            {tileData.sdgno}
                        </span>
                        <h3 className="font-black text-sm uppercase leading-tight">{factData.title}</h3>
                    </div>
                    <p className="text-sm font-medium leading-relaxed text-black/90 mt-1">
                        {factData.fact}
                    </p>
                    {tileData.region && (
                        <div className="mt-1 pt-2 border-t border-black/10 text-xs font-bold flex items-center gap-1.5 text-black/70">
                            <span>📍</span> Region Focus: {tileData.region}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
