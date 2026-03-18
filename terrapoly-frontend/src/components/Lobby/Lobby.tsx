import { useState, useEffect } from "react";
import { Sparkles, Rocket, X, ArrowLeft, LogOut } from "lucide-react";
import { v4 as uuidv4 } from "uuid";
import type { GameState } from "../../hooks/useGameSocket";
import { Socket } from "socket.io-client";
import LandingHero from "../LandingHero";

type LobbyProps = {
    socket: Socket;
    gameState: GameState | null;
};

export default function Lobby({ socket, gameState }: LobbyProps) {
    const [roomCode, setRoomCode] = useState("");
    const [playerName, setPlayerName] = useState("");
    const [botPersonality, setBotPersonality] = useState<"Greedy" | "Eco-Warrior" | "Balanced">("Balanced");
    const [maxRounds, setMaxRounds] = useState(15);
    const [startingImpact, setStartingImpact] = useState(200);
    const [showForm, setShowForm] = useState(false);

    useEffect(() => {
        // Ensure the player has a local ID
        if (!localStorage.getItem("terrapoly_id")) {
            localStorage.setItem("terrapoly_id", uuidv4());
        }
    }, []);

    const handleCreate = () => {
        if (!playerName) return alert("Please enter a player name first!");
        const playerId = localStorage.getItem("terrapoly_id") as string;

        socket.emit("create_room", { creatorId: playerId }, (response: any) => {
            if (response.error) {
                alert(response.error);
                return;
            }
            setRoomCode(response.roomCode); // Update visual input box
            sessionStorage.setItem("terrapoly_roomInfo", JSON.stringify({ roomCode: response.roomCode, playerName }));
            socket.emit("join_room", { roomCode: response.roomCode, playerName, playerId });
        });
    };

    const handleJoin = () => {
        if (!roomCode || !playerName) return alert("Please enter both Name and Room Code!");
        const playerId = localStorage.getItem("terrapoly_id") as string;
        sessionStorage.setItem("terrapoly_roomInfo", JSON.stringify({ roomCode: roomCode.toUpperCase(), playerName }));
        socket.emit("join_room", { roomCode: roomCode.toUpperCase(), playerName, playerId });
    };

    const handleAddBot = () => {
        if (!gameState?.room?.roomCode) return;
        if (gameState.players.length >= 4) {
            alert("Room is full! Maximum 4 players allowed.");
            return;
        }
        socket.emit("add_bot", { roomCode: gameState.room.roomCode, botPersonality });
    };

    const handleStartGame = () => {
        if (!gameState?.room?.roomCode) return;
        if (gameState.players.length < 2) {
            alert("Game cannot start with a single player.");
            return;
        }
        socket.emit("start_game", { roomCode: gameState.room.roomCode, maxRounds, startingImpact });
    };

    const handleKickPlayer = (targetPlayerId: string) => {
        if (!gameState?.room?.roomCode) return;
        socket.emit("kick_player", { roomCode: gameState.room.roomCode, targetPlayerId });
    };

    const handleLeaveRoom = () => {
        if (!gameState?.room?.roomCode) return;
        if (window.confirm("Are you sure you want to leave the room?")) {
            const playerId = localStorage.getItem("terrapoly_id");
            socket.emit("leave_room", { roomCode: gameState.room.roomCode, playerId });
            sessionStorage.removeItem("terrapoly_roomInfo");
            window.location.reload();
        }
    };

    const myPlayerId = localStorage.getItem("terrapoly_id");
    const isOwner = gameState?.ownerId === myPlayerId;
    const inRoom = !!gameState?.room?.roomCode;

    if (!inRoom && !showForm) {
        return <LandingHero onPlay={() => setShowForm(true)} />;
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-[#93c5fd] font-nunito text-black py-10">
            <img
                src="/logo.png"
                alt="Terrapoly 2030"
                className="w-64 sm:w-80 h-auto object-contain mb-8 drop-shadow-[4px_4px_0_rgba(0,0,0,1)]"
            />

            {!inRoom ? (
                <div className="bg-[#fdfbf7] border-4 border-black shadow-[8px_8px_0px_#000] p-6 sm:p-8 rounded-lg w-11/12 max-w-[400px] flex flex-col gap-4">
                    <h2 className="text-2xl font-bold text-center">Play Game</h2>

                    <input
                        className="p-3 text-base border-[3px] border-black rounded font-inherit outline-none focus:ring-2 focus:ring-black/20"
                        placeholder="Your Player Name"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                    />

                    <button
                        className="p-3 text-base border-[3px] border-black rounded outline-none bg-[#4ade80] font-bold cursor-pointer shadow-[4px_4px_0px_#000] transition-transform duration-100 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000]"
                        onClick={handleCreate}
                    >
                        <Sparkles className="inline-block mr-2" size={20} /> Create New Room
                    </button>

                    <div className="flex items-center my-2">
                        <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
                        <span className="px-3 text-gray-500 font-bold uppercase text-sm">Room Code</span>
                        <div className="flex-grow border-t-2 border-dashed border-gray-400"></div>
                    </div>

                    <div className="flex gap-2 mb-2">
                        <input
                            className="flex-1 p-3 text-base border-[3px] border-black rounded font-inherit outline-none focus:ring-2 focus:ring-black/20 uppercase"
                            placeholder="ABCD..."
                            value={roomCode}
                            onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                        />
                        <button
                            className="px-6 p-3 text-base border-[3px] border-black rounded outline-none bg-[#fde047] font-bold cursor-pointer shadow-[4px_4px_0px_#000] transition-transform duration-100 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000]"
                            onClick={handleJoin}
                        >
                            Join
                        </button>
                    </div>

                    <button
                        className="p-3 text-base border-[3px] border-black rounded outline-none bg-white font-bold cursor-pointer shadow-[4px_4px_0px_#000] transition-transform duration-100 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] flex justify-center items-center gap-2"
                        onClick={() => setShowForm(false)}
                    >
                        <ArrowLeft size={20} /> Back to Home
                    </button>
                </div>
            ) : (
                <div className="bg-[#fdfbf7] border-4 border-black shadow-[8px_8px_0px_#000] p-6 sm:p-8 rounded-lg w-11/12 max-w-[400px] flex flex-col gap-4 relative">
                    <button
                        onClick={handleLeaveRoom}
                        className="absolute -top-4 -right-4 bg-red-500 text-white w-10 h-10 border-4 border-black rounded-full flex items-center justify-center shadow-[4px_4px_0px_#000] hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000] transition-all z-10"
                        title="Leave Room"
                    >
                        <LogOut size={16} strokeWidth={3} />
                    </button>
                    <h2 className="text-2xl font-bold">Room: {gameState?.room.roomCode}</h2>

                    <div className="mb-5">
                        <h3 className="text-lg font-bold mb-2">Players ({gameState?.players.length}/4)</h3>
                        <ul className="list-none p-0 m-0">
                            {gameState?.players.map((p) => (
                                <li key={p.id} className="p-2 border-b-2 border-black font-bold flex items-center justify-between">
                                    <span>
                                        {p.name} {p.isBot ? `(Bot: ${p.botPersonality})` : "(Player)"}
                                        {p.id === gameState?.ownerId && (
                                            <span className="ml-2 text-xs bg-black text-white px-2 py-0.5 rounded-full">HOST</span>
                                        )}
                                    </span>
                                    {isOwner && p.id !== myPlayerId && (
                                        <button
                                            className="w-7 h-7 flex items-center justify-center bg-red-500 text-white border-2 border-black rounded shadow-[2px_2px_0px_#000] hover:translate-y-[1px] hover:shadow-[1px_1px_0px_#000] transition-all"
                                            onClick={() => handleKickPlayer(p.id)}
                                            title="Kick player"
                                        >
                                            <X size={14} strokeWidth={3} />
                                        </button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    </div>

                    {isOwner && (
                        <div className="flex gap-2 mb-5">
                            <select
                                className="p-3 text-base border-[3px] border-black rounded font-inherit outline-none focus:ring-2 focus:ring-black/20"
                                value={botPersonality}
                                onChange={(e) => setBotPersonality(e.target.value as any)}
                            >
                                <option value="Balanced">Balanced Bot</option>
                                <option value="Greedy">Greedy Bot</option>
                                <option value="Eco-Warrior">Eco-Warrior Bot</option>
                            </select>
                            <button
                                className="flex-1 p-3 text-base border-[3px] border-black rounded outline-none bg-[#fde047] font-bold cursor-pointer shadow-[4px_4px_0px_#000] transition-transform duration-100 hover:translate-y-[2px] hover:translate-x-[2px] hover:shadow-[2px_2px_0px_#000]"
                                onClick={handleAddBot}
                            >
                                Add Bot
                            </button>
                        </div>
                    )}

                    {isOwner ? (
                        <div className="flex flex-col gap-2 border-[3px] border-black p-3 bg-white shadow-[4px_4px_0px_#000] rounded">
                            <label className="font-bold flex justify-between items-center text-sm">
                                Max Rounds:
                                <input
                                    type="number"
                                    className="p-1 w-16 border-2 border-black rounded text-center font-bold outline-none"
                                    value={maxRounds}
                                    onChange={(e) => setMaxRounds(Math.max(1, parseInt(e.target.value) || 15))}
                                    min="1"
                                />
                            </label>
                            <label className="font-bold flex justify-between items-center text-sm">
                                Starting Impact:
                                <input
                                    type="number"
                                    className="p-1 w-20 border-2 border-black rounded text-center font-bold outline-none"
                                    value={startingImpact}
                                    onChange={(e) => setStartingImpact(Math.max(0, parseInt(e.target.value) || 0))}
                                    min="0"
                                    step="50"
                                />
                            </label>
                            <button
                                className="p-3 mt-1 text-[20px] border-[3px] border-black rounded outline-none bg-[#ff90e8] font-bold cursor-pointer shadow-[2px_2px_0px_#000] hover:translate-y-[2px] transition-transform active:translate-y-[2px] active:shadow-none"
                                onClick={handleStartGame}
                            >
                                Start Game <Rocket className="inline-block ml-2" size={24} />
                            </button>
                        </div>
                    ) : (
                        <div className="p-3 text-center text-base border-[3px] border-black/20 rounded bg-gray-100 text-gray-500 font-bold">
                            Waiting for host to start...
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
