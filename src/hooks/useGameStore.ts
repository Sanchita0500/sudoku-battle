
import { create } from 'zustand';
import { generatePuzzle, GameDifficulty, validateMove } from '@/lib/sudoku';

import { Room, Player } from '@/lib/rooms';

interface GameState {
    board: (number | null)[][];
    initialBoard: (number | null)[][];
    solution: string;
    difficulty: GameDifficulty;
    status: 'idle' | 'playing' | 'won' | 'lost';
    roomStatus: 'waiting' | 'playing' | 'finished';
    startTime: number | null;
    mistakes: number;
    opponent: Player | null;
    players: Record<string, Player>;

    // Actions
    startGame: (difficulty: GameDifficulty) => void;
    setCellValue: (row: number, col: number, value: number | null) => void;
    resetBoard: () => void;
    resetGame: () => void;
    setRemoteState: (room: Room, localPlayerId?: string) => void;
    setOpponentState: (player: Player) => void;
}

const parseBoard = (puzzleString: string): (number | null)[][] => {
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

export const useGameStore = create<GameState>((set, get) => ({
    board: Array(9).fill(null).map(() => Array(9).fill(null)),
    initialBoard: Array(9).fill(null).map(() => Array(9).fill(null)),
    solution: '',
    difficulty: 'easy',
    status: 'idle',
    roomStatus: 'waiting',
    startTime: null,
    mistakes: 0,
    opponent: null,

    startGame: (difficulty) => {
        const { puzzle, solution } = generatePuzzle(difficulty);
        const parsedBoard = parseBoard(puzzle);

        set({
            board: parsedBoard,
            initialBoard: JSON.parse(JSON.stringify(parsedBoard)), // Deep copy
            solution,
            difficulty,
            status: 'playing',
            mistakes: 0, // Reset mistakes to 0
            opponent: null, // Reset opponent
        });
    },

    setCellValue: (row, col, value) => {
        const { board, initialBoard, solution, mistakes, status } = get();

        // Don't allow changes if game is over
        if (status === 'won' || status === 'lost') return;

        // Don't modify if cell is part of initial puzzle
        if (initialBoard[row][col] !== null) return;

        // Check validity
        let isValid = true;
        let newMistakes = mistakes;

        if (value !== null) {
            isValid = validateMove(solution, row, col, value);
            if (!isValid) {
                newMistakes = mistakes + 1;
            }
        }

        // Update board
        const newBoard = [...board];
        newBoard[row] = [...newBoard[row]];
        newBoard[row][col] = value;

        // Check for game over (3 mistakes)
        if (newMistakes >= 3) {
            set({
                board: newBoard,
                mistakes: newMistakes,
                status: 'lost'
            });
            return;
        }

        set({
            board: newBoard,
            mistakes: newMistakes
        });

        // Check win condition
        const isFull = newBoard.every(row => row.every(cell => cell !== null));
        if (isFull) {
            // Double check against solution
            const flatBoard = newBoard.flat().join('');
            if (flatBoard === solution) {
                set({ status: 'won' });
            }
        }
    },

    resetBoard: () => {
        const { initialBoard } = get();
        set({
            board: JSON.parse(JSON.stringify(initialBoard)), // Reset to initial board
            status: 'playing',
            mistakes: 0,
        });
    },

    resetGame: () => {
        set({ status: 'idle', roomStatus: 'waiting', startTime: null, board: [], initialBoard: [], solution: '' });
    },

    players: {} as Record<string, Player>,

    setRemoteState: (room: Room, localPlayerId?: string) => {
        const { status } = get();

        // Sync players list and room metadata
        const updatedState: Partial<GameState> = {
            players: room.players || {},
            roomStatus: room.status,
            startTime: room.startTime
        };

        // Sync local player status and mistakes if playerId provided
        if (localPlayerId && room.players?.[localPlayerId]) {
            const localRemote = room.players[localPlayerId];
            if (localRemote.status === 'won' || localRemote.status === 'lost') {
                updatedState.status = localRemote.status;
            }
            // Always sync mistakes to keep UI consistent
            updatedState.mistakes = localRemote.mistakes;
        }

        // If we are waiting/idle and room starts playing
        if (status === 'idle' && room.status === 'playing') {
            // Initialize board from room.puzzle
            const parsedBoard = parseBoard(room.puzzle);
            updatedState.board = parsedBoard;
            updatedState.initialBoard = JSON.parse(JSON.stringify(parsedBoard));
            updatedState.solution = room.solution;
            updatedState.difficulty = room.difficulty;
            updatedState.status = 'playing';
            updatedState.mistakes = 0;
        }

        set(updatedState);
    },

    setOpponentState: (player: Player) => {
        set({ opponent: player });
    }
}));
