
import { getSudoku } from "sudoku-gen";

export type GameDifficulty = "easy" | "medium" | "hard";

export interface SudokuPuzzle {
    puzzle: string;
    solution: string;
    difficulty: string;
}

export const generatePuzzle = (difficulty: GameDifficulty): SudokuPuzzle => {
    const sudoku = getSudoku(difficulty);
    return {
        puzzle: sudoku.puzzle,
        solution: sudoku.solution,
        difficulty: sudoku.difficulty,
    };
};

export const validateMove = (
    solution: string,
    row: number,
    col: number,
    value: number
): boolean => {
    const index = row * 9 + col;
    return solution[index] === value.toString();
};

export const isGameComplete = (currentBoard: (number | null)[][], solution: string): boolean => {
    // Flatten board and compare with solution string
    const flatBoard = currentBoard.flat().map(v => v === null ? '-' : v).join('');
    return flatBoard === solution;
}
