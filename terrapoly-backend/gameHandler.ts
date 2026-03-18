import { Server, Socket } from 'socket.io';
import { PrismaClient, Room, Player, PropertyState } from '@prisma/client';
import { BOARD_DATA } from './utils/boardData';
import { getRandomHeadline, CRISES } from './utils/eventData';
import { v4 as uuidv4 } from 'uuid';

import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

// In-Memory State Manager
type TurnPhase = 'WAITING_FOR_ROLL' | 'WAITING_FOR_ACTION' | 'WAITING_FOR_PEOPLES_VOICE_CHOICE' | 'WAITING_FOR_VOTES' | 'WAITING_FOR_UN_SUMMIT_VOTES' | 'TURN_ENDING';

interface LogEntry {
    message: string;
    players?: { id: string; name: string }[];
}

interface GameState {
    room: Room;
    players: Player[];
    properties: PropertyState[];
    turnPhase: TurnPhase;
    turnTimer: ReturnType<typeof setTimeout> | null;
    ownerId: string | null;
    disconnectTimers: Map<string, ReturnType<typeof setTimeout>>;
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

export const activeRooms = new Map<string, GameState>();

const TURN_TIMEOUT_MS = 30_000; // 30 seconds
const DISCONNECT_TIMEOUT_MS = 60_000; // 60 seconds grace period

// ─── Helpers ───────────────────────────────────────────────────────────────

const addLog = (state: GameState, message: string, players?: { id: string; name: string }[]) => {
    state.logs.push({ message, players });
    if (state.logs.length > 100) state.logs.shift();
};

const broadcastState = (io: Server, roomCode: string) => {
    const state = activeRooms.get(roomCode);
    if (state) {
        io.to(roomCode).emit('state_update', {
            room: state.room,
            players: state.players,
            properties: state.properties,
            turnPhase: state.turnPhase,
            ownerId: state.ownerId,
            logs: state.logs,
        });
    }
};

/** Returns the player whose turn it currently is, or null. */
const getCurrentPlayer = (state: GameState): Player | null => {
    return state.players[state.room.currentTurnIdx] ?? null;
};

/** Clear any existing turn timer and start a fresh one. */
const resetTurnTimer = (io: Server, roomCode: string) => {
    const state = activeRooms.get(roomCode);
    if (!state) return;

    if (state.turnTimer) clearTimeout(state.turnTimer);

    state.turnTimer = setTimeout(() => {
        const s = activeRooms.get(roomCode);
        if (!s || s.room.status !== 'ACTIVE') return;

        console.log(`[Timer] Turn timeout for room ${roomCode}, auto-advancing turn.`);
        io.to(roomCode).emit('turn_timeout', { message: 'Turn skipped due to inactivity.' });
        advanceTurn(io, roomCode, s);
    }, TURN_TIMEOUT_MS);
};

/** Advance to the next turn (or trigger end-of-round logic). */
async function advanceTurn(io: Server, roomCode: string, state: GameState, skipCurrentIncrement = false) {
    if (state.turnTimer) clearTimeout(state.turnTimer);
    state.turnTimer = null;

    if (!skipCurrentIncrement) {
        state.room.currentTurnIdx++;
    }

    // End of Round Logic
    if (state.room.currentTurnIdx >= state.players.length) {
        state.room.currentTurnIdx = 0;
        await triggerEndOfRoundLogic(io, roomCode, state);
        return;
    }

    const nextPlayer = state.players[state.room.currentTurnIdx];
    if (nextPlayer && nextPlayer.impactPoints <= 0) {
        io.to(roomCode).emit('player_bankrupt', {
            playerId: nextPlayer.id,
            message: `Due to severe neglect of sustainable development goals, ${nextPlayer.name}'s organization has collapsed. They cannot act until they secure more funding.`
        });
        addLog(state, `☠️ ${nextPlayer.name} has 0 impact points and skips their turn!`, [{ id: nextPlayer.id, name: nextPlayer.name }]);

        const activeAndFunded = state.players.some(p => p.isActive && p.impactPoints > 0);
        if (!activeAndFunded) {
            io.to(roomCode).emit('game_over', { reason: 'collapse' });
            state.room.status = 'FINISHED';
            broadcastState(io, roomCode);
            return;
        }

        return advanceTurn(io, roomCode, state, false);
    }

    state.turnPhase = 'WAITING_FOR_ROLL';
    broadcastState(io, roomCode);

    // Next player Bot check
    if (nextPlayer?.isBot) {
        playBotTurn(io, roomCode);
    } else {
        resetTurnTimer(io, roomCode);
    }
}

// ─── Socket Handlers ───────────────────────────────────────────────────────

export function setupSocketHandlers(io: Server) {
    io.on('connection', (socket: Socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);

        // CREATE ROOM
        socket.on('create_room', async ({ creatorId }, callback) => {
            try {
                // Generate a random 6-character alphanumeric room code
                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

                const room = await prisma.room.create({
                    data: { roomCode },
                    include: { players: true, properties: true }
                });

                const state: GameState = {
                    room,
                    players: room.players,
                    properties: room.properties,
                    turnPhase: 'WAITING_FOR_ROLL',
                    turnTimer: null,
                    ownerId: creatorId || null,
                    disconnectTimers: new Map(),
                    logs: [{ message: "Room created. Waiting for players..." }],
                };
                activeRooms.set(roomCode, state);

                if (typeof callback === 'function') callback({ roomCode });
            } catch (error) {
                console.error("[Socket] Error creating room:", error);
                if (typeof callback === 'function') callback({ error: "Failed to generate room" });
            }
        });

        // JOIN ROOM
        socket.on('join_room', async ({ roomCode, playerName, playerId }) => {
            socket.join(roomCode);
            try {
                let state = activeRooms.get(roomCode);

                if (!state) {
                    let room = await prisma.room.findUnique({ where: { roomCode }, include: { players: true, properties: true } });
                    if (!room) {
                        socket.emit("error", { message: "Room not found. Please check the code." });
                        return; // Reject join
                    }

                    if (!activeRooms.has(roomCode)) {
                        activeRooms.set(roomCode, {
                            room,
                            players: room.players,
                            properties: room.properties,
                            turnPhase: 'WAITING_FOR_ROLL',
                            turnTimer: null,
                            ownerId: null,
                            disconnectTimers: new Map(),
                            logs: [],
                        });
                    }
                    state = activeRooms.get(roomCode)!;
                }

                const existingPlayerIndex = state.players.findIndex(p => p.id === playerId);
                if (existingPlayerIndex < 0 && state.players.length >= 4) {
                    socket.emit("error", { message: "Room is full. Maximum 4 players allowed." });
                    return; // Reject join
                }

                if (existingPlayerIndex >= 0) {
                    state.players[existingPlayerIndex].socketId = socket.id;
                    state.players[existingPlayerIndex].isActive = true;
                    // Clear disconnect timer if reconnecting
                    const dcTimer = state.disconnectTimers.get(playerId);
                    if (dcTimer) {
                        clearTimeout(dcTimer);
                        state.disconnectTimers.delete(playerId);
                        console.log(`[Socket] Player ${playerName} reconnected, disconnect timer cleared.`);
                    }
                    addLog(state, `🔌 ${playerName} reconnected.`, [{ id: playerId, name: playerName }]);
                    // Fire-and-forget update to prevent blocking
                    prisma.player.update({ where: { id: playerId }, data: { socketId: socket.id, isActive: true } }).catch(() => { });
                } else {
                    const newPlayerId = playerId || uuidv4();

                    // Double check to prevent sync pushes
                    if (!state.players.find(p => p.id === newPlayerId)) {
                        const newPlayer: Player = {
                            id: newPlayerId,
                            roomId: state.room.id,
                            socketId: socket.id,
                            name: playerName,
                            impactPoints: 200,
                            position: 0,
                            isActive: true,
                            isBot: false,
                            botPersonality: null
                        };
                        state.players.push(newPlayer);

                        try {
                            await prisma.player.upsert({
                                where: { id: newPlayer.id },
                                create: newPlayer,
                                update: { roomId: state.room.id, socketId: socket.id, isActive: true }
                            });
                        } catch (e: any) {
                            // If a parallel request just created them, ignore the unique constraint error
                            if (e.code === 'P2002') {
                                console.log(`[Socket] Concurrent player creation handled for: ${newPlayer.id}`);
                            } else {
                                console.error(`[Socket] DB Error linking player:`, e);
                            }
                            addLog(state, `👋 ${newPlayer.name} joined the room.`, [{ id: newPlayer.id, name: newPlayer.name }]);
                        }
                    }
                }

                broadcastState(io, roomCode);
            } catch (error) {
                console.error("[Socket] Error in join_room:", error);
            }
        });

        socket.on('add_bot', async ({ roomCode, botPersonality }) => {
            const state = activeRooms.get(roomCode);
            if (!state) return;

            if (state.players.length >= 4) {
                socket.emit('error', { message: 'Room is full. Maximum 4 players allowed.' });
                return;
            }

            const botPlayer: Player = {
                id: uuidv4(),
                roomId: state.room.id,
                socketId: null,
                name: `${botPersonality} Bot`,
                impactPoints: 200,
                position: 0,
                isActive: true,
                isBot: true,
                botPersonality
            };

            state.players.push(botPlayer);
            await prisma.player.create({ data: botPlayer });
            broadcastState(io, roomCode);
        });

        // START GAME (owner only)
        socket.on('start_game', async ({ roomCode, maxRounds, startingImpact }) => {
            const state = activeRooms.get(roomCode);
            if (!state) return;

            // Only the room owner can start the game
            const requester = state.players.find(p => p.socketId === socket.id);
            if (!requester || requester.id !== state.ownerId) {
                socket.emit('error', { message: 'Only the host can start the game.' });
                return;
            }

            if (state.players.length < 2) {
                socket.emit('error', { message: 'Game cannot start with a single player.' });
                return;
            }

            state.room.status = 'ACTIVE';
            state.room.maxRounds = maxRounds || 15;
            state.turnPhase = 'WAITING_FOR_ROLL';

            // Apply starting impact to all players
            const startImpact = startingImpact || 200;
            for (let i = 0; i < state.players.length; i++) {
                state.players[i].impactPoints = startImpact;
            }

            await prisma.room.update({ where: { id: state.room.id }, data: { status: 'ACTIVE', maxRounds: maxRounds || 15 } });
            await prisma.$transaction(
                state.players.map(p =>
                    prisma.player.update({
                        where: { id: p.id },
                        data: { impactPoints: startImpact }
                    })
                )
            );

            addLog(state, `🚀 The game has started! Max Rounds: ${state.room.maxRounds}. Starting Impact: ${startImpact}pts`);
            io.to(roomCode).emit('game_started');
            broadcastState(io, roomCode);

            if (state.players[state.room.currentTurnIdx]?.isBot) {
                playBotTurn(io, roomCode);
            } else {
                resetTurnTimer(io, roomCode);
            }
        });

        // ─── ROLL DICE ─── (guards: must be current player, must be WAITING_FOR_ROLL)
        socket.on('roll_dice', ({ roomCode, playerId, roll: providedRoll }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id !== playerId) {
                socket.emit('error', { message: "It's not your turn!" });
                return;
            }
            if (state.turnPhase !== 'WAITING_FOR_ROLL') {
                socket.emit('error', { message: "You've already rolled this turn." });
                return;
            }

            const roll = providedRoll || (Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2);
            currentPlayer.position = (currentPlayer.position + roll) % 40;

            // Transition phase
            state.turnPhase = 'WAITING_FOR_ACTION';
            resetTurnTimer(io, roomCode);

            addLog(state, `🎲 ${currentPlayer.name} rolled a ${roll}.`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
            io.to(roomCode).emit('player_moved', { playerId, position: currentPlayer.position, roll });

            // Auto-resolve non-actionable tiles
            const square = BOARD_DATA[currentPlayer.position];
            const property = state.properties.find(p => p.squareIndex === currentPlayer.position);
            const isActionable = square.type === 'SDG' && (!property || property.ownerId !== playerId);
            const isHeadlineTile = currentPlayer.position === 3 || currentPlayer.position === 6 || currentPlayer.position === 17 || currentPlayer.position === 22 || currentPlayer.position === 27;
            const isPeoplesVoiceTile = currentPlayer.position === 9 || currentPlayer.position === 16 || currentPlayer.position === 35;


            if (isHeadlineTile) {
                const headline = getRandomHeadline();
                currentPlayer.impactPoints += headline.impactChange;
                if (currentPlayer.impactPoints < 0) currentPlayer.impactPoints = 0;

                const logMsg = headline.type === 'positive'
                    ? `🎉 ${currentPlayer.name} made headlines: ${headline.title} (+${headline.impactChange}pts)`
                    : `📉 ${currentPlayer.name} made headlines: ${headline.title} (${headline.impactChange}pts)`;

                addLog(state, logMsg, [{ id: currentPlayer.id, name: currentPlayer.name }]);

                io.to(roomCode).emit('headline_drawn', {
                    playerId: currentPlayer.id,
                    headline
                });

                // Events don't require further action
                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
            } else if (isPeoplesVoiceTile) {
                state.turnPhase = 'WAITING_FOR_PEOPLES_VOICE_CHOICE';
                addLog(state, `🗣️ ${currentPlayer.name} landed on People's Voice. Waiting for choice...`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
                io.to(roomCode).emit('peoples_voice_drawn', { playerId: currentPlayer.id });
                resetTurnTimer(io, roomCode);
            } else if (currentPlayer.position === 10) {
                // Tipping Point (Tile 10)
                triggerCrisis(io, roomCode, state);

                // Crises don't require further action
                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
            } else if (currentPlayer.position === 20) {
                // UN Summit (Tile 20)
                const activePlayers = state.players.filter(p => p.isActive);
                state.unSummitVote = {
                    votes: {},
                    required: activePlayers.length
                };
                state.turnPhase = 'WAITING_FOR_UN_SUMMIT_VOTES';
                addLog(state, `🏛️ ${currentPlayer.name} convened the UN Summit! All players must vote for a policy.`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
                io.to(roomCode).emit('un_summit_voting');
                resetTurnTimer(io, roomCode);
            } else if (currentPlayer.position === 30) {
                // Economic Boom (Tile 30) - Largest Education Investor Check
                let maxEdInvestment = 0;

                // Track investments
                const calculateInvestment = (playerId: string) => {
                    let total = 0;
                    const playerProps = state.properties.filter(p => p.ownerId === playerId);
                    for (const prop of playerProps) {
                        const propSquare = BOARD_DATA[prop.squareIndex];
                        if (propSquare.category === 'Education') {
                            if (prop.investmentLevel === 'SEED') total += 1;
                            else if (prop.investmentLevel === 'GROWTH') total += 2;
                            else if (prop.investmentLevel === 'EXPANSION') total += 3;
                            else if (prop.investmentLevel === 'FLAGSHIP') total += 4;
                        }
                    }
                    return total;
                };

                // Find max
                for (const player of state.players) {
                    const inv = calculateInvestment(player.id);
                    if (inv > maxEdInvestment) {
                        maxEdInvestment = inv;
                    }
                }

                // Award
                const winners: Player[] = [];
                if (maxEdInvestment > 0) {
                    for (const player of state.players) {
                        if (calculateInvestment(player.id) === maxEdInvestment) {
                            winners.push(player);
                        }
                    }
                }

                if (winners.length > 0) {
                    const reward = 150;
                    for (const winner of winners) {
                        winner.impactPoints += reward;
                    }
                    const winnerNames = winners.map(w => w.name).join(' & ');
                    addLog(state, `📈 Economic Boom! Largest investor(s) in Education, ${winnerNames}, receive +${reward}pts.`, winners.map(w => ({ id: w.id, name: w.name })));
                    io.to(roomCode).emit('economic_boom_resolved', {
                        winnerIds: winners.map(w => w.id),
                        amount: reward
                    });
                } else {
                    addLog(state, `📈 Economic Boom! Sadly, no one has invested in Education yet.`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
                    io.to(roomCode).emit('economic_boom_resolved', {
                        winnerIds: [],
                        amount: 0
                    });
                }

                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
            } else if (!isActionable) {
                // No action needed — go straight to TURN_ENDING
                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
            }

            broadcastState(io, roomCode);
        });

        // ─── PEOPLE'S VOICE CHOICE ─── (guards: current player, WAITING_FOR_PEOPLES_VOICE_CHOICE)
        socket.on('peoples_voice_choice', ({ roomCode, playerId, choice }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id !== playerId) return;
            if (state.turnPhase !== 'WAITING_FOR_PEOPLES_VOICE_CHOICE') return;

            if (choice === 'praise') {
                const headline = getRandomHeadline('positive');
                currentPlayer.impactPoints += headline.impactChange;

                addLog(state, `🌟 ${currentPlayer.name} was praised by the world! ${headline.title} (+${headline.impactChange}pts)`, [{ id: currentPlayer.id, name: currentPlayer.name }]);

                io.to(roomCode).emit('peoples_voice_resolved', {
                    playerId: currentPlayer.id,
                    result: 'praise',
                    headline
                });

                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
                broadcastState(io, roomCode);
            } else if (choice === 'demand') {
                const activeOtherPlayers = state.players.filter(p => p.isActive && p.id !== currentPlayer.id);

                if (activeOtherPlayers.length === 0) {
                    addLog(state, `⚖️ ${currentPlayer.name} raised a demand, but no one is around to vote.`, [{ id: currentPlayer.id, name: currentPlayer.name }]);

                    io.to(roomCode).emit('peoples_voice_resolved', {
                        playerId: currentPlayer.id,
                        result: 'skipped_demand'
                    });

                    state.turnPhase = 'TURN_ENDING';
                    resetTurnTimer(io, roomCode);
                    broadcastState(io, roomCode);
                } else {
                    state.peoplesVoiceVote = {
                        votes: {},
                        required: activeOtherPlayers.length
                    };
                    state.turnPhase = 'WAITING_FOR_VOTES';

                    addLog(state, `🗳️ ${currentPlayer.name} raised a demand! Other players must vote for an SDG.`, [{ id: currentPlayer.id, name: currentPlayer.name }]);

                    io.to(roomCode).emit('peoples_voice_demand_voting', {
                        playerId: currentPlayer.id,
                        voters: activeOtherPlayers.map(p => p.id)
                    });

                    resetTurnTimer(io, roomCode);
                    broadcastState(io, roomCode);
                }
            }
        });

        // ─── SUBMIT PEOPLE'S VOICE VOTE ─── (guards: not current player, WAITING_FOR_VOTES)
        socket.on('submit_peoples_voice_vote', ({ roomCode, playerId, category }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id === playerId) return;
            if (state.turnPhase !== 'WAITING_FOR_VOTES' || !state.peoplesVoiceVote) return;

            if (!['Climate', 'Education', 'Health', 'Energy', 'Justice'].includes(category)) return;

            state.peoplesVoiceVote.votes[playerId] = category;

            if (Object.keys(state.peoplesVoiceVote.votes).length >= state.peoplesVoiceVote.required) {
                const counts: Record<string, number> = {};
                for (const v of Object.values(state.peoplesVoiceVote.votes)) {
                    counts[v] = (counts[v] || 0) + 1;
                }

                let maxVotes = 0;
                let winningCategory = 'Climate';
                for (const [cat, count] of Object.entries(counts)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                        winningCategory = cat;
                    }
                }

                addLog(state, `✅ Voting closed! The people demand investment in ${winningCategory}.`);

                const donationAmount = 30;
                const actualDonation = Math.min(donationAmount, currentPlayer.impactPoints);
                currentPlayer.impactPoints -= actualDonation;

                if (winningCategory === 'Climate') state.room.sdgClimate = Math.min(100, state.room.sdgClimate + 10);
                else if (winningCategory === 'Education') state.room.sdgEducation = Math.min(100, state.room.sdgEducation + 10);
                else if (winningCategory === 'Health') state.room.sdgHealth = Math.min(100, state.room.sdgHealth + 10);
                else if (winningCategory === 'Energy') state.room.sdgEnergy = Math.min(100, state.room.sdgEnergy + 10);
                else if (winningCategory === 'Justice') state.room.sdgJustice = Math.min(100, state.room.sdgJustice + 10);

                addLog(state, `📉 ${currentPlayer.name} was forced to donate ${actualDonation}pts to ${winningCategory}. SDG +10`, [{ id: currentPlayer.id, name: currentPlayer.name }]);

                io.to(roomCode).emit('peoples_voice_resolved', {
                    playerId: currentPlayer.id,
                    result: 'demand_resolved',
                    winningCategory,
                    amount: actualDonation
                });

                state.peoplesVoiceVote = undefined;
                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
            }

            broadcastState(io, roomCode);
        });

        // ─── SUBMIT UN SUMMIT VOTE ─── (guards: WAITING_FOR_UN_SUMMIT_VOTES)
        socket.on('submit_un_summit_vote', ({ roomCode, playerId, category }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer) return;
            if (state.turnPhase !== 'WAITING_FOR_UN_SUMMIT_VOTES' || !state.unSummitVote) return;

            if (!['Climate', 'Education', 'Health', 'Energy', 'Justice'].includes(category)) return;

            state.unSummitVote.votes[playerId] = category;

            if (Object.keys(state.unSummitVote.votes).length >= state.unSummitVote.required) {
                const counts: Record<string, number> = {};
                for (const v of Object.values(state.unSummitVote.votes)) {
                    counts[v] = (counts[v] || 0) + 1;
                }

                let maxVotes = 0;
                let winningCategory = 'Climate';
                for (const [cat, count] of Object.entries(counts)) {
                    if (count > maxVotes) {
                        maxVotes = count;
                        winningCategory = cat;
                    }
                }

                state.activePolicy = {
                    category: winningCategory,
                    roundsLeft: 3
                };

                addLog(state, `🏛️ UN Summit concluded! Policy enacted: 50% discount on ${winningCategory} investments for 3 rounds.`);

                io.to(roomCode).emit('un_summit_resolved', {
                    winningCategory,
                    roundsLeft: 3
                });

                state.unSummitVote = undefined;
                state.turnPhase = 'TURN_ENDING';
                resetTurnTimer(io, roomCode);
            }

            broadcastState(io, roomCode);
        });

        // ─── INVEST ─── (guards: current player, WAITING_FOR_ACTION)
        socket.on('invest', async ({ roomCode, playerId, squareIndex }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id !== playerId) return;
            if (state.turnPhase !== 'WAITING_FOR_ACTION') return;

            const category = BOARD_DATA[squareIndex]?.category;
            let cost = BOARD_DATA[squareIndex]?.cost || 0;

            // UN Summit active policy discount (50% off)
            if (state.activePolicy && state.activePolicy.category === category && state.activePolicy.roundsLeft > 0) {
                cost = Math.floor(cost * 0.5);
            }

            const playerIndex = state.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1) return;

            if (state.players[playerIndex].impactPoints >= cost) {
                state.players[playerIndex].impactPoints -= cost;

                const property: PropertyState = {
                    id: uuidv4(),
                    roomId: state.room.id,
                    squareIndex,
                    ownerId: playerId,
                    investmentLevel: 'SEED',
                    bonusReturns: 0
                };
                state.properties.push(property);
                await prisma.propertyState.upsert({
                    where: { roomId_squareIndex: { roomId: state.room.id, squareIndex } },
                    create: property,
                    update: property
                });

                // SDG contribution on buy (+5 to the matching category)
                const category = BOARD_DATA[squareIndex]?.category;
                if (category === 'Climate') state.room.sdgClimate = Math.min(100, state.room.sdgClimate + 5);
                else if (category === 'Education') state.room.sdgEducation = Math.min(100, state.room.sdgEducation + 5);
                else if (category === 'Health') state.room.sdgHealth = Math.min(100, state.room.sdgHealth + 5);
                else if (category === 'Energy') state.room.sdgEnergy = Math.min(100, state.room.sdgEnergy + 5);
                else if (category === 'Justice') state.room.sdgJustice = Math.min(100, state.room.sdgJustice + 5);

                addLog(state, `🏢 ${currentPlayer.name} invested in a ${category || ''} property. 📊 ${category} SDG +5`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
            }

            // Action taken — transition to TURN_ENDING
            state.turnPhase = 'TURN_ENDING';
            resetTurnTimer(io, roomCode);
            broadcastState(io, roomCode);
        });

