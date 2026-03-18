import { useState, useEffect, useRef } from "react";
import type { GameState } from "../hooks/useGameSocket";
import { Socket } from "socket.io-client";
import Board from "./Board/Board";
import LeftSidebar from "./HUD/LeftSidebar";
import RightSidebar from "./HUD/RightSidebar";
import TileActionModal from "./HUD/TileActionModal";
import HeadlineModal from "./HUD/HeadlineModal";
import CrisisModal from "./HUD/CrisisModal";
import PeoplesVoiceOverlay from "./HUD/PeoplesVoiceOverlay";
import UNSummitOverlay from "./HUD/UNSummitOverlay";

import { tiles } from "../game/data/tiles";
import { BASE_INCOME } from "../game/investRules";
import { useMediaQuery } from "../hooks/useMediaQuery";
import { Bot, ScrollText, X } from "lucide-react";
import { renderLog } from "../utils/renderLog";

type GameLayoutProps = {
    socket: Socket;
    gameState: GameState;
};

export default function GameLayout({ socket, gameState }: GameLayoutProps) {
    const myPlayerId = localStorage.getItem("terrapoly_id");
    const currentPlayerInState = gameState.players[gameState.room.currentTurnIdx];
    const amICurrentPlayer = currentPlayerInState?.id === myPlayerId;
    const currentTileIndex = currentPlayerInState?.position ?? 0;
    const currentTileData = tiles[currentTileIndex];

    // Server-driven phase replaces local hasRolled/hasLanded/hasActed
    const turnPhase = gameState.turnPhase;
    const hasRolled = turnPhase !== 'WAITING_FOR_ROLL';
    const hasActed = turnPhase === 'TURN_ENDING';

    const [countdown, setCountdown] = useState<number | null>(null);
    const [mobileScoreExpanded, setMobileScoreExpanded] = useState(false);
    const [mobileLogOpen, setMobileLogOpen] = useState(false);
    const [showIntro, setShowIntro] = useState(true);
    const [introOpacity, setIntroOpacity] = useState(1);

    // Event Modals State
    const [activeHeadline, setActiveHeadline] = useState<{ playerId: string, headline: any } | null>(null);
    const [activeCrisis, setActiveCrisis] = useState<{ category: string, crisis: any, interDependentVictims: string[] } | null>(null);

    const isMobile = useMediaQuery("(max-width: 1279px)");

    const prevTurnIdx = useRef(gameState.room.currentTurnIdx);
    const countdownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const mobileLogEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (mobileLogOpen) {
            // timeout ensures render has completed before scrolling
            setTimeout(() => {
                mobileLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, 10);
        }
    }, [gameState.logs, mobileLogOpen]);

    useEffect(() => {
        const fadeTimer = setTimeout(() => setIntroOpacity(0), 1500);
        const unmountTimer = setTimeout(() => setShowIntro(false), 2500);
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(unmountTimer);
        };
    }, []);

    // Socket Event Listeners for Modals
    useEffect(() => {
        socket.on('headline_drawn', (data) => {
            // Only show modal to the player who drew it
            if (data.playerId === myPlayerId) {
                setActiveHeadline(data);
                // Pause countdown if any
                if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
            }
        });

        socket.on('crisis_triggered', (data) => {
            setActiveCrisis(data);
            // Pause countdown if any
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        });

        return () => {
            socket.off('headline_drawn');
            socket.off('crisis_triggered');
        };
    }, [socket, myPlayerId]);

    // Reset countdown when turn changes
    useEffect(() => {
        if (gameState.room.currentTurnIdx !== prevTurnIdx.current) {
            prevTurnIdx.current = gameState.room.currentTurnIdx;
            setCountdown(null);
            if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        }
    }, [gameState.room.currentTurnIdx]);

    // Start client-side countdown when server says TURN_ENDING and it's my turn
    // ONLY if there are no active modals
    useEffect(() => {
        if (amICurrentPlayer && turnPhase === 'TURN_ENDING' && countdown === null && !activeHeadline && !activeCrisis) {
            startCountdown();
        }
    }, [turnPhase, amICurrentPlayer, activeHeadline, activeCrisis]);

    const propertyOwner = gameState.properties.find(p => p.squareIndex === currentTileIndex)?.ownerId;
    const isOwnedByMe = propertyOwner === myPlayerId;
    const isProperty = currentTileData?.type === "property";
    const isOwned = !!propertyOwner;

    const startCountdown = () => {
        if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
        setCountdown(5);
        countdownTimerRef.current = setInterval(() => {
            setCountdown((prev) => {
                if (prev === null) return null;
                if (prev <= 1) {
                    clearInterval(countdownTimerRef.current as ReturnType<typeof setTimeout>);
                    socket.emit("end_turn", { roomCode: gameState.room.roomCode });
                    return null;
                }
                return prev - 1;
            });
        }, 1000);
    };

    const handleInvest = () => {
        if (hasActed) return;
        socket.emit("invest", { roomCode: gameState.room.roomCode, playerId: myPlayerId, squareIndex: currentTileIndex });
    };

    const handlePayRent = () => {
        if (hasActed) return;
        socket.emit("pay_donation", { roomCode: gameState.room.roomCode, playerId: myPlayerId, squareIndex: currentTileIndex });
    };

    const handlePass = () => {
        if (hasActed) return;
        socket.emit("pass_action", { roomCode: gameState.room.roomCode, playerId: myPlayerId, squareIndex: currentTileIndex });
    };

    const handleUpgrade = () => {
        if (hasActed) return;
        socket.emit("upgrade_property", { roomCode: gameState.room.roomCode, playerId: myPlayerId, squareIndex: currentTileIndex });
    };

    // player info for mobile HUD
    const baseColors = ["#ff5e5e", "#5ea1ff", "#5eff9b", "#ffd45e"];
    const baseColorNames = ["Red", "Blue", "Green", "Yellow"];
    const myPlayer = gameState.players.find(p => p.id === myPlayerId);
    const myPlayerIdx = gameState.players.findIndex(p => p.id === myPlayerId);
    const myPlayerColor = baseColors[myPlayerIdx % baseColors.length];
    const myPlayerColorName = baseColorNames[myPlayerIdx % baseColorNames.length];

    const currentPropertyData = gameState.properties.find(p => p.squareIndex === currentTileIndex);
    const currentInvestmentLevel = currentPropertyData?.investmentLevel || 'SEED';

    const synergyCount = currentTileData?.sdgno
        ? gameState.properties.filter(p => p.ownerId === myPlayerId && tiles[p.squareIndex]?.sdgno === currentTileData.sdgno).length
        : 0;

    const showMobileModal = isMobile && amICurrentPlayer && hasRolled && !hasActed && isProperty;
    const showMobileCountdown = isMobile && countdown !== null && !showMobileModal;

    return (
        <div className="w-full h-[100dvh] overflow-hidden flex flex-col xl:flex-row justify-center xl:justify-between items-center bg-[#154c37] bg-[url('/background.png')] bg-cover bg-center bg-no-repeat relative">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

            {/* INTRO FULL SCREEN */}
            {showIntro && (
                <div
                    className="fixed inset-0 z-[99999] flex flex-col justify-center items-center pointer-events-none"
                    style={{ backgroundColor: myPlayerColor, opacity: introOpacity, transition: "opacity 1s ease-in-out" }}
                >
                    <h1 className="text-white text-5xl sm:text-7xl md:text-8xl font-black drop-shadow-[6px_6px_0_rgba(0,0,0,1)] tracking-widest uppercase mb-8 sm:mb-10 text-center px-4 leading-[1.1]">
                        You are
                    </h1>
                    <div className="bg-white px-10 py-5 sm:px-16 sm:py-8 rounded-2xl border-[5px] sm:border-[8px] border-black shadow-[10px_10px_0_rgba(0,0,0,1)] sm:shadow-[16px_16px_0_rgba(0,0,0,1)] transform -rotate-3">
                        <span className="text-5xl sm:text-7xl md:text-9xl font-black" style={{ color: myPlayerColor }}>
                            {myPlayerColorName}
                        </span>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* MOBILE TOP HUD — World Score compact bar        */}
            {/* ═══════════════════════════════════════════════ */}
            {isMobile && (
                <div className="flex-none w-full z-20 px-2 pt-2">
                    <div className="bg-[#fcf8f2] border-3 border-black shadow-[3px_3px_0px_#000] px-3 py-2 flex items-center gap-3 rounded-lg">
                        <div className="flex-none">
                            <h2 className="text-xs font-bold text-black uppercase tracking-wide leading-none">World Score</h2>
                            <div className="text-[10px] font-bold text-gray-600">Round {gameState.room.currentRound}/15</div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-end gap-1 h-10">
                                {[
                                    { label: "C", value: gameState.room.sdgClimate, color: "#26B68A" },
                                    { label: "Ed", value: gameState.room.sdgEducation, color: "#E6A70A" },
                                    { label: "H", value: gameState.room.sdgHealth, color: "#2B77C2" },
                                    { label: "En", value: gameState.room.sdgEnergy, color: "#E4693F" },
                                    { label: "J", value: gameState.room.sdgJustice, color: "#DBADCA" },
                                ].map((b) => (
                                    <div key={b.label} className="flex flex-col items-center h-full w-full justify-end">
                                        <div className="text-[8px] font-bold leading-none mb-0.5">{b.value}</div>
                                        <div className="w-4 bg-[#eee] border border-black rounded overflow-hidden h-full flex items-end">
                                            <div
                                                className="w-full transition-[height] duration-300"
                                                style={{ height: `${b.value}%`, background: b.color }}
                                            />
                                        </div>
                                        <div className="text-[7px] font-bold leading-none mt-0.5 opacity-70">{b.label}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {/* Current turn indicator */}
                        <div className="flex-none text-right flex items-center gap-2">
                            <div>
                                <div className="text-[9px] font-bold text-gray-500 uppercase">Turn</div>
                                <div
                                    className="text-xs font-black truncate max-w-[60px]"
                                    style={{ color: baseColors[gameState.room.currentTurnIdx % baseColors.length] }}
                                >
                                    {currentPlayerInState?.id === myPlayerId ? 'You' : currentPlayerInState?.name}
                                </div>
                            </div>
                            <button
                                onClick={() => setMobileLogOpen(true)}
                                className="bg-black text-white p-1.5 rounded-md border-2 border-black active:translate-y-0.5 ml-1"
                            >
                                <ScrollText className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* LEFT SIDEBAR — Desktop only                     */}
            {/* ═══════════════════════════════════════════════ */}
            {!isMobile && (
                <div className="flex-none xl:h-full z-10 w-[320px] p-4 xl:overflow-y-auto">
                    <LeftSidebar
                        gameState={gameState}
                        myPlayerId={myPlayerId}
                        countdown={countdown}
                        hasRolled={hasRolled}
                        hasActed={hasActed}
                        onInvest={handleInvest}
                        onPayRent={handlePayRent}
                        onPass={handlePass}
                        onUpgrade={handleUpgrade}
                        investmentLevel={currentInvestmentLevel}
                        synergyCount={synergyCount}
                    />
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* CENTRAL BOARD AREA                              */}
            {/* ═══════════════════════════════════════════════ */}
            <div
                className={`flex-1 flex justify-center items-center z-10 min-w-0 min-h-0 relative ${isMobile
                    ? "w-full p-1 overflow-hidden"
                    : "max-w-none h-[95vh] p-4 py-6"
                    }`}
                style={isMobile ? { maxHeight: "calc(100dvh - 120px)" } : {}}
            >
                <Board
                    socket={socket}
                    gameState={gameState}
                />
            </div>

            {/* ═══════════════════════════════════════════════ */}
            {/* RIGHT SIDEBAR — Desktop only                    */}
            {/* ═══════════════════════════════════════════════ */}
            {!isMobile && (
                <div className="flex-none xl:h-full z-10 w-[320px] p-4 xl:overflow-y-auto">
                    <RightSidebar gameState={gameState} socket={socket} />
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* MOBILE BOTTOM HUD — Player Score strip          */}
            {/* ═══════════════════════════════════════════════ */}
            {isMobile && (
                <div className="flex-none w-full z-20 px-2 pb-2">
                    <div
                        className="border-3 border-black shadow-[3px_-3px_0px_#000] px-3 py-2 rounded-lg cursor-pointer transition-all duration-200"
                        style={{ backgroundColor: myPlayerColor }}
                        onClick={() => setMobileScoreExpanded(!mobileScoreExpanded)}
                    >
                        {/* Collapsed: compact one-line strip */}
                        <div className="flex justify-between items-center text-black font-black">
                            <span className="flex items-center gap-1 truncate text-sm">
                                {myPlayer?.id === myPlayerId ? 'You' : myPlayer?.name}
                                {myPlayer?.isBot && <Bot className="w-3 h-3" />}
                            </span>
                            <span className="text-sm whitespace-nowrap">{myPlayer?.impactPoints} pts</span>
                            <span className="text-[10px] ml-2 opacity-60">{mobileScoreExpanded ? "▼" : "▲"}</span>
                        </div>

                        {/* Expanded: full score details */}
                        {mobileScoreExpanded && (
                            <div className="mt-2 flex flex-col gap-1 text-sm font-bold text-black/90"
                                style={{ animation: "slideUp 0.2s ease-out" }}
                            >
                                <div className="flex justify-between items-center bg-white/30 px-3 py-1.5 rounded border border-black/10">
                                    <span className="opacity-80 text-xs">Impact Points</span>
                                    <span className="font-black">{myPlayer?.impactPoints}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/40 px-3 py-1.5 rounded border border-black/10">
                                    <span className="opacity-80 text-xs">Return Rate</span>
                                    <span className="font-black text-green-900">
                                        +{gameState.properties.filter(p => p.ownerId === myPlayerId).reduce((acc, p) => acc + BASE_INCOME + p.bonusReturns, 0)} pts/round
                                    </span>
                                </div>
                                {/* Other players */}
                                <div className="mt-1 flex gap-1 flex-wrap">
                                    {gameState.players.filter(p => p.id !== myPlayerId).map((player) => {
                                        const idx = gameState.players.findIndex(p => p.id === player.id);
                                        return (
                                            <div
                                                key={player.id}
                                                className="flex items-center gap-1 bg-black/10 px-2 py-1 rounded text-[10px] font-bold"
                                            >
                                                <div
                                                    className="w-2 h-2 rounded-full"
                                                    style={{ backgroundColor: baseColors[idx % baseColors.length] }}
                                                />
                                                <span className="truncate max-w-[60px]">{player.name}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* MOBILE TILE ACTION MODAL                        */}
            {/* ═══════════════════════════════════════════════ */}
            {showMobileModal && (
                <TileActionModal
                    tileData={currentTileData}
                    isOwned={isOwned}
                    isOwnedByMe={isOwnedByMe}
                    isProperty={isProperty}
                    amICurrentPlayer={amICurrentPlayer}
                    hasRolled={hasRolled}
                    hasActed={hasActed}
                    countdown={countdown}
                    onInvest={handleInvest}
                    onPayRent={handlePayRent}
                    onPass={handlePass}
                    onUpgrade={handleUpgrade}
                    investmentLevel={currentInvestmentLevel}
                    synergyCount={synergyCount}
                    myImpactPoints={myPlayer?.impactPoints || 0}
                />
            )}

            {/* Mobile countdown overlay (when no modal actions but countdown active) */}
            {showMobileCountdown && (
                <div className="fixed bottom-16 left-1/2 -translate-x-1/2 z-[9998] bg-black/80 text-white font-bold text-sm px-4 py-2 rounded-full border-2 border-white/20 backdrop-blur-md">
                    Auto-passing in {countdown}s...
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* MOBILE LOG SIDEBAR                              */}
            {/* ═══════════════════════════════════════════════ */}
            {isMobile && mobileLogOpen && (
                <div className="fixed inset-0 z-[9999] flex outline-none">
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setMobileLogOpen(false)} />
                    <div className="relative w-[300px] max-w-[85vw] h-full bg-[#e5e7eb] border-r-4 border-black flex flex-col shadow-[4px_0_0_#000] z-10"
                        style={{ transform: "translateX(0)", transition: "transform 0.3s ease-in-out" }}>
                        <div className="bg-black text-white flex justify-between items-center px-4 py-3 border-b-4 border-black flex-none">
                            <span className="text-sm font-black uppercase tracking-widest">Game Log</span>
                            <button onClick={() => setMobileLogOpen(false)} className="text-white hover:scale-110 active:scale-95 transition-transform bg-white/20 rounded-full p-1 border-2 border-transparent">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 text-sm flex flex-col gap-1.5 bg-[#154c37] bg-[url('/background.png')] bg-cover" style={{ scrollbarWidth: 'thin' }}>
                            {gameState.logs?.map((log, i) => (
                                <div key={i} className="bg-[#fcf8f2] px-3 py-2 rounded border-2 border-black shadow-[2px_2px_0_rgba(0,0,0,1)] whitespace-pre-wrap leading-snug font-bold text-black border-l-4 border-l-orange-500">
                                    {renderLog(log, myPlayerId, gameState.players)}
                                </div>
                            ))}
                            <div ref={mobileLogEndRef} className="h-4 flex-none" />
                        </div>
                    </div>
                </div>
            )}

            {/* ═══════════════════════════════════════════════ */}
            {/* EVENT MODALS (Desktop & Mobile)                 */}
            {/* ═══════════════════════════════════════════════ */}
            <PeoplesVoiceOverlay
                socket={socket}
                gameState={gameState}
                myPlayerId={myPlayerId}
                onClose={() => {
                    // Closed PeoplesVoiceOverlay
                }}
            />

            <UNSummitOverlay
                socket={socket}
                gameState={gameState}
                myPlayerId={myPlayerId}
                onClose={() => {
                    // Closed UNSummitOverlay
                }}
            />

            {activeHeadline && activeHeadline.playerId === myPlayerId && (
                <HeadlineModal
                    headline={activeHeadline.headline}
                    onClose={() => {
                        setActiveHeadline(null);
                        // Resume countdown logic via useEffect
                    }}
                />
            )}

            {activeCrisis && (
                <CrisisModal
                    category={activeCrisis.category}
                    crisis={activeCrisis.crisis}
                    interDependentVictims={activeCrisis.interDependentVictims || []}
                    myPlayerId={myPlayerId || ''}
                    players={gameState.players}
                    onClose={() => {
                        setActiveCrisis(null);
                        // Resume countdown logic via useEffect
                    }}
                />
            )}
        </div>
    );
}
