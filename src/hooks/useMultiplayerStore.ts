import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { devtools } from 'zustand/middleware';
import { createGameSlice, GameSlice } from '@/store/gameSlice';
import { RoomStatus, GameStatus, GameDifficulty } from '@/lib/types';
import { Room, Player } from '@/lib/rooms';

interface MultiplayerState extends GameSlice {
    players: Record<string, Player>;
    roomStatus: RoomStatus;
    ownerId: string | null;

    setRemoteState: (room: Room, localPlayerId?: string) => void;
}

export const useMultiplayerStore = create<MultiplayerState>()(
    devtools(
        immer((set, get, store) => {
            const gameSlice = createGameSlice(set as any, get as any, store as any);

            return {
                ...gameSlice,
                players: {},
                roomStatus: RoomStatus.Waiting,
                ownerId: null,

                resetGame: () => {
                    gameSlice.resetGame();
                    set({
                        players: {},
                        roomStatus: RoomStatus.Waiting,
                        ownerId: null,
                        startTime: null
                    });
                },

                setRemoteState: (room: Room, localPlayerId?: string) => {
                    const { status } = get();

                    // Sync players list and room metadata
                    const updatedState: Partial<MultiplayerState> = {
                        players: (room.players || {}) as Record<string, Player>,
                        roomStatus: room.status,
                        ownerId: room.ownerId || null,
                        startTime: room.startTime
                    };

                    // If we are waiting/idle and room starts playing, we initialize the game
                    const isGameStarting = status === GameStatus.Idle && room.status === RoomStatus.Playing;

                    if (isGameStarting) {
                        // Logic to initialize board from room.puzzle
                        const parseBoard = (puzzleString: string) => {
                            const board: (number | null)[][] = [];
                            for (let i = 0; i < 9; i++) {
                                const row: (number | null)[] = [];
                                for (let j = 0; j < 9; j++) {
                                    const char = puzzleString[i * 9 + j];
                                    row.push(char === '-' ? null : parseInt(char));
                                }
                                board.push(row);
                            }
                            return board;
                        };

                        const parsedBoard = parseBoard(room.puzzle);

                        const countEmpty = (board: (number | null)[][]): number => {
                            let count = 0;
                            for (const row of board) {
                                for (const cell of row) {
                                    if (cell === null) count++;
                                }
                            }
                            return count;
                        };
                        const initialProgress = countEmpty(parsedBoard);

                        set({
                            ...updatedState,
                            board: parsedBoard,
                            initialBoard: structuredClone(parsedBoard),
                            solution: room.solution,
                            difficulty: room.difficulty as GameDifficulty,
                            status: GameStatus.Playing,
                            progress: initialProgress,
                            mistakes: 0
                        });
                        return;
                    } else {
                        // Only sync local player status if we are NOT just starting
                        if (localPlayerId && updatedState.players && updatedState.players[localPlayerId]) {
                            const localRemote: Player = updatedState.players[localPlayerId];
                            if (localRemote.status === GameStatus.Won || localRemote.status === GameStatus.Lost) {
                                if (status === GameStatus.Playing) {
                                    updatedState.status = localRemote.status;
                                }
                            }
                            // Do NOT sync mistakes from remote. Local state is the source of truth for the active player.
                            // Syncing from remote causes race conditions where optimistic local updates are reverted by stale remote data.
                        }
                    }

                    set(updatedState);
                }
            };
        }),
        { name: 'MultiplayerStore' }
    )
);