        // ─── UPGRADE PROPERTY ─── (guards: current player, WAITING_FOR_ACTION, owns tile)
        socket.on('upgrade_property', async ({ roomCode, playerId, squareIndex }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id !== playerId) return;
            if (state.turnPhase !== 'WAITING_FOR_ACTION') return;

            const property = state.properties.find(p => p.squareIndex === squareIndex && p.ownerId === playerId);
            if (!property) return;

            const playerIdx = state.players.findIndex(p => p.id === playerId);
            if (playerIdx === -1) return;

            let upgradeCost = 0;
            let newLevel = '';
            let bonusIncrease = 0;
            let sdgBoost = 0;

            const category = BOARD_DATA[squareIndex]?.category;

            if (property.investmentLevel === 'SEED') {
                upgradeCost = 150;
                newLevel = 'GROWTH';
                bonusIncrease = 15; // 25 total - 10 base
                sdgBoost = 5;
            } else if (property.investmentLevel === 'GROWTH') {
                upgradeCost = 300;
                newLevel = 'EXPANSION';
                bonusIncrease = 25; // 50 total - 25 prev
                sdgBoost = 8;
            } else if (property.investmentLevel === 'EXPANSION') {
                upgradeCost = 500;
                newLevel = 'FLAGSHIP';
                bonusIncrease = 50; // 100 total - 50 prev
                sdgBoost = 12;
            } else {
                // Already at max level
                return;
            }

            // UN Summit active policy discount (50% off)
            if (state.activePolicy && state.activePolicy.category === category && state.activePolicy.roundsLeft > 0) {
                upgradeCost = Math.floor(upgradeCost * 0.5);
            }

            if (state.players[playerIdx].impactPoints < upgradeCost) return;

            state.players[playerIdx].impactPoints -= upgradeCost;
            property.investmentLevel = newLevel;
            property.bonusReturns += bonusIncrease;

            // SDG contribution on upgrade
            if (category === 'Climate') state.room.sdgClimate = Math.min(100, state.room.sdgClimate + sdgBoost);
            else if (category === 'Education') state.room.sdgEducation = Math.min(100, state.room.sdgEducation + sdgBoost);
            else if (category === 'Health') state.room.sdgHealth = Math.min(100, state.room.sdgHealth + sdgBoost);
            else if (category === 'Energy') state.room.sdgEnergy = Math.min(100, state.room.sdgEnergy + sdgBoost);
            else if (category === 'Justice') state.room.sdgJustice = Math.min(100, state.room.sdgJustice + sdgBoost);

            await prisma.propertyState.update({
                where: { roomId_squareIndex: { roomId: state.room.id, squareIndex } },
                data: { investmentLevel: newLevel, bonusReturns: property.bonusReturns }
            });

            addLog(state, `⬆️ ${currentPlayer.name} upgraded ${BOARD_DATA[squareIndex]?.category || ''} property to ${newLevel}! 📊 ${category} SDG +${sdgBoost}`, [{ id: currentPlayer.id, name: currentPlayer.name }]);

            // Action taken — transition to TURN_ENDING
            state.turnPhase = 'TURN_ENDING';
            resetTurnTimer(io, roomCode);
            broadcastState(io, roomCode);
        });

        // ─── PAY DONATION (Rent) ─── (guards: current player, WAITING_FOR_ACTION)
        socket.on('pay_donation', ({ roomCode, playerId, squareIndex }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id !== playerId) return;
            if (state.turnPhase !== 'WAITING_FOR_ACTION') return;

            const playerIdx = state.players.findIndex(p => p.id === playerId);
            if (playerIdx === -1) return;

            const property = state.properties.find(p => p.squareIndex === squareIndex);
            if (!property) return;

            const category = BOARD_DATA[squareIndex].category;

            const rentCost = 15;
            const actualRent = Math.min(rentCost, state.players[playerIdx].impactPoints);
            state.players[playerIdx].impactPoints -= actualRent;
            property.bonusReturns += 2;

            // Affect Global SDGs based on category
            if (category === 'Climate') state.room.sdgClimate += 15;
            else if (category === 'Education') state.room.sdgEducation += 15;
            else if (category === 'Health') state.room.sdgHealth += 15;
            else if (category === 'Energy') state.room.sdgEnergy += 15;
            else if (category === 'Justice') state.room.sdgJustice += 15;

            const propOwner = state.players.find(p => p.id === property.ownerId);
            const logPlayers = [{ id: currentPlayer.id, name: currentPlayer.name }];
            if (propOwner) logPlayers.push({ id: propOwner.id, name: propOwner.name });
            addLog(state, `💸 ${currentPlayer.name} paid ${actualRent}pts rent to ${propOwner?.name || 'Owner'}. 📊 ${category} SDG +15`, logPlayers);

            // Action taken — transition to TURN_ENDING
            state.turnPhase = 'TURN_ENDING';
            resetTurnTimer(io, roomCode);
            broadcastState(io, roomCode);
        });

        // ─── PASS ACTION (Apathy Tax) ─── (guards: current player, WAITING_FOR_ACTION)
        socket.on('pass_action', ({ roomCode, playerId, squareIndex }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;

            const currentPlayer = getCurrentPlayer(state);
            if (!currentPlayer || currentPlayer.id !== playerId) return;
            if (state.turnPhase !== 'WAITING_FOR_ACTION') return;

            const playerIdx = state.players.findIndex(p => p.id === playerId);
            if (playerIdx === -1) return;

            const cost = BOARD_DATA[squareIndex]?.cost || 0;
            const category = BOARD_DATA[squareIndex]?.category;

            if (cost > 0 && state.players[playerIdx].impactPoints >= cost) {
                // Apathy Tax
                const tax = 15;
                const actualTax = Math.min(tax, state.players[playerIdx].impactPoints);
                state.players[playerIdx].impactPoints -= actualTax;
                if (category === 'Climate') state.room.sdgClimate = Math.max(0, state.room.sdgClimate - 3);
                else if (category === 'Education') state.room.sdgEducation = Math.max(0, state.room.sdgEducation - 3);
                else if (category === 'Health') state.room.sdgHealth = Math.max(0, state.room.sdgHealth - 3);
                else if (category === 'Energy') state.room.sdgEnergy = Math.max(0, state.room.sdgEnergy - 3);
                else if (category === 'Justice') state.room.sdgJustice = Math.max(0, state.room.sdgJustice - 3);
                addLog(state, `🤷 ${currentPlayer.name} skipped action and paid 15pts apathy tax. 📊 ${category} SDG -3`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
            } else {
                addLog(state, `⏭️ ${currentPlayer.name} ended turn.`, [{ id: currentPlayer.id, name: currentPlayer.name }]);
            }

            // Action taken — transition to TURN_ENDING
            state.turnPhase = 'TURN_ENDING';
            resetTurnTimer(io, roomCode);
            broadcastState(io, roomCode);
        });

        // ─── END TURN ─── (guards: must be TURN_ENDING phase)
        socket.on('end_turn', async ({ roomCode }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'ACTIVE') return;
            if (state.turnPhase !== 'TURN_ENDING') return;

            await advanceTurn(io, roomCode, state);
        });

        // ─── KICK PLAYER ─── (owner only, lobby only)
        socket.on('kick_player', ({ roomCode, targetPlayerId }) => {
            const state = activeRooms.get(roomCode);
            if (!state || state.room.status !== 'WAITING') return;

            // Find the kicker — must be the room owner
            const kickerPlayer = state.players.find(p => p.socketId === socket.id);
            if (!kickerPlayer || kickerPlayer.id !== state.ownerId) {
                socket.emit('error', { message: 'Only the room owner can kick players.' });
                return;
            }

            // Can't kick yourself
            if (targetPlayerId === state.ownerId) return;

            const targetPlayer = state.players.find(p => p.id === targetPlayerId);
            if (!targetPlayer) return;

            // Remove from in-memory state
            state.players = state.players.filter(p => p.id !== targetPlayerId);

            // Notify the kicked player
            if (targetPlayer.socketId) {
                const targetSocket = io.sockets.sockets.get(targetPlayer.socketId);
                if (targetSocket) {
                    targetSocket.emit('player_kicked', { message: 'You have been removed from the room by the host.' });
                    targetSocket.leave(roomCode);
                }
            }

            addLog(state, `👢 ${targetPlayer.name} was kicked from the room.`, [{ id: targetPlayer.id, name: targetPlayer.name }]);

            // Delete from DB (fire-and-forget)
            prisma.player.delete({ where: { id: targetPlayerId } }).catch(() => { });

            console.log(`[Socket] Player ${targetPlayer.name} kicked from room ${roomCode}`);
            broadcastState(io, roomCode);
        });

        // ─── DISCONNECT ─── (mark inactive, start timeout)
        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);

            // Find which room and player this socket belonged to
            for (const [roomCode, state] of activeRooms.entries()) {
                const playerIdx = state.players.findIndex(p => p.socketId === socket.id);
                if (playerIdx === -1) continue;

                const player = state.players[playerIdx];
                player.isActive = false;
                player.socketId = null;

                // If still in lobby, just remove immediately
                if (state.room.status === 'WAITING') {
                    state.players = state.players.filter(p => p.id !== player.id);
                    prisma.player.delete({ where: { id: player.id } }).catch(() => { });
                    broadcastState(io, roomCode);
                    break;
                }

                // In-game: start disconnect countdown
                broadcastState(io, roomCode);

                const timer = setTimeout(async () => {
                    const s = activeRooms.get(roomCode);
                    if (!s) return;

                    const pIdx = s.players.findIndex(p => p.id === player.id);
                    if (pIdx === -1) return;

                    // Player didn't reconnect — remove them
                    console.log(`[Timer] Player ${player.name} disconnect timeout in room ${roomCode}. Removing.`);
                    const wasTheirTurn = s.room.currentTurnIdx === pIdx;

                    addLog(s, `🏃 ${player.name} abandoned the game.`, [{ id: player.id, name: player.name }]);

                    s.players.splice(pIdx, 1);
                    s.disconnectTimers.delete(player.id);

                    // Adjust currentTurnIdx if needed
                    if (s.players.length === 0) {
                        s.room.status = 'FINISHED';
                        io.to(roomCode).emit('game_over', { reason: 'collapse' });
                        broadcastState(io, roomCode);
                        return;
                    }

                    if (wasTheirTurn) {
                        // Fix index if removal shifted it
                        if (s.room.currentTurnIdx >= s.players.length) {
                            s.room.currentTurnIdx = 0;
                        }
                        advanceTurn(io, roomCode, s, true);
                    } else {
                        // Adjust turn index if a player before the current turn was removed
                        if (pIdx < s.room.currentTurnIdx) {
                            s.room.currentTurnIdx--;
                        }
                        broadcastState(io, roomCode);
                    }

                    io.to(roomCode).emit('player_left', { playerName: player.name });
                }, DISCONNECT_TIMEOUT_MS);

                state.disconnectTimers.set(player.id, timer);
                break;
            }
        });
    });
}

