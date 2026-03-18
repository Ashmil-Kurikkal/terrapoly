import { useEffect, useRef } from "react";
import type { GameState } from "../../hooks/useGameSocket";
import { tiles } from "../../game/data/tiles";
import { renderLog } from "../../utils/renderLog";
import PropertyCard from "./PropertyCard";

type LeftSidebarProps = {
    gameState: GameState;
    myPlayerId: string | null;
    countdown: number | null;
    hasRolled: boolean;
    hasActed: boolean;
    onInvest: () => void;
    onPayRent: () => void;
    onPass: () => void;
    onUpgrade: () => void;
    investmentLevel: string;
    synergyCount: number;
};

export default function LeftSidebar({
    gameState,
    myPlayerId,
    countdown,
    hasRolled,
    hasActed,
    onInvest,
    onPayRent,
    onPass,
    onUpgrade,
    investmentLevel,
    synergyCount
}: LeftSidebarProps) {
    const currentPlayer = gameState.players[gameState.room.currentTurnIdx];
    const amICurrentPlayer = currentPlayer?.id === myPlayerId;
    const currentTileIndex = currentPlayer?.position || 0;
    const tileData = tiles[currentTileIndex];

    const propertyOwner = gameState.properties.find(p => p.squareIndex === currentTileIndex)?.ownerId;
    const isOwned = !!propertyOwner;
    const isOwnedByMe = propertyOwner === myPlayerId;
    const isProperty = tileData?.type === "property";



    const myImpactPoints = gameState.players.find(p => p.id === myPlayerId)?.impactPoints || 0;

    const logEndRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [gameState.logs]);

    return (
        <div className="w-full h-full flex flex-col gap-4 font-nunito text-black">
            {/* TILE CARD */}
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
                className="flex-[1.5]"
                myImpactPoints={myImpactPoints}
            />

            {/* LOG */}
            <div className="bg-[#e5e7eb] flex-[1] border-4 border-black shadow-[4px_4px_0px_#000] flex flex-col overflow-hidden relative">
                <div className="bg-black text-white text-xs font-black px-3 py-1 uppercase tracking-widest border-b-2 border-black flex-none">
                    Game Log
                </div>
                <div className="flex-1 overflow-y-auto p-3 text-sm flex flex-col gap-1.5" style={{ scrollbarWidth: 'thin' }}>
                    {gameState.logs?.map((log, i) => (
                        <div key={i} className="bg-white/50 px-2 py-1.5 rounded border border-black/10 shadow-sm whitespace-pre-wrap leading-snug">
                            {renderLog(log, myPlayerId, gameState.players)}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    );
}
