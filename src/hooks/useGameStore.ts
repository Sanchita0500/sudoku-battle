
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

    history: { row: number, col: number, oldValue: number | null }[];
    notes: number[][][];

    // Actions
    startGame: (difficulty: GameDifficulty) => void;
    setCellValue: (row: number, col: number, value: number | null) => void;
    toggleNote: (row: number, col: number, num: number) => void;
    undo: () => void;
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
    history: [],
    notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),

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
            history: [], // Reset history
            notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])), // Reset notes
        });
    },

    setCellValue: (row, col, value) => {
        const { board, initialBoard, solution, mistakes, status, history, notes } = get();

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
        const oldValue = newBoard[row][col];
        newBoard[row][col] = value;

        // Clear notes for this cell if a value is set
        const newNotes = [...notes];
        if (value !== null) {
            newNotes[row] = [...newNotes[row]];
            newNotes[row][col] = [];
        }

        // Push to history
        const newHistory = [...history, { row, col, oldValue }];

        // Check for game over (3 mistakes)
        if (newMistakes >= 3) {
            set({
                board: newBoard,
                notes: newNotes,
                mistakes: newMistakes,
                status: 'lost',
                history: newHistory
            });
            return;
        }

        set({
            board: newBoard,
            notes: newNotes,
            mistakes: newMistakes,
            history: newHistory
        });

        // Check win condition
        const isFull = newBoard.every(row => row.every(cell => cell !== null));
        if (isFull) {
            // Double check against solution
            const flatBoard = newBoard.flat().join('');
            if (flatBoard === solution) {
                set({ status: 'won' });
            } else {
                // Board is full but incorrect -> Game Over
                set({ status: 'lost' });
            }
        }
    },

    toggleNote: (row, col, num) => {
        const { notes, status, initialBoard, board } = get();
        if (status === 'won' || status === 'lost') return;
        if (initialBoard[row][col] !== null) return;
        if (board[row][col] !== null) return; // Don't add notes to filled cells

        const newNotes = [...notes];
        newNotes[row] = [...newNotes[row]];
        const cellNotes = [...newNotes[row][col]];

        if (cellNotes.includes(num)) {
            newNotes[row][col] = cellNotes.filter(n => n !== num);
        } else {
            newNotes[row][col] = [...cellNotes, num].sort((a, b) => a - b);
        }

        set({ notes: newNotes });
    },

    undo: () => {
        const { board, history, status } = get();
        if (status === 'won' || status === 'lost' || history.length === 0) return;

        const lastMove = history[history.length - 1];
        const newHistory = history.slice(0, -1);

        const newBoard = [...board];
        newBoard[lastMove.row] = [...newBoard[lastMove.row]];
        newBoard[lastMove.row][lastMove.col] = lastMove.oldValue;

        set({
            board: newBoard,
            history: newHistory
        });
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

        // If we are waiting/idle and room starts playing, we initialize the game
        // AND we should NOT sync the player status from remote yet, because it might be stale (from previous game)
        const isGameStarting = status === 'idle' && room.status === 'playing';

        if (isGameStarting) {
            // Initialize board from room.puzzle
            const parsedBoard = parseBoard(room.puzzle);
            updatedState.board = parsedBoard;
            updatedState.initialBoard = JSON.parse(JSON.stringify(parsedBoard));
            updatedState.solution = room.solution;
            updatedState.difficulty = room.difficulty;
            updatedState.status = 'playing';
            updatedState.mistakes = 0;
            // Explicitly do not sync player status here, trust the initialization
        } else {
            // Only sync local player status if we are NOT just starting
            if (localPlayerId && room.players?.[localPlayerId]) {
                const localRemote = room.players[localPlayerId];
                if (localRemote.status === 'won' || localRemote.status === 'lost') {
                    // Check if we are currently playing, otherwise don't blindly accept
                    if (status === 'playing') {
                        updatedState.status = localRemote.status;
                    }
                }
                // Always sync mistakes to keep UI consistent
                updatedState.mistakes = localRemote.mistakes;
            }
        }

        set(updatedState);
    },

    setOpponentState: (player: Player) => {
        set({ opponent: player });
    }
}));
