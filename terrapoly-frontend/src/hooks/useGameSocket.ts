import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Dynamically target the backend using the browser's current IP address, so mobile testing on the LAN works!
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || `http://${window.location.hostname}:3001`;
const socket: Socket = io(BACKEND_URL);

export type TurnPhase = 'WAITING_FOR_ROLL' | 'WAITING_FOR_ACTION' | 'WAITING_FOR_PEOPLES_VOICE_CHOICE' | 'WAITING_FOR_VOTES' | 'WAITING_FOR_UN_SUMMIT_VOTES' | 'TURN_ENDING';

export interface LogEntry {
    message: string;
    players?: { id: string; name: string }[];
}

export interface GameState {
    room: {
        id: string;
        roomCode: string;
        status: "WAITING" | "ACTIVE" | "FINISHED";
        currentRound: number;
        maxRounds: number;
        currentTurnIdx: number;
        sdgClimate: number;
        sdgEducation: number;
        sdgHealth: number;
        sdgEnergy: number;
        sdgJustice: number;
    };
    players: {
        id: string;
        roomId: string;
        socketId: string | null;
        name: string;
        impactPoints: number;
        position: number;
        isActive: boolean;
        isBot: boolean;
        botPersonality: string | null;
    }[];
    properties: {
        id: string;
        roomId: string;
        squareIndex: number;
        ownerId: string;
        investmentLevel: string;
        bonusReturns: number;
    }[];
    turnPhase: TurnPhase;
    ownerId: string | null;
    logs: LogEntry[];
    peoplesVoiceVote?: {
        votes: Record<string, string>;
        required: number;
    };
    unSummitVote?: {
        votes: Record<string, string>;
        required: number;
    };
    activePolicy?: {
        category: string;
        roundsLeft: number;
    };
}

export const useGameSocket = () => {
    const [gameState, setGameState] = useState<GameState | null>(null);

    useEffect(() => {
        socket.on("connect", () => {
            console.log("Connected to game server");

            // Auto-rejoin if we were already in a room (e.g., after hot-reload or brief disconnect)
            const playerId = localStorage.getItem("terrapoly_id");
            const roomInfoStr = sessionStorage.getItem("terrapoly_roomInfo");

            if (playerId && roomInfoStr) {
                try {
                    const { roomCode, playerName } = JSON.parse(roomInfoStr);
                    if (roomCode && playerName) {
                        console.log(`Auto-rejoining room ${roomCode} as ${playerName}`);
                        socket.emit("join_room", { roomCode, playerName, playerId });
                    }
                } catch (e) {
                    console.error("Failed to parse roomInfo for auto-rejoin", e);
                }
            }
        });

        socket.on("state_update", (state: GameState) => {
            console.log("Master State Synced:", state);
            setGameState(state);
        });

        // Event Listeners for Game Mechanics
        socket.on("error", (err) => {
            toast.error(err.message || "An error occurred", { theme: "colored" });
        });

        socket.on("player_moved", ({ roll }) => {
            toast.info(`🎲 Someone rolled a ${roll}!`);
        });

        socket.on("crisis_triggered", ({ category }) => {
            toast.error(`⚠️ CRISIS in ${category}! A player lost 40 points for hoarding!`, { theme: "colored" });
        });

        socket.on("game_over", ({ reason }) => {
            if (reason === 'collapse') {
                toast.error("💀 GAME OVER! The SDGs collapsed!", { autoClose: false });
            } else {
                toast.success("🏆 VICTORY! You survived 15 rounds!", { autoClose: false });
            }
        });

        socket.on("turn_timeout", ({ message }) => {
            toast.warn(`⏰ ${message}`, { theme: "colored" });
        });

        socket.on("un_summit_voting", () => {
            toast.info("🏛️ The UN Summit has been convened! Time to vote.", { theme: "colored" });
        });

        socket.on("un_summit_resolved", ({ winningCategory, roundsLeft }) => {
            toast.success(`🏛️ UN Summit Policy: 50% discount on ${winningCategory} properties for ${roundsLeft} rounds!`, { theme: "colored", autoClose: 5000 });
        });

        socket.on("economic_boom_resolved", ({ amount }) => {
            if (amount > 0) {
                toast.success(`📈 Economic Boom! Largest Education investors earned +${amount}pts!`, { theme: "colored", autoClose: 5000 });
            }
        });

        socket.on("player_bankrupt", ({ message }) => {
            toast.error(`☠️ ${message}`, {
                theme: "colored",
                autoClose: 8000,
                position: "top-center"
            });
        });

        socket.on("player_kicked", ({ message }) => {
            toast.error(`🚫 ${message}`, { autoClose: false, theme: "colored" });
            sessionStorage.removeItem("terrapoly_roomInfo");
            setGameState(null);
        });

        socket.on("player_left", ({ playerName }) => {
            toast.warn(`👋 ${playerName} has left the game.`, { theme: "colored" });
        });

        return () => {
            socket.off("connect");
            socket.off("state_update");
            socket.off("error");
            socket.off("player_moved");
            socket.off("crisis_triggered");
            socket.off("game_over");
            socket.off("turn_timeout");
            socket.off("player_kicked");
            socket.off("player_left");
            socket.off("un_summit_voting");
            socket.off("un_summit_resolved");
            socket.off("economic_boom_resolved");
            socket.off("player_bankrupt");
        };
    }, []);

    return { socket, gameState };
};
