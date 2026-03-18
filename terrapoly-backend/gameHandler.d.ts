import { Server } from 'socket.io';
import { Room, Player, PropertyState } from '@prisma/client';
interface GameState {
    room: Room;
    players: Player[];
    properties: PropertyState[];
}
export declare const activeRooms: Map<string, GameState>;
export declare function setupSocketHandlers(io: Server): void;
export {};
//# sourceMappingURL=gameHandler.d.ts.map