import { Socket } from "socket.io-client";
import type { GameState } from "../hooks/useGameSocket";
import { Trophy, Home, RotateCcw } from "lucide-react";

type LeaderboardProps = {
    socket: Socket;
    gameState: GameState;
};

export default function Leaderboard({ socket, gameState }: LeaderboardProps) {
    const sortedPlayers = [...gameState.players].sort((a, b) => b.impactPoints - a.impactPoints);
    const myPlayerId = localStorage.getItem("terrapoly_id");
    const isOwner = gameState.ownerId === myPlayerId;

    const handleGoHome = () => {
        socket.emit("leave_room", { roomCode: gameState.room.roomCode, playerId: myPlayerId });
        sessionStorage.removeItem("terrapoly_roomInfo");
        window.location.reload();
    };

    const handlePlayAgain = () => {
        // Assumes backend handles play_again to reset room state and put everyone back in lobby or active
        socket.emit("play_again", { roomCode: gameState.room.roomCode });
    };

    return (
        <div className="w-full h-[100dvh] flex flex-col items-center justify-center bg-[#154c37] bg-[url('/background.png')] bg-cover bg-center font-nunito text-white p-4">
            {/* Background overlay */}
            <div className="absolute inset-0 bg-black/40 z-0 pointer-events-none" />

            <div className="bg-[#fcf8f2] text-black border-4 border-black shadow-[8px_8px_0px_#000] p-6 sm:p-10 rounded-2xl w-full max-w-2xl relative z-10 animate-[slideUp_0.5s_ease-out]">
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-yellow-400 text-black p-4 rounded-full border-4 border-black shadow-[4px_4px_0_#000]">
                    <Trophy className="w-12 h-12" />
                </div>

                <h1 className="text-4xl sm:text-5xl font-black text-center mt-6 mb-2 uppercase tracking-widest drop-shadow-sm text-green-900">
                    Game Over
                </h1>
                <p className="text-center font-bold text-gray-600 mb-8 uppercase tracking-wide text-sm">
                    Final Results for Room {gameState.room.roomCode}
                </p>

                <div className="flex flex-col gap-4 mb-8">
                    {sortedPlayers.map((player, index) => {
                        const isMe = player.id === myPlayerId;
                        const rankColors = ["bg-yellow-300", "bg-gray-300", "bg-orange-300", "bg-blue-100"];
                        const rankColor = rankColors[index] || "bg-white";

                        return (
                            <div
                                key={player.id}
                                className={`flex items-center justify-between p-4 rounded-xl border-4 border-black shadow-[4px_4px_0_#000] ${rankColor} ${isMe ? 'ring-4 ring-green-500 ring-offset-2' : ''}`}
                            >
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <div className="text-xl sm:text-2xl font-black w-6 sm:w-8 text-center opacity-80">
                                        #{index + 1}
                                    </div>
                                    <div className="font-bold text-lg sm:text-xl truncate max-w-[120px] sm:max-w-[200px]">
                                        {player.name} {isMe && "(You)"} {player.isBot && "🤖"}
                                    </div>
                                </div>
                                <div className="text-xl sm:text-2xl font-black tracking-tight text-green-900">
                                    {player.impactPoints} pts
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
                    <button
                        onClick={handleGoHome}
                        className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-red-400 text-black font-black text-lg border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide"
                    >
                        <Home className="w-6 h-6" /> Home
                    </button>
                    {isOwner ? (
                        <button
                            onClick={handlePlayAgain}
                            className="flex-1 flex items-center justify-center gap-2 px-6 py-4 bg-green-400 text-black font-black text-lg border-4 border-black rounded-xl shadow-[4px_4px_0_#000] hover:-translate-y-1 hover:shadow-[6px_6px_0_#000] active:translate-y-1 active:shadow-none transition-all uppercase tracking-wide"
                        >
                            <RotateCcw className="w-6 h-6" /> Play Again
                        </button>
                    ) : (
                        <div className="flex-1 flex items-center justify-center gap-2 px-4 py-4 bg-gray-200 text-gray-500 font-black text-sm sm:text-lg border-4 border-gray-400 rounded-xl uppercase tracking-wide text-center">
                            Waiting for host...
                        </div>
                    )}
                </div>
            </div>

            <style>{`
                @keyframes slideUp {
                    from { transform: translateY(20px); opacity: 0; }
                    to { transform: translateY(0); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
