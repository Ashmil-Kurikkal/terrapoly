import { useState, useEffect } from 'react';
import { Socket } from 'socket.io-client';
import { Landmark, Vote, CheckCircle } from 'lucide-react';
import type { GameState } from '../../hooks/useGameSocket';

type UNSummitOverlayProps = {
    socket: Socket;
    gameState: GameState;
    myPlayerId: string | null;
    onClose: () => void;
};

export default function UNSummitOverlay({ socket, gameState, myPlayerId, onClose }: UNSummitOverlayProps) {
    const [hasVoted, setHasVoted] = useState(false);
    const [result, setResult] = useState<string | null>(null);
    const [resolvedData, setResolvedData] = useState<any>(null);
    const [closeTimer, setCloseTimer] = useState<number | null>(null);

    const currentPlayer = gameState.players[gameState.room.currentTurnIdx];
    const amICurrentPlayer = currentPlayer?.id === myPlayerId;
    const amIActivePlayer = gameState.players.find(p => p.id === myPlayerId)?.isActive;

    const handleClose = () => {
        setResult(null);
        setResolvedData(null);
        setHasVoted(false);
        setCloseTimer(null);
        onClose();
    };

    useEffect(() => {
        const handleResolved = (data: any) => {
            setResult('resolved');
            setResolvedData(data);
            setCloseTimer(6);
        };

        socket.on('un_summit_resolved', handleResolved);

        let timerId: ReturnType<typeof setInterval>;
        if (closeTimer !== null && closeTimer > 0) {
            timerId = setInterval(() => {
                setCloseTimer((prev) => prev !== null ? prev - 1 : null);
            }, 1000);
        } else if (closeTimer === 0) {
            handleClose();
        }

        return () => {
            socket.off('un_summit_resolved', handleResolved);
            if (timerId) clearInterval(timerId);
        };
    }, [socket, onClose, closeTimer]);

    const isOwner = gameState.ownerId === myPlayerId;

    // Auto-vote for bots if I am the host
    useEffect(() => {
        if (gameState.turnPhase === 'WAITING_FOR_UN_SUMMIT_VOTES' && isOwner && !result) {
            const bots = gameState.players.filter(p => p.isBot); // Unlike People's Voice, ALL bots vote
            const categories = ['Climate', 'Education', 'Health', 'Energy', 'Justice'];

            const timeouts: ReturnType<typeof setTimeout>[] = [];
            bots.forEach((bot, index) => {
                const delay = 1000 + Math.random() * 2000 + (index * 500);
                const t = setTimeout(() => {
                    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
                    socket.emit('submit_un_summit_vote', {
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
    }, [gameState.turnPhase, isOwner, result, socket, gameState.room.roomCode, gameState.players]);

    const handleVote = (category: string) => {
        if (hasVoted) return;
        socket.emit('submit_un_summit_vote', {
            roomCode: gameState.room.roomCode,
            playerId: myPlayerId,
            category
        });
        setHasVoted(true);
    };

    if (gameState.turnPhase !== 'WAITING_FOR_UN_SUMMIT_VOTES' && !result) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-blue-50 max-w-2xl w-full rounded-2xl border-4 border-blue-900 shadow-[10px_10px_0_rgba(30,58,138,1)] p-6 md:p-10 relative overflow-hidden">
                {/* Header */}
                <div className="flex flex-col items-center text-center mb-8 relative z-10">
                    <div className="bg-blue-900 text-white p-3 rounded-full mb-4 shadow-lg border-2 border-blue-200">
                        <Landmark className="w-10 h-10" />
                    </div>
                    <h2 className="text-4xl md:text-5xl font-black text-blue-950 uppercase tracking-widest drop-shadow-sm">
                        UN Summit
                    </h2>
                </div>

                {/* --- STATE 1: WAITING FOR VOTES --- */}
                {gameState.turnPhase === 'WAITING_FOR_UN_SUMMIT_VOTES' && !result && (
                    <div className="flex flex-col items-center relative z-10 animate-fade-in">
                        <div className="text-center mb-6">
                            <h3 className="text-3xl font-black text-blue-800 uppercase mb-2">Policy Vote</h3>
                            <p className="text-lg text-blue-900 font-bold max-w-lg">
                                {amICurrentPlayer ? `You called the Summit!` : `${currentPlayer?.name} convened the Summit!`}
                                <br />
                                All delegates must vote for a global policy.
                                The winning category receives a <span className="text-red-600 font-black">50% discount</span> on investments & upgrades for 3 rounds!
                            </p>
                        </div>

                        {amIActivePlayer && !hasVoted && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full animate-slide-up">
                                {[
                                    { id: 'Climate', color: 'bg-emerald-500', hover: 'hover:bg-emerald-400' },
                                    { id: 'Education', color: 'bg-amber-500', hover: 'hover:bg-amber-400' },
                                    { id: 'Health', color: 'bg-indigo-500', hover: 'hover:bg-indigo-400' },
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

                        {(amIActivePlayer && hasVoted) && (
                            <div className="text-blue-700 font-bold text-xl flex items-center gap-2 mt-4">
                                <CheckCircle className="w-6 h-6" /> Vote submitted. Waiting for delegates...
                            </div>
                        )}

                        {!amIActivePlayer && (
                            <div className="text-blue-700 font-bold text-xl flex items-center gap-2 mt-4">
                                <Vote className="w-6 h-6 animate-pulse" /> Delegates are voting...
                            </div>
                        )}
                    </div>
                )}

                {/* --- STATE 2: RESOLVED RESULT --- */}
                {result === 'resolved' && (
                    <div className="flex flex-col items-center text-center relative z-10 animate-[scaleIn_0.5s_ease-out]">
                        <h3 className="text-4xl font-black text-blue-800 uppercase mb-4 drop-shadow-sm">
                            Resolution Passed
                        </h3>
                        <div className="bg-white p-6 rounded-xl border-4 border-blue-900 shadow-[6px_6px_0_#1e3a8a] max-w-md">
                            <h4 className="font-black text-2xl text-black mb-2 flex items-center justify-center gap-2">
                                <Landmark className="w-6 h-6 text-blue-500" />
                                {resolvedData?.winningCategory} Focus
                            </h4>
                            <p className="text-gray-800 font-bold text-lg mt-2 leading-relaxed">
                                Investments in <span className="uppercase text-blue-700">{resolvedData?.winningCategory}</span> are now <span className="text-red-600 font-black">50% OFF</span> for the next {resolvedData?.roundsLeft} rounds!
                            </p>
                        </div>

                        <div className="mt-8 flex flex-col items-center gap-2">
                            <button
                                onClick={handleClose}
                                className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg uppercase tracking-wide shadow-[4px_4px_0_rgba(30,58,138,1)] hover:-translate-y-1 hover:shadow-[4px_6px_0_rgba(30,58,138,1)] active:translate-y-1 active:shadow-none transition-all"
                            >
                                Acknowledge
                            </button>
                            {closeTimer !== null && (
                                <p className="text-sm font-bold text-blue-800">
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