async function triggerEndOfRoundLogic(io: Server, roomCode: string, state: GameState) {
    addLog(state, `--- Round ${state.room.currentRound} Complete ---`);

    // Income Distribution
    const baseIncome = 10; // Assuming 10 per round as a base
    state.properties.forEach(prop => {
        const ownerIndex = state.players.findIndex(p => p.id === prop.ownerId);
        if (ownerIndex !== -1) {
            state.players[ownerIndex].impactPoints += (baseIncome + prop.bonusReturns);
        }
    });

    // Active Policy Decrement
    if (state.activePolicy) {
        state.activePolicy.roundsLeft--;
        if (state.activePolicy.roundsLeft <= 0) {
            addLog(state, `⚖️ The UN Summit policy on ${state.activePolicy.category} has expired.`);
            state.activePolicy = undefined;
        } else {
            addLog(state, `⚖️ UN Summit ${state.activePolicy.category} policy ends in ${state.activePolicy.roundsLeft} round(s).`);
        }
    }

    state.room.currentRound++;

    // Victory Check
    if (state.room.currentRound > state.room.maxRounds) {
        if (
            state.room.sdgClimate < 60 ||
            state.room.sdgEducation < 60 ||
            state.room.sdgHealth < 60 ||
            state.room.sdgEnergy < 60 ||
            state.room.sdgJustice < 60
        ) {
            io.to(roomCode).emit('game_over', { reason: 'collapse' });
        } else {
            // Highest impact points wins
            const winner = [...state.players].sort((a, b) => b.impactPoints - a.impactPoints)[0];
            io.to(roomCode).emit('game_over', { reason: 'victory', winnerId: winner.id });
        }
        state.room.status = 'FINISHED';
        broadcastState(io, roomCode);
        return;
    }

    // Crisis Check (Rounds 5, 10, 15)
    if (state.room.currentRound % 5 === 0) {
        triggerCrisis(io, roomCode, state);
    }

    // Full logic check done, now write all to DB
    await flushStateToDatabase(state);
    broadcastState(io, roomCode);

    await advanceTurn(io, roomCode, state, true);
}

