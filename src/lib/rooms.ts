import { db } from "./firebase";
import { ref, set, get, update, child, serverTimestamp, onDisconnect, remove } from "firebase/database";
import { generatePuzzle } from "./sudoku";
import { GameDifficulty, GameStatus, RoomStatus } from "./types";
import { z } from "zod";

export { type GameDifficulty, GameStatus, RoomStatus };

// Zod Schemas for Runtime Validation
export const PlayerSchema = z.object({
    id: z.string(),
    name: z.string(),
    progress: z.number(),
    mistakes: z.number(),
    completed: z.boolean(),
    status: z.nativeEnum(GameStatus),
    timeTaken: z.number(),
    joinedAt: z.number(),
});

export const RoomSchema = z.object({
    id: z.string(),
    ownerId: z.string(),
    status: z.nativeEnum(RoomStatus),
    puzzle: z.string(),
    solution: z.string(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    startTime: z.number().nullable(),
    players: z.record(z.string(), PlayerSchema),
    createdAt: z.number(),
});

// Infer types from Zod schemas
export type Player = z.infer<typeof PlayerSchema>;
export type Room = z.infer<typeof RoomSchema>;


const generateRoomId = (): string => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};


export const createRoom = async (playerId: string, playerName: string, difficulty: GameDifficulty): Promise<string> => {
    try {
        const roomId = generateRoomId();
        const { puzzle, solution } = generatePuzzle(difficulty);

        const roomRef = ref(db, `rooms/${roomId}`);
        const playerRef = child(roomRef, `players/${playerId}`);

        const initialPlayer: Player = {
            id: playerId,
            name: playerName,
            progress: 81,
            mistakes: 0,
            completed: false,
            status: GameStatus.Playing,
            timeTaken: 0,
            joinedAt: Date.now(),
        };

        const roomData: Room = {
            id: roomId,
            ownerId: playerId,
            status: RoomStatus.Waiting,
            puzzle,
            solution,
            difficulty,
            startTime: null,
            players: {
                [playerId]: initialPlayer
            },
            createdAt: Date.now(),
        };

        // Validate before writing (optional but good for debugging)
        RoomSchema.parse(roomData);

        await set(roomRef, roomData);

        // Auto-remove player on disconnect
        onDisconnect(playerRef).remove();

        console.log(`Room created successfully: ${roomId}`);
        return roomId;
    } catch (error) {
        console.error("Error creating room:", error);
        throw error;
    }
};

export const joinRoom = async (roomId: string, playerId: string, playerName: string): Promise<{ success: boolean; message?: string }> => {
    try {
        const roomRef = ref(db, `rooms/${roomId}`);
        const snapshot = await get(roomRef);

        if (!snapshot.exists()) {
            return { success: false, message: "Room code not found. Please check and try again." };
        }

        const room = snapshot.val() as Room;

        if (room.status !== RoomStatus.Waiting) {
            return { success: false, message: "Game already in progress or finished." };
        }

        if (Object.keys(room.players || {}).length >= 4) {
            return { success: false, message: "Room is full (maximum 4 players)." };
        }

        const newPlayer: Player = {
            id: playerId,
            name: playerName,
            progress: 81,
            mistakes: 0,
            completed: false,
            status: GameStatus.Playing,
            timeTaken: 0,
            joinedAt: Date.now(),
        };

        const playerRef = child(roomRef, `players/${playerId}`);
        await update(playerRef, newPlayer);

        // Auto-remove player on disconnect
        onDisconnect(playerRef).remove();

        console.log(`Player ${playerName} joined room ${roomId}`);

        return { success: true };
    } catch (error: unknown) {
        console.error("Error joining room:", error);
        const message = error instanceof Error ? error.message : "Failed to join room. Please check your connection.";
        return { success: false, message };
    }
};

export const startGame = async (roomId: string) => {
    const roomRef = ref(db, `rooms/${roomId}`);
    const snapshot = await get(roomRef);

    if (!snapshot.exists()) {
        throw new Error("Room not found");
    }

    const room = snapshot.val() as Room;
    const { puzzle, solution } = generatePuzzle(room.difficulty as GameDifficulty);

    const updatedPlayers = { ...room.players };
    Object.keys(updatedPlayers).forEach(playerId => {
        updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            progress: 81, // Reset progress (81 empty cells)
            mistakes: 0,
            completed: false,
            status: GameStatus.Playing,
            timeTaken: 0
        };
    });

    await update(roomRef, {
        status: RoomStatus.Playing,
        startTime: serverTimestamp(),
        puzzle,
        solution,
        players: updatedPlayers
    });
};

/**
 * Delete a room from Firebase. Called after a game ends and scores are recorded,
 * so finished rooms don't accumulate in the database.
 */
export const deleteRoom = async (roomId: string): Promise<void> => {
    const roomRef = ref(db, `rooms/${roomId}`);
    await remove(roomRef);
};
