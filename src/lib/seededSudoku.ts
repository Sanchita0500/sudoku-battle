import { getSudoku } from "sudoku-gen";
import { GameDifficulty, SudokuPuzzle } from "./sudoku";

// Simple seeded random number generator (Mulberry32)
// This allows us to generate the SAME puzzle for the same seed (date)
function mulberry32(a: number) {
    return function () {
        var t = a += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }
}

// Convert string seed to integer
function cyrb128(str: string) {
    let h1 = 1779033703, h2 = 3144134277,
        h3 = 1013904242, h4 = 2773480762;
    for (let i = 0, k; i < str.length; i++) {
        k = str.charCodeAt(i);
        h1 = h2 ^ Math.imul(h1 ^ k, 597399067);
        h2 = h3 ^ Math.imul(h2 ^ k, 2869860233);
        h3 = h4 ^ Math.imul(h3 ^ k, 951274213);
        h4 = h1 ^ Math.imul(h4 ^ k, 2716044179);
    }
    h1 = Math.imul(h3 ^ (h1 >>> 18), 597399067);
    h2 = Math.imul(h4 ^ (h2 >>> 22), 2869860233);
    h3 = Math.imul(h1 ^ (h3 >>> 17), 951274213);
    h4 = Math.imul(h2 ^ (h4 >>> 19), 2716044179);
    // return (h1^h2^h3^h4) >>> 0; 
    return (h1 ^ h2 ^ h3 ^ h4) >>> 0;
}

export const generateSeededPuzzle = (dateString: string, difficulty: GameDifficulty = 'medium'): SudokuPuzzle => {
    // 1. Create a seed from the date (e.g., "2023-10-27")
    // We add difficulty to seed so "easy" daily is different from "hard" daily if we wanted, 
    // but typically daily challenge has a specific difficulty per day. 
    // Let's assume Daily Challenge is always Medium for consistency, OR we can vary it by day of week.
    // Monday=Easy, Wednesday=Medium, Sunday=Hard? 
    // For now, let's just make it persistent.

    // Override Math.random temporarily
    const originalRandom = Math.random;

    try {
        const seedValue = cyrb128(dateString);
        const rand = mulberry32(seedValue);

        // Monkey-patch Math.random
        Math.random = rand;

        // Generate puzzle
        const sudoku = getSudoku(difficulty);

        return {
            puzzle: sudoku.puzzle,
            solution: sudoku.solution,
            difficulty: sudoku.difficulty as GameDifficulty,
        };
    } finally {
        // Restore Math.random
        Math.random = originalRandom;
    }
};

export const getDailyDifficulty = (date: Date): GameDifficulty => {
    const day = date.getDay(); // 0 = Sunday, 1 = Monday...
    if (day === 0 || day === 6) return 'hard'; // Weekends are hard
    if (day === 1 || day === 2) return 'easy'; // Mon/Tue are easy
    return 'medium'; // Wed/Thu/Fri are medium
}