function triggerCrisis(io: Server, roomCode: string, state: GameState) {
    const sdgs = [
        { name: 'Climate', score: state.room.sdgClimate },
        { name: 'Education', score: state.room.sdgEducation },
        { name: 'Health', score: state.room.sdgHealth },
        { name: 'Energy', score: state.room.sdgEnergy },
        { name: 'Justice', score: state.room.sdgJustice }
    ];
    // Find lowest score category strictly
    const lowestSDG = sdgs.sort((a, b) => a.score - b.score)[0];
    const crisis = CRISES[lowestSDG.name];

    if (!crisis) return; // Should never happen unless data is missing

    let affectedPlayers: { id: string, name: string }[] = [];
    const interDependentVictims: string[] = [];

    state.players.forEach(p => {
        // Base penalty applies to everyone
        let totalPenalty = Math.abs(crisis.basePenalty);

        // Check for interdependent penalty
        const hasInterdependentProps = state.properties.some(prop =>
            prop.ownerId === p.id &&
            crisis.affectedCategories.includes(BOARD_DATA[prop.squareIndex]?.category || '')
        );

        if (hasInterdependentProps) {
            totalPenalty += Math.abs(crisis.interdependentPenalty);
            interDependentVictims.push(p.id);
        }

        const actualPenalty = Math.min(totalPenalty, p.impactPoints);
        p.impactPoints -= actualPenalty;
        affectedPlayers.push({ id: p.id, name: p.name });
    });

    addLog(state, `⚠️ TIPPING POINT! ${crisis.crisisName} triggered because ${lowestSDG.name} was neglected. Everyone lost ${Math.abs(crisis.basePenalty)}pts!`, affectedPlayers);

    if (interDependentVictims.length > 0) {
        // Find names of people hit by interdependent penalty
        const victimNames = interDependentVictims.map(id => state.players.find(p => p.id === id)?.name).filter(Boolean);
        addLog(state, `🔗 INTERDEPENDENT CRISIS: ${crisis.interdependentMessage} ${victimNames.join(', ')} lost an extra ${Math.abs(crisis.interdependentPenalty)}pts!`);
    }

    io.to(roomCode).emit('crisis_triggered', {
        category: lowestSDG.name,
        crisis,
        interDependentVictims
    });
}

