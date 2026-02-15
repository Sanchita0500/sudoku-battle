import { db } from "./firebase";
import { ref, set, get, update, child, serverTimestamp } from "firebase/database";
import { generatePuzzle, GameDifficulty } from "./sudoku";
export { type GameDifficulty } from "./sudoku";

export interface Player {
    id: string;
    name: string;
    progress: number; // Number of empty cells remaining
    mistakes: number;
    completed: boolean;
    status: "playing" | "lost" | "won";
    timeTaken: number;
    joinedAt: number;
}

export interface Room {
    id: string;
    ownerId: string; // Add ownerId to identify the host reliably
    status: "waiting" | "playing" | "finished";
    puzzle: string;
    solution: string;
    difficulty: GameDifficulty;
    startTime: number | null;
    players: Record<string, Player>;
    createdAt: number;
}

export const createRoom = async (playerId: string, playerName: string, difficulty: GameDifficulty): Promise<string> => {
    try {
        const roomId = generateRoomId();
        const { puzzle, solution } = generatePuzzle(difficulty);

        const roomRef = ref(db, `rooms/${roomId}`);

        const initialPlayer: Player = {
            id: playerId,
            name: playerName,
            progress: 81,
            mistakes: 0,
            completed: false,
            status: "playing",
            timeTaken: 0,
            joinedAt: Date.now(),
        };

        const roomData: Room = {
            id: roomId,
            ownerId: playerId, // Set the creator as owner
            status: "waiting",
            puzzle,
            solution,
            difficulty,
            startTime: null,
            players: {
                [playerId]: initialPlayer
            },
            createdAt: Date.now(),
        };

        await set(roomRef, roomData);
        console.log(`Room created successfully: ${roomId}`);
        return roomId;
    } catch (error: unknown) {
        console.error("Error creating room:", error);
        const message = error instanceof Error ? error.message : "Failed to create room. Please check your internet connection.";
        throw new Error(message);
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

        if (room.status !== "waiting") {
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
            status: "playing",
            timeTaken: 0,
            joinedAt: Date.now(),
        };

        await update(child(roomRef, `players/${playerId}`), newPlayer);
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
    const { puzzle, solution } = generatePuzzle(room.difficulty);

    const updatedPlayers = { ...room.players };
    Object.keys(updatedPlayers).forEach(playerId => {
        updatedPlayers[playerId] = {
            ...updatedPlayers[playerId],
            progress: 81, // Reset progress (81 empty cells)
            mistakes: 0,
            completed: false,
            status: "playing",
            timeTaken: 0
        };
    });

    await update(roomRef, {
        status: "playing",
        startTime: serverTimestamp(),
        puzzle,
        solution,
        players: updatedPlayers
    });
}

function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
