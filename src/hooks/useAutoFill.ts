import { useEffect, useState, useRef } from 'react';

interface UseAutoFillProps {
    progress: number;
    board: (number | null)[][];
    solution: string;
    setCellValue: (r: number, c: number, v: number) => void;
    status: string; // GameStatus
    mistakeCells?: Set<string>; // Optional to support existing calls if any
    difficulty?: string;
}

export function useAutoFill({ progress, board, solution, setCellValue, status, mistakeCells, difficulty = 'medium' }: UseAutoFillProps) {
    const [activeAutoFillCell, setActiveAutoFillCell] = useState<{ r: number, c: number } | null>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const getThreshold = (diff: string) => {
        switch (diff) {
            case 'easy': return 10;
            case 'hard': return 5;
            case 'medium':
            default: return 8;
        }
    };
    const threshold = getThreshold(difficulty);

    useEffect(() => {
        // Clear any existing timeout on re-render/cleanup
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);

    useEffect(() => {
        // Trigger if threshold or fewer cells left, game is playing
        // We check if progress is low enough.
        // We also want to auto-fill if there are mistakes preventing completion (if mistakeCells provided).
        // Condition: (progress <= threshold) AND (we have work to do: empty cells OR mistakes)
        const hasWork = progress > 0 || (mistakeCells && mistakeCells.size > 0);

        if (progress <= threshold && hasWork && status === 'playing') {

            // Find the NEXT empty cell (just one)
            let targetCell: { r: number, c: number, val: number } | null = null;

            // Simple scan to find first empty
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (board[r][c] === null) {
                        targetCell = {
                            r,
                            c,
                            val: parseInt(solution[r * 9 + c])
                        };
                        break; // Found one
                    }
                }
                if (targetCell) break;
            }

            if (targetCell) {
                // Set visual indicator immediately
                setActiveAutoFillCell({ r: targetCell.r, c: targetCell.c });

                // Schedule the fill
                timeoutRef.current = setTimeout(() => {
                    if (targetCell) { // Check ref/validity again? Local var is safe.
                        setCellValue(targetCell.r, targetCell.c, targetCell.val);
                        // We don't nullify activeCell here immediately, 
                        // the re-render from setCellValue will trigger this effect again 
                        // and we'll either find a new cell or stop.
                    }
                }, 400); // 400ms delay for "swish" effect
            }
        } else {
            // Not automode or done
            setActiveAutoFillCell(null);
        }
    }, [progress, status, board, solution, setCellValue, mistakeCells, threshold]);

    return { activeAutoFillCell };
}
