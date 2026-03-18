import type { TileData } from "../../game/data/tiles";
import PropertyCard from "./PropertyCard";

type TileActionModalProps = {
    tileData: TileData;
    isOwned: boolean;
    isOwnedByMe: boolean;
    isProperty: boolean;
    amICurrentPlayer: boolean;
    hasRolled: boolean;
    hasActed: boolean;
    countdown: number | null;
    onInvest: () => void;
    onPayRent: () => void;
    onPass: () => void;
    onUpgrade: () => void;
    investmentLevel: string;
    synergyCount: number;
    myImpactPoints: number;
};

export default function TileActionModal({
    tileData,
    isOwned,
    isOwnedByMe,
    isProperty,
    amICurrentPlayer,
    hasRolled,
    hasActed,
    countdown,
    onInvest,
    onPayRent,
    onPass,
    onUpgrade,
    investmentLevel,
    synergyCount,
    myImpactPoints,
}: TileActionModalProps) {
    const showActions = amICurrentPlayer && hasRolled && !hasActed && isProperty;

    if (!showActions && countdown === null) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center pointer-events-auto">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                style={{ animation: "fadeIn 0.2s ease-out" }}
            />

            {/* Modal Card */}
            <PropertyCard
                tileData={tileData}
                variant="action"
                isOwned={isOwned}
                isOwnedByMe={isOwnedByMe}
                isProperty={isProperty}
                amICurrentPlayer={amICurrentPlayer}
                hasRolled={hasRolled}
                hasActed={hasActed}
                countdown={countdown}
                onInvest={onInvest}
                onPayRent={onPayRent}
                onPass={onPass}
                onUpgrade={onUpgrade}
                investmentLevel={investmentLevel}
                synergyCount={synergyCount}
                myImpactPoints={myImpactPoints}
                className="w-full max-w-[420px] mx-2 mb-2 rounded-t-2xl shadow-[4px_-4px_0px_#000]"
                style={{
                    animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
                }}
            />

            {/* Keyframe animations */}
            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { transform: translateY(100%); }
                    to { transform: translateY(0); }
                }
            `}</style>
        </div>
    );
}
