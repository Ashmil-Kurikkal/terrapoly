"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.activeRooms = void 0;
exports.setupSocketHandlers = setupSocketHandlers;
const client_1 = require("@prisma/client");
const boardData_1 = require("./utils/boardData");
const uuid_1 = require("uuid");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const prisma = new client_1.PrismaClient();
exports.activeRooms = new Map();
const broadcastState = (io, roomCode) => {
    const state = exports.activeRooms.get(roomCode);
    if (state)
        io.to(roomCode).emit('state_update', state);
};
function setupSocketHandlers(io) {
    io.on('connection', (socket) => {
        console.log(`[Socket] Connected: ${socket.id}`);
        // CREATE ROOM
        socket.on('create_room', async (callback) => {
            try {
                // Generate a random 6-character alphanumeric room code
                const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                const room = await prisma.room.create({
                    data: { roomCode },
                    include: { players: true, properties: true }
                });
                const state = { room, players: room.players, properties: room.properties };
                exports.activeRooms.set(roomCode, state);
                if (typeof callback === 'function')
                    callback({ roomCode });
            }
            catch (error) {
                console.error("[Socket] Error creating room:", error);
                if (typeof callback === 'function')
                    callback({ error: "Failed to generate room" });
            }
        });
        // JOIN ROOM
        socket.on('join_room', async ({ roomCode, playerName, playerId }) => {
            socket.join(roomCode);
            try {
                let state = exports.activeRooms.get(roomCode);
                if (!state) {
                    let room = await prisma.room.findUnique({ where: { roomCode }, include: { players: true, properties: true } });
                    if (!room) {
                        socket.emit("error", { message: "Room not found. Please check the code." });
                        return; // Reject join
                    }
                    if (!exports.activeRooms.has(roomCode)) {
                        exports.activeRooms.set(roomCode, { room, players: room.players, properties: room.properties });
                    }
                    state = exports.activeRooms.get(roomCode);
                }
                const existingPlayerIndex = state.players.findIndex(p => p.id === playerId);
                if (existingPlayerIndex >= 0) {
                    state.players[existingPlayerIndex].socketId = socket.id;
                    state.players[existingPlayerIndex].isActive = true;
                    // Fire-and-forget update to prevent blocking
                    prisma.player.update({ where: { id: playerId }, data: { socketId: socket.id, isActive: true } }).catch(() => { });
                }
                else {
                    const newPlayerId = playerId || (0, uuid_1.v4)();
                    // Double check to prevent sync pushes
                    if (!state.players.find(p => p.id === newPlayerId)) {
                        const newPlayer = {
                            id: newPlayerId,
                            roomId: state.room.id,
                            socketId: socket.id,
                            name: playerName,
                            impactPoints: 1000,
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
                        }
                        catch (e) {
                            // If a parallel request just created them, ignore the unique constraint error
                            if (e.code === 'P2002') {
                                console.log(`[Socket] Concurrent player creation handled for: ${newPlayer.id}`);
                            }
                            else {
                                console.error(`[Socket] DB Error linking player:`, e);
                            }
                        }
                    }
                }
                broadcastState(io, roomCode);
            }
            catch (error) {
                console.error("[Socket] Error in join_room:", error);
            }
        });
        // ADD BOT
        socket.on('add_bot', async ({ roomCode, botPersonality }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            const botPlayer = {
                id: (0, uuid_1.v4)(),
                roomId: state.room.id,
                socketId: null,
                name: `${botPersonality} Bot`,
                impactPoints: 1000,
                position: 0,
                isActive: true,
                isBot: true,
                botPersonality
            };
            state.players.push(botPlayer);
            await prisma.player.create({ data: botPlayer });
            broadcastState(io, roomCode);
        });
        // START GAME
        socket.on('start_game', async ({ roomCode }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            state.room.status = 'ACTIVE';
            await prisma.room.update({ where: { id: state.room.id }, data: { status: 'ACTIVE' } });
            io.to(roomCode).emit('game_started');
            broadcastState(io, roomCode);
            if (state.players[state.room.currentTurnIdx]?.isBot) {
                playBotTurn(io, roomCode);
            }
        });
        // ROLL DICE
        socket.on('roll_dice', ({ roomCode, playerId }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            const player = state.players.find(p => p.id === playerId);
            if (!player)
                return;
            const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
            player.position = (player.position + roll) % 40;
            io.to(roomCode).emit('player_moved', { playerId, position: player.position, roll });
            broadcastState(io, roomCode);
        });
        // INVEST
        socket.on('invest', async ({ roomCode, playerId, squareIndex }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            const playerIndex = state.players.findIndex(p => p.id === playerId);
            if (playerIndex === -1)
                return;
            const cost = boardData_1.BOARD_DATA[squareIndex]?.cost || 0;
            if (state.players[playerIndex].impactPoints >= cost) {
                state.players[playerIndex].impactPoints -= cost;
                const property = {
                    id: (0, uuid_1.v4)(),
                    roomId: state.room.id,
                    squareIndex,
                    ownerId: playerId,
                    investmentLevel: 'SEED',
                    bonusReturns: 0
                };
                state.properties.push(property);
                // Note: Full async DB flush would be run at the end of round, but keeping in sync here for safety
                await prisma.propertyState.upsert({
                    where: { roomId_squareIndex: { roomId: state.room.id, squareIndex } },
                    create: property,
                    update: property
                });
            }
            broadcastState(io, roomCode);
        });
        // PAY DONATION (Rent)
        socket.on('pay_donation', ({ roomCode, playerId, squareIndex }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            const playerIdx = state.players.findIndex(p => p.id === playerId);
            if (playerIdx === -1)
                return;
            const property = state.properties.find(p => p.squareIndex === squareIndex);
            if (!property)
                return;
            const category = boardData_1.BOARD_DATA[squareIndex].category;
            state.players[playerIdx].impactPoints -= 15;
            property.bonusReturns += 2;
            // Affect Global SDGs based on category
            if (category === 'Climate')
                state.room.sdgClimate += 15;
            else if (category === 'Education')
                state.room.sdgEducation += 15;
            else if (category === 'Health')
                state.room.sdgHealth += 15;
            else if (category === 'Energy')
                state.room.sdgEnergy += 15;
            else if (category === 'Justice')
                state.room.sdgJustice += 15;
            broadcastState(io, roomCode);
        });
        // PASS ACTION (Apathy Tax)
        socket.on('pass_action', ({ roomCode, playerId, squareIndex }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            const playerIdx = state.players.findIndex(p => p.id === playerId);
            if (playerIdx === -1)
                return;
            const cost = boardData_1.BOARD_DATA[squareIndex]?.cost || 0;
            const category = boardData_1.BOARD_DATA[squareIndex]?.category;
            if (cost > 0 && state.players[playerIdx].impactPoints >= cost) {
                // Apathy Tax
                state.players[playerIdx].impactPoints -= 15;
                if (category === 'Climate')
                    state.room.sdgClimate -= 5;
                else if (category === 'Education')
                    state.room.sdgEducation -= 5;
                else if (category === 'Health')
                    state.room.sdgHealth -= 5;
                else if (category === 'Energy')
                    state.room.sdgEnergy -= 5;
                else if (category === 'Justice')
                    state.room.sdgJustice -= 5;
            }
            broadcastState(io, roomCode);
        });
        // END TURN
        socket.on('end_turn', async ({ roomCode }) => {
            const state = exports.activeRooms.get(roomCode);
            if (!state)
                return;
            state.room.currentTurnIdx++;
            // End of Round Logic
            if (state.room.currentTurnIdx >= state.players.length) {
                state.room.currentTurnIdx = 0;
                await triggerEndOfRoundLogic(io, roomCode, state);
            }
            else {
                broadcastState(io, roomCode);
                // Next player Bot check
                if (state.players[state.room.currentTurnIdx]?.isBot) {
                    playBotTurn(io, roomCode);
                }
            }
        });
        socket.on('disconnect', () => {
            console.log(`[Socket] Disconnected: ${socket.id}`);
            // Mark player as inactive if needed
        });
    });
}
async function triggerEndOfRoundLogic(io, roomCode, state) {
    state.room.sdgClimate -= 5;
    state.room.sdgEducation -= 5;
    state.room.sdgHealth -= 5;
    state.room.sdgEnergy -= 5;
    state.room.sdgJustice -= 5;
    if (state.room.sdgClimate <= 0 ||
        state.room.sdgEducation <= 0 ||
        state.room.sdgHealth <= 0 ||
        state.room.sdgEnergy <= 0 ||
        state.room.sdgJustice <= 0) {
        io.to(roomCode).emit('game_over', { reason: 'collapse' });
        state.room.status = 'FINISHED';
        broadcastState(io, roomCode);
        return;
    }
    // Income Distribution
    const baseIncome = 10; // Assuming 10 per round as a base
    state.properties.forEach(prop => {
        const ownerIndex = state.players.findIndex(p => p.id === prop.ownerId);
        if (ownerIndex !== -1) {
            state.players[ownerIndex].impactPoints += (baseIncome + prop.bonusReturns);
        }
    });
    state.room.currentRound++;
    // Victory Check (Round 15)
    if (state.room.currentRound > 15) {
        if (state.room.sdgClimate < 20 ||
            state.room.sdgEducation < 20 ||
            state.room.sdgHealth < 20 ||
            state.room.sdgEnergy < 20 ||
            state.room.sdgJustice < 20) {
            io.to(roomCode).emit('game_over', { reason: 'collapse' });
        }
        else {
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
        const sdgs = [
            { name: 'Climate', score: state.room.sdgClimate },
            { name: 'Education', score: state.room.sdgEducation },
            { name: 'Health', score: state.room.sdgHealth },
            { name: 'Energy', score: state.room.sdgEnergy },
            { name: 'Justice', score: state.room.sdgJustice }
        ];
        // Find lowest score category strictly
        const lowestSDG = sdgs.sort((a, b) => a.score - b.score)[0];
        // Find the player with fewest properties in that category
        let bystanderId = null;
        let minProps = Infinity;
        state.players.forEach(p => {
            const sdgProps = state.properties.filter(prop => prop.ownerId === p.id && boardData_1.BOARD_DATA[prop.squareIndex]?.category === lowestSDG.name).length;
            if (sdgProps < minProps) {
                minProps = sdgProps;
                bystanderId = p.id;
            }
        });
        state.players.forEach(p => {
            p.impactPoints -= 20;
            if (p.id === bystanderId) {
                p.impactPoints -= 20; // 40 total
            }
        });
        io.to(roomCode).emit('crisis_triggered', { category: lowestSDG.name, bystanderId });
    }
    // Full logic check done, now write all to DB
    await flushStateToDatabase(state);
    broadcastState(io, roomCode);
    // Trigger next player if bot
    if (state.players[state.room.currentTurnIdx]?.isBot) {
        playBotTurn(io, roomCode);
    }
}
async function flushStateToDatabase(state) {
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
function playBotTurn(io, roomCode) {
    setTimeout(() => {
        const state = exports.activeRooms.get(roomCode);
        if (!state || state.room.status !== 'ACTIVE')
            return;
        const bot = state.players[state.room.currentTurnIdx];
        if (!bot || !bot.isBot)
            return;
        // ROLL
        const roll = Math.floor(Math.random() * 6) + Math.floor(Math.random() * 6) + 2;
        bot.position = (bot.position + roll) % 40;
        io.to(roomCode).emit('player_moved', { playerId: bot.id, position: bot.position, roll });
        broadcastState(io, roomCode);
        // DECIDE
        setTimeout(() => {
            const square = boardData_1.BOARD_DATA[bot.position];
            if (square.type !== 'EVENT' && square.type !== 'CORNER') {
                const property = state.properties.find(p => p.squareIndex === bot.position);
                if (property && property.ownerId !== bot.id) {
                    // Owned by someone else, pay donation
                    const playerIdx = state.players.findIndex(p => p.id === bot.id);
                    const category = square.category;
                    state.players[playerIdx].impactPoints -= 15;
                    property.bonusReturns += 2;
                    if (category === 'Climate')
                        state.room.sdgClimate += 15;
                    else if (category === 'Education')
                        state.room.sdgEducation += 15;
                    else if (category === 'Health')
                        state.room.sdgHealth += 15;
                    else if (category === 'Energy')
                        state.room.sdgEnergy += 15;
                    else if (category === 'Justice')
                        state.room.sdgJustice += 15;
                    broadcastState(io, roomCode);
                }
                else if (!property) {
                    // Unowned, make a decision based on botPersonality
                    let buy = false;
                    const category = square.category;
                    if (bot.botPersonality === 'Eco-Warrior') {
                        let score = 100;
                        if (category === 'Climate')
                            score = state.room.sdgClimate;
                        else if (category === 'Education')
                            score = state.room.sdgEducation;
                        else if (category === 'Health')
                            score = state.room.sdgHealth;
                        else if (category === 'Energy')
                            score = state.room.sdgEnergy;
                        else if (category === 'Justice')
                            score = state.room.sdgJustice;
                        if (score < 50 && bot.impactPoints >= square.cost)
                            buy = true;
                    }
                    else if (bot.botPersonality === 'Greedy') {
                        if (bot.impactPoints > (square.cost + 50))
                            buy = true;
                    }
                    else {
                        // Balanced
                        if (bot.impactPoints >= square.cost)
                            buy = true;
                    }
                    if (buy) {
                        bot.impactPoints -= square.cost;
                        state.properties.push({
                            id: (0, uuid_1.v4)(),
                            roomId: state.room.id,
                            squareIndex: bot.position,
                            ownerId: bot.id,
                            investmentLevel: 'SEED',
                            bonusReturns: 0
                        });
                    }
                    else {
                        // Passed, empathy tax
                        if (square.cost > 0 && bot.impactPoints >= square.cost) {
                            bot.impactPoints -= 15;
                            if (category === 'Climate')
                                state.room.sdgClimate -= 5;
                            else if (category === 'Education')
                                state.room.sdgEducation -= 5;
                            else if (category === 'Health')
                                state.room.sdgHealth -= 5;
                            else if (category === 'Energy')
                                state.room.sdgEnergy -= 5;
                            else if (category === 'Justice')
                                state.room.sdgJustice -= 5;
                        }
                    }
                    broadcastState(io, roomCode);
                }
            }
            // END 
            setTimeout(() => {
                state.room.currentTurnIdx++;
                if (state.room.currentTurnIdx >= state.players.length) {
                    state.room.currentTurnIdx = 0;
                    triggerEndOfRoundLogic(io, roomCode, state);
                }
                else {
                    broadcastState(io, roomCode);
                    if (state.players[state.room.currentTurnIdx]?.isBot) {
                        playBotTurn(io, roomCode);
                    }
                }
            }, 1500);
        }, 2000);
    }, 1000);
}
