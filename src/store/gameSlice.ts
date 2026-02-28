import { StateCreator } from 'zustand';
import { generatePuzzle, validateMove } from '@/lib/sudoku';
import { generateSeededPuzzle } from '@/lib/seededSudoku';
import { GameDifficulty, GameStatus } from '@/lib/types';
import { enableMapSet } from 'immer';

enableMapSet();

export interface GameSlice {
    board: (number | null)[][];
    initialBoard: (number | null)[][];
    solution: string;
    difficulty: GameDifficulty;
    status: GameStatus;
    mistakes: number;
    mistakeCells: Set<string>;
    history: { row: number, col: number, oldValue: number | null }[];
    notes: number[][][];
    progress: number;
    startTime: number | null;
    endTime: number | null;

    startGame: (difficulty: GameDifficulty, dateStr?: string) => void;
    setCellValue: (row: number, col: number, value: number | null) => void;
    toggleNote: (row: number, col: number, num: number) => void;
    undo: () => void;
    resetBoard: () => void;
    resetGame: () => void;
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

// Helper to count empty cells
const countEmpty = (board: (number | null)[][]): number => {
    let count = 0;
    for (const row of board) {
        for (const cell of row) {
            if (cell === null) count++;
        }
    }
    return count;
};

// We use a generic here to allow merging with other slices (Multiplayer/Singleplayer specific)
export const createGameSlice: StateCreator<GameSlice, [["zustand/immer", never]], [], GameSlice> = (set, get) => ({
    board: Array(9).fill(null).map(() => Array(9).fill(null)),
    initialBoard: Array(9).fill(null).map(() => Array(9).fill(null)),
    solution: '',
    difficulty: 'easy',
    status: GameStatus.Idle,
    mistakes: 0,
    mistakeCells: new Set<string>(),
    history: [],
    notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
    progress: 81,
    startTime: null,
    endTime: null,

    startGame: (difficulty, dateStr) => {
        try {
            let puzzleData;

            // Generate Puzzle
            if (dateStr) {
                // Determine difficulty for Daily Challenge based on day of week?
                // Or just use the passed difficulty (which might be default 'easy' from state if not passed explicitly)
                // In SinglePlayerGame, we pass 'difficulty' state.
                // For Daily, we probably want fixed difficulty per day?
                // But for now, let's respect the passed difficulty or force Medium.
                // The DailyChallengeMenu passes a difficulty.
                puzzleData = generateSeededPuzzle(dateStr, difficulty);
            } else {
                puzzleData = generatePuzzle(difficulty);
            }

            const { puzzle, solution, difficulty: finalDifficulty } = puzzleData;
            const parsedBoard = parseBoard(puzzle);

            // Calculate initial progress (empty cells)
            const initialProgress = countEmpty(parsedBoard);

            set({
                board: parsedBoard,
                initialBoard: structuredClone(parsedBoard),
                solution,
                difficulty: finalDifficulty,
                status: GameStatus.Playing,
                mistakes: 0,
                mistakeCells: new Set<string>(),
                history: [],
                notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
                progress: initialProgress,
                startTime: Date.now(), // This sets the start time!
                endTime: null,
            });
        } catch (error) {
            console.error("[GameSlice] startGame Failed:", error);
            // Optionally set status to Error or similar, but for now just logging.
        }
    },

    setCellValue: (row, col, value) => {
        const { board, initialBoard, solution, mistakes, mistakeCells, status, progress } = get();

        // Don't allow changes if game is over
        if (status === GameStatus.Won || status === GameStatus.Lost) return;

        // Don't modify if cell is part of initial puzzle
        if (initialBoard[row][col] !== null) return;

        const currentValue = board[row][col];
        // If value hasn't changed, do nothing
        if (currentValue === value) return;

        const cellKey = `${row},${col}`;

        // Create a NEW Set to ensure Zustand detects the change
        let newMistakeCells = new Set(mistakeCells);

        // Check validity
        let isValid = true;
        let newMistakes = mistakes;
        let newProgress = progress;
        let newEndTime: number | null = null;

        // Progress Update Logic
        if (currentValue === null && value !== null) {
            newProgress--;
        } else if (currentValue !== null && value === null) {
            newProgress++;
        }

        if (value !== null) {
            isValid = validateMove(solution, row, col, value);
            if (!isValid) {
                newMistakes += 1;
                newMistakeCells.add(cellKey);
            } else {
                newMistakeCells.delete(cellKey);
            }
        } else {
            // Clearing cell removes mistake styling
            newMistakeCells.delete(cellKey);
        }

        // Check for Game Over (Loss) or Victory
        let newStatus: GameStatus = status;
        if (newMistakes >= 3) {
            newStatus = GameStatus.Lost;
            newEndTime = Date.now();
        } else if (progress <= 8 || newProgress === 0) {
            // Victory check: 
            // 1. If progress is 0 (all filled) and no mistakes -> Win.
            // 2. OR if we are auto-filling (triggered by checking count), we assume the last moves will trigger win.
            // Actually, we just check completion here.
            // The constraint is: Board Full AND No Mistakes.
            // Note: newProgress is "empty count".
            if (newProgress === 0) {
                if (newMistakeCells.size === 0) {
                    newStatus = GameStatus.Won;
                    newEndTime = Date.now();
                }
            }
        }

        set((state) => {
            state.history.push({ row, col, oldValue: board[row][col] });
            state.board[row][col] = value;
            state.mistakes = newMistakes;
            state.mistakeCells = newMistakeCells;
            state.status = newStatus;
            state.progress = newProgress;
            if (newEndTime) {
                state.endTime = newEndTime;
            }

            // Clear notes if value is filled
            if (value !== null) {
                state.notes[row][col] = [];
            }
        });

        // Check for Victory
        // We do this after the update to ensure board is fresh? 
        // Actually Zustand setter inside 'set' won't reflect immediately in 'get' if called synchronously inside same function
        // But we are using Immer, so we modify draft.
        // We can check victory here or in a separate effect/derived state.
        // The original implementation checked victory in a useEffect or after render.
        // Let's keep it simple for now and rely on the useEffect in the component to check victory
        // OR we can check victory right here if we want to be pure.
        // For now, let's replicate the existing logic which seemed to handle victory in components or simple checks.
        // Actually, the original store didn't seem to explicitly set "Won" status inside setCellValue?
        // Let's check the original useGameStore.ts -- wait I don't see victory check in setCellValue in the snippet above.
        // It seems victory is handled by checking if board is full and valid.
    },

    toggleNote: (row, col, num) => {
        const { board, initialBoard } = get();
        if (initialBoard[row][col] !== null || board[row][col] !== null) return;

        set((state) => {
            const cellNotes = state.notes[row][col];
            if (cellNotes.includes(num)) {
                state.notes[row][col] = cellNotes.filter(n => n !== num);
            } else {
                state.notes[row][col] = [...cellNotes, num].sort();
            }
        });
    },

    undo: () => {
        const { history } = get();
        if (history.length === 0) return;

        const lastMove = history[history.length - 1];
        const { row, col, oldValue } = lastMove;

        set((state) => {
            state.history.pop();
            const currentValue = state.board[row][col];

            // Revert progress
            // If current was set (val) and old was null, we made it empty -> progress++
            // If current was set (val) and old was set (diff val), progress same
            // If current was null (cleared) and old was set (val), we filled it -> progress--

            // But wait, `setCellValue` handles logic:
            // null -> val : progress--
            // val -> null : progress++
            // val -> val : progress same

            // Here we are doing: current -> old
            if (currentValue !== null && oldValue === null) {
                state.progress++;
            } else if (currentValue === null && oldValue !== null) {
                state.progress--;
            }

            state.board[row][col] = oldValue;

            const cellKey = `${row},${col}`;
            if (state.mistakeCells.has(cellKey)) {
                state.mistakeCells.delete(cellKey);
            }
            // Note: We don't revert 'mistakes' count penalty, as decided. 
            // But we should probably check if status needs to revert from 'Won' to 'Playing'?
            // If we undo the last winning move?
            if (state.status === GameStatus.Won) {
                state.status = GameStatus.Playing;
            }
        });
    },

    resetBoard: () => {
        const { initialBoard } = get();
        const initialProgress = countEmpty(initialBoard);

        set((state) => {
            state.board = state.initialBoard.map((row: (number | null)[]) => [...row]);
            state.mistakes = 0;
            state.mistakeCells = new Set();
            state.history = [];
            state.notes = Array(9).fill(null).map(() => Array(9).fill(null).map(() => []));
            state.progress = initialProgress;
            state.startTime = Date.now(); // Bug 8: restart timer on reset
            state.endTime = null;
            if (state.status === GameStatus.Lost || state.status === GameStatus.Won) {
                state.status = GameStatus.Playing;
            }
        });
    },

    resetGame: () => {
        set({
            status: GameStatus.Idle,
            board: Array(9).fill(null).map(() => Array(9).fill(null)),
            initialBoard: Array(9).fill(null).map(() => Array(9).fill(null)),
            solution: '',
            startTime: null,
            endTime: null,
            mistakes: 0,
            mistakeCells: new Set(),
            history: [],
            notes: Array(9).fill(null).map(() => Array(9).fill(null).map(() => [])),
            progress: 81
        });
    }
});
