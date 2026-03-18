import { useState, useEffect } from "react";
import { Socket } from "socket.io-client";
import type { GameState } from "../../hooks/useGameSocket";
import { Hand, Megaphone, CheckCircle, Vote } from "lucide-react";

type PeoplesVoiceOverlayProps = {
    socket: Socket;
    gameState: GameState;
    myPlayerId: string | null;
    onClose: () => void;
};

export default function PeoplesVoiceOverlay({ socket, gameState, myPlayerId, onClose }: PeoplesVoiceOverlayProps) {
    const currentPlayer = gameState.players[gameState.room.currentTurnIdx];
    const amICurrentPlayer = currentPlayer?.id === myPlayerId;

    const [selectedCard, setSelectedCard] = useState<number | null>(null);
    const [isFlipped, setIsFlipped] = useState(false);
    const [result, setResult] = useState<'praise' | 'demand' | 'skipped_demand' | 'demand_resolved' | null>(null);
    const [resolvedData, setResolvedData] = useState<any>(null);
    const [hasVoted, setHasVoted] = useState(false);
    const [closeTimer, setCloseTimer] = useState<number | null>(null);

    const handleClose = () => {
        setResult(null);
        setResolvedData(null);
        setIsFlipped(false);
        setHasVoted(false);
        setSelectedCard(null);
        setCloseTimer(null);
        onClose();
    };

    useEffect(() => {
        const handleResolved = (data: any) => {
            setResult(data.result);
            setResolvedData(data);
            setIsFlipped(true);
            setCloseTimer(6);
        };

        socket.on('peoples_voice_resolved', handleResolved);

        let timerId: ReturnType<typeof setInterval>;
        if (closeTimer !== null && closeTimer > 0) {
            timerId = setInterval(() => {
                setCloseTimer((prev) => prev !== null ? prev - 1 : null);
            }, 1000);
        } else if (closeTimer === 0) {
            handleClose();
        }

        return () => {
            socket.off('peoples_voice_resolved', handleResolved);
            if (timerId) clearInterval(timerId);
        };
    }, [socket, onClose, closeTimer]);

    const isOwner = gameState.ownerId === myPlayerId;

    // Auto-vote for bots if I am the host
    useEffect(() => {
        if (gameState.turnPhase === 'WAITING_FOR_VOTES' && isOwner && !result) {
            const bots = gameState.players.filter(p => p.isBot && p.id !== currentPlayer?.id);
            const categories = ['Climate', 'Education', 'Health', 'Energy', 'Justice'];

            const timeouts: ReturnType<typeof setTimeout>[] = [];
            bots.forEach((bot, index) => {
                const delay = 1000 + Math.random() * 2000 + (index * 500);
                const t = setTimeout(() => {
                    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                    socket.emit('submit_peoples_voice_vote', {
                        roomCode: gameState.room.roomCode,
                        playerId: bot.id,
                        category: randomCategory
                    });
                }, delay);
                timeouts.push(t);
            });

            return () => {
                timeouts.forEach(clearTimeout);
            };
        }
    }, [gameState.turnPhase, isOwner, currentPlayer?.id, result, socket, gameState.room.roomCode, gameState.players]);

    const handleCardClick = (index: number) => {
        if (!amICurrentPlayer) return;
        if (selectedCard !== null) return;
        if (gameState.turnPhase !== 'WAITING_FOR_PEOPLES_VOICE_CHOICE') return;

        setSelectedCard(index);

        const choice = Math.random() < 0.5 ? 'praise' : 'demand';
        socket.emit('peoples_voice_choice', {
            roomCode: gameState.room.roomCode,
            playerId: myPlayerId,
            choice
        });
    };

    const handleVote = (category: string) => {
        if (amICurrentPlayer || hasVoted) return;
        socket.emit('submit_peoples_voice_vote', {
            roomCode: gameState.room.roomCode,
            playerId: myPlayerId,
            category
        });
        setHasVoted(true);
    };

    if (gameState.turnPhase !== 'WAITING_FOR_PEOPLES_VOICE_CHOICE' && gameState.turnPhase !== 'WAITING_FOR_VOTES' && !result) {
        return null; // Return null when it should be hidden
    }

    // Modal styles
    return (
        <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-amber-100 max-w-2xl w-full rounded-2xl border-4 border-amber-900 shadow-[10px_10px_0_rgba(120,53,15,1)] p-6 md:p-10 relative overflow-hidden">

                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8 relative z-10">
                    <div className="bg-amber-900 text-white p-3 rounded-full mb-4 shadow-lg border-2 border-amber-200">
                        <Megaphone className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-amber-950 uppercase tracking-widest drop-shadow-sm">
                        People's Voice
                    </h2>
                </div>

                {/* --- STATE 1: WAITING FOR CHOICE --- */}
                {gameState.turnPhase === 'WAITING_FOR_PEOPLES_VOICE_CHOICE' && !isFlipped && (
                    <div className="flex flex-col items-center relative z-10">
                        <p className="text-lg text-amber-900 font-bold mb-6 text-center">
                            {amICurrentPlayer
                                ? "The people are watching. Draw a card to reveal your fate!"
                                : `${currentPlayer?.name} is drawing a card...`}
                        </p>

                        <div className="flex gap-4 md:gap-8 justify-center">
                            {[0, 1].map((idx) => (
                                <div
                                    key={idx}
                                    onClick={() => handleCardClick(idx)}
                                    className={`
                                        w-32 h-48 md:w-40 md:h-56 bg-amber-800 rounded-xl border-4 border-amber-950 
                                        shadow-[6px_6px_0_rgba(69,26,3,1)] flex items-center justify-center cursor-pointer 
                                        transition-transform duration-300 hover:-translate-y-2 hover:shadow-[6px_10px_0_rgba(69,26,3,1)]
                                        ${selectedCard !== null && selectedCard !== idx ? 'opacity-50 grayscale' : ''}
                                        ${selectedCard === idx ? 'scale-105 border-white' : ''}
                                        ${!amICurrentPlayer ? 'pointer-events-none' : ''}
                                    `}
                                >
                                    <div className="text-amber-500 opacity-20">
                                        <Hand className="w-16 h-16 md:w-20 md:h-20" />
                                    </div>
                                    <div className="absolute inset-2 border-2 border-dashed border-amber-700/50 rounded-lg pointer-events-none" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* --- STATE 2: WAITING FOR VOTES --- */}
                {gameState.turnPhase === 'WAITING_FOR_VOTES' && !isFlipped && (
                    <div className="flex flex-col items-center relative z-10 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-3xl font-black text-red-700 uppercase mb-2">Raise a Demand!</h3>
                            {amICurrentPlayer ? (
                                <p className="text-lg text-amber-900 font-bold">
                                    The people demand action! The other players are voting on which SDG you must donate 30 points to.
                                </p>
                            ) : (
                                <p className="text-lg text-amber-900 font-bold">
                                    {currentPlayer?.name} drew "Raise a Demand"! Vote for the SDG category they must donate 30pts to:
                                </p>
                            )}
                        </div>

                        {!amICurrentPlayer && !hasVoted && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full animate-slide-up">
                                {[
                                    { id: 'Climate', color: 'bg-emerald-500', hover: 'hover:bg-emerald-400' },
                                    { id: 'Education', color: 'bg-amber-500', hover: 'hover:bg-amber-400' },
                                    { id: 'Health', color: 'bg-blue-500', hover: 'hover:bg-blue-400' },
                                    { id: 'Energy', color: 'bg-orange-500', hover: 'hover:bg-orange-400' },
                                    { id: 'Justice', color: 'bg-fuchsia-500', hover: 'hover:bg-fuchsia-400' }
                                ].map((cat) => (
                                    <button
                                        key={cat.id}
                                        onClick={() => handleVote(cat.id)}
                                        className={`px-4 py-3 rounded-xl border-4 border-black text-white font-black text-lg shadow-[4px_4px_0_#000] active:translate-y-1 active:shadow-none transition-all ${cat.color} ${cat.hover}`}
                                    >
                                        {cat.id}
                                    </button>
                                ))}
                            </div>
                        )}

                        {(!amICurrentPlayer && hasVoted) && (
                            <div className="text-amber-700 font-bold text-xl flex items-center gap-2 mt-4">
                                <CheckCircle className="w-6 h-6" /> Vote submitted. Waiting for others...
                            </div>
                        )}

                        {amICurrentPlayer && (
                            <div className="flex justify-center items-center h-32">
                                <div className="text-amber-800 animate-pulse flex flex-col items-center">
                                    <Vote className="w-12 h-12 mb-2" />
                                    <span className="font-bold">Awaiting verdict...</span>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* --- STATE 3: RESOLVED RESULT --- */}
                {isFlipped && result && (
                    <div className="flex flex-col items-center text-center relative z-10 animate-[scaleIn_0.5s_ease-out]">
                        {result === 'praise' && (
                            <>
                                <h3 className="text-4xl font-black text-emerald-600 uppercase mb-4 drop-shadow-sm">
                                    The World Praises You!
                                </h3>
                                <div className="bg-white p-6 rounded-xl border-4 border-emerald-900 shadow-[6px_6px_0_#064e3b] max-w-md">
                                    <div className="text-5xl mb-4">{resolvedData?.headline?.icon}</div>
                                    <h4 className="font-bold text-xl text-black mb-2">{resolvedData?.headline?.title}</h4>
                                    <p className="text-gray-700">{resolvedData?.headline?.description}</p>
                                    <div className="mt-4 font-black text-emerald-600 text-2xl">
                                        +{resolvedData?.headline?.impactChange} pts
                                    </div>
                                </div>
                            </>
                        )}

                        {result === 'demand_resolved' && (
                            <>
                                <h3 className="text-4xl font-black text-red-600 uppercase mb-4 drop-shadow-sm">
                                    The People Have Spoken!
                                </h3>
                                <div className="bg-white p-6 rounded-xl border-4 border-red-900 shadow-[6px_6px_0_#7f1d1d] max-w-md">
                                    <h4 className="font-black text-2xl text-black mb-2 flex items-center justify-center gap-2">
                                        <Vote className="w-6 h-6 text-amber-500" />
                                        Majority Voted: {resolvedData?.winningCategory}
                                    </h4>
                                    <p className="text-gray-800 font-medium text-lg mt-2">
                                        <span className="font-bold text-red-600">{currentPlayer?.name}</span> was forced to donate!
                                    </p>
                                    <div className="mt-4 font-black text-red-600 text-2xl">
                                        {currentPlayer?.id === myPlayerId ? `-${resolvedData?.amount} pts` : `${currentPlayer?.name} lost ${resolvedData?.amount} pts`}
                                    </div>
                                </div>
                            </>
                        )}

                        {result === 'skipped_demand' && (
                            <>
                                <h3 className="text-3xl font-black text-amber-700 uppercase mb-4 drop-shadow-sm">
                                    Demand Fizzled
                                </h3>
                                <p className="text-xl font-bold text-amber-900 bg-white p-4 rounded-xl border-4 border-amber-900 shadow-[4px_4px_0_rgba(120,53,15,1)]">
                                    A demand was raised, but no one was around to vote.
                                </p>
                            </>
                        )}

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-amber-900 text-white font-bold rounded-lg uppercase tracking-wide shadow-[4px_4px_0_rgba(69,26,3,1)] hover:-translate-y-1 hover:shadow-[4px_6px_0_rgba(69,26,3,1)] active:translate-y-1 active:shadow-none transition-all"
                            >
                                Close
                            </button>
                            {closeTimer !== null && (
                                <p className="text-sm font-bold text-amber-800">
                                    Closing in {closeTimer}s...
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