async function flushStateToDatabase(state: GameState) {
    await prisma.room.update({
        where: { id: state.room.id },
        data: {
            currentRound: state.room.currentRound,
            currentTurnIdx: state.room.currentTurnIdx,
            sdgClimate: state.room.sdgClimate,
            sdgEducation: state.room.sdgEducation,
            sdgHealth: state.room.sdgHealth,
            sdgEnergy: state.room.sdgEnergy,
            sdgJustice: state.room.sdgJustice,
            status: state.room.status
        }
    });

    for (const p of state.players) {
        await prisma.player.update({
            where: { id: p.id },
            data: { impactPoints: p.impactPoints, position: p.position, isActive: p.isActive }
        });
    }
}

// BOT AI LOGIC
function playBotTurn(io: Server, roomCode: string) {
    setTimeout(() => {
        const state = activeRooms.get(roomCode);
        if (!state || state.room.status !== 'ACTIVE') return;

        const bot = state.players[state.room.currentTurnIdx];
        if (!bot || !bot.isBot) return;

        // ROLL
        const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
        bot.position = (bot.position + roll) % 40;
        state.turnPhase = 'WAITING_FOR_ACTION';
        io.to(roomCode).emit('player_moved', { playerId: bot.id, position: bot.position, roll });
        broadcastState(io, roomCode);

        // DECIDE
        setTimeout(() => {
            const square = BOARD_DATA[bot.position];
            const isEventTile = bot.position === 3 || bot.position === 6 || bot.position === 9 || bot.position === 16 || bot.position === 17 || bot.position === 22 || bot.position === 27 || bot.position === 35;

            if (isEventTile) {
                const headline = getRandomHeadline();
                bot.impactPoints += headline.impactChange;
                if (bot.impactPoints < 0) bot.impactPoints = 0;

                const logMsg = headline.type === 'positive'
                    ? `🤖 🎉 ${bot.name} made headlines: ${headline.title} (+${headline.impactChange}pts)`
                    : `🤖 📉 ${bot.name} made headlines: ${headline.title} (${headline.impactChange}pts)`;

                addLog(state, logMsg, [{ id: bot.id, name: bot.name }]);

                io.to(roomCode).emit('headline_drawn', {
                    playerId: bot.id,
                    headline
                });
            } else if (bot.position === 10) {
                // Tipping Point (Tile 10)
                triggerCrisis(io, roomCode, state);
            } else if (square.type === 'SDG') {
                const property = state.properties.find(p => p.squareIndex === bot.position);

                if (property && property.ownerId !== bot.id) {
                    // Owned by someone else, pay donation
                    const playerIdx = state.players.findIndex(p => p.id === bot.id);
                    const category = square.category;

                    const rentCost = 15;
                    const actualRent = Math.min(rentCost, state.players[playerIdx].impactPoints);
                    state.players[playerIdx].impactPoints -= actualRent;
                    property.bonusReturns += 2;

                    const propOwner = state.players.find(p => p.id === property.ownerId);
                    const botRentPlayers = [{ id: bot.id, name: bot.name }];
                    if (propOwner) botRentPlayers.push({ id: propOwner.id, name: propOwner.name });
                    addLog(state, `🤖 💸 ${bot.name} forced to give up ${actualRent}pts for the world 📊 ${category} SDG +15`, botRentPlayers);

                    if (category === 'Climate') state.room.sdgClimate += 15;
                    else if (category === 'Education') state.room.sdgEducation += 15;
                    else if (category === 'Health') state.room.sdgHealth += 15;
                    else if (category === 'Energy') state.room.sdgEnergy += 15;
                    else if (category === 'Justice') state.room.sdgJustice += 15;

                } else if (!property) {
                    // Unowned, make a decision based on botPersonality
                    let buy = false;
                    const category = square.category;

                    if (bot.botPersonality === 'Eco-Warrior') {
                        let score = 100;
                        if (category === 'Climate') score = state.room.sdgClimate;
                        else if (category === 'Education') score = state.room.sdgEducation;
                        else if (category === 'Health') score = state.room.sdgHealth;
                        else if (category === 'Energy') score = state.room.sdgEnergy;
                        else if (category === 'Justice') score = state.room.sdgJustice;

                        if (score < 50 && bot.impactPoints >= square.cost) buy = true;
                    } else if (bot.botPersonality === 'Greedy') {
                        if (bot.impactPoints > (square.cost + 50)) buy = true;
                    } else {
                        // Balanced
                        if (bot.impactPoints >= square.cost) buy = true;
                    }

                    if (buy) {
                        bot.impactPoints -= square.cost;
                        state.properties.push({
                            id: uuidv4(),
                            roomId: state.room.id,
                            squareIndex: bot.position,
                            ownerId: bot.id,
                            investmentLevel: 'SEED',
                            bonusReturns: 0
                        });

                        // Bot SDG contribution on buy (+5)
                        if (category === 'Climate') state.room.sdgClimate = Math.min(100, state.room.sdgClimate + 5);
                        else if (category === 'Education') state.room.sdgEducation = Math.min(100, state.room.sdgEducation + 5);
                        else if (category === 'Health') state.room.sdgHealth = Math.min(100, state.room.sdgHealth + 5);
                        else if (category === 'Energy') state.room.sdgEnergy = Math.min(100, state.room.sdgEnergy + 5);
                        else if (category === 'Justice') state.room.sdgJustice = Math.min(100, state.room.sdgJustice + 5);

                        addLog(state, `🤖 🏢 ${bot.name} invested in a ${square.category} property. 📊 ${category} SDG +5`, [{ id: bot.id, name: bot.name }]);
                    } else {
                        // Passed, apathy tax
                        if (square.cost > 0 && bot.impactPoints >= square.cost) {
                            const tax = 15;
                            const actualTax = Math.min(tax, bot.impactPoints);
                            bot.impactPoints -= actualTax;
                            addLog(state, `🤖 🤷 ${bot.name} passed and paid ${actualTax}pts apathy tax. 📊 ${category} SDG -3`, [{ id: bot.id, name: bot.name }]);
                            if (category === 'Climate') state.room.sdgClimate = Math.max(0, state.room.sdgClimate - 3);
                            else if (category === 'Education') state.room.sdgEducation = Math.max(0, state.room.sdgEducation - 3);
                            else if (category === 'Health') state.room.sdgHealth = Math.max(0, state.room.sdgHealth - 3);
                            else if (category === 'Energy') state.room.sdgEnergy = Math.max(0, state.room.sdgEnergy - 3);
                            else if (category === 'Justice') state.room.sdgJustice = Math.max(0, state.room.sdgJustice - 3);
                        }
                    }
                }
            }

            state.turnPhase = 'TURN_ENDING';
            broadcastState(io, roomCode);

            // END 
            setTimeout(() => {
                advanceTurn(io, roomCode, state);
            }, 1500);

        }, 2000);
    }, 1000);
}
