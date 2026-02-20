import { useState, useCallback, useEffect, useRef } from "react";
import { GameStatus } from "@/lib/types";

interface UseGameLogicProps {
    board: (number | null)[][];
    initialBoard: (number | null)[][];
    status: GameStatus;
    setCellValue: (row: number, col: number, value: number | null) => void;
    toggleNote: (row: number, col: number, num: number) => void;
    mistakeCells?: Set<string>;
}

export function useGameLogic({ board, initialBoard, status, setCellValue, toggleNote, mistakeCells }: UseGameLogicProps) {
    const [selected, setSelected] = useState<[number, number] | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
    const [fastFillMode, _setFastFillMode] = useState(() => {
        // Read preference from localStorage (safe: returns false if not set or SSR)
        if (typeof window !== 'undefined') {
            return localStorage.getItem('fast_fill_pref') === 'true';
        }
        return false;
    });
    const setFastFillMode = (val: boolean) => {
        _setFastFillMode(val);
        if (typeof window !== 'undefined') {
            localStorage.setItem('fast_fill_pref', String(val));
        }
    };
    const [fastFillNumber, setFastFillNumber] = useState<number | null>(null);
    const [pencilMode, setPencilMode] = useState(false);

    // Auto-advance: read fastFillNumber via ref so setting it doesn't cause cascade re-fires.
    // The effect only triggers on board/mistakeCells changes (one advance per fill).
    const fastFillNumberRef = useRef<number | null>(null);
    useEffect(() => { fastFillNumberRef.current = fastFillNumber; }, [fastFillNumber]);

    useEffect(() => {
        const num = fastFillNumberRef.current;
        if (num === null || status === 'won' || status === 'lost') return;

        // Count correct (non-mistake) placements of the active number
        let count = 0;
        for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
                if (board[r][c] === num && !mistakeCells?.has(`${r},${c}`)) count++;

        if (count === 9) {
            // Cycle forward from num+1 (5→6→7→…→9→1), skip only fully-complete numbers
            for (let offset = 1; offset <= 9; offset++) {
                const candidate = ((num - 1 + offset) % 9) + 1;
                let candidateCount = 0;
                for (let r = 0; r < 9; r++)
                    for (let c = 0; c < 9; c++)
                        if (board[r][c] === candidate && !mistakeCells?.has(`${r},${c}`)) candidateCount++;
                if (candidateCount < 9) {
                    setFastFillNumber(candidate);
                    setHighlightedNumber(candidate);
                    setSelected(null); // clear selection so no extra indigo highlight alongside amber
                    break;
                }
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [board, mistakeCells, status]); // fastFillNumber intentionally omitted — read via ref


    const handleNumberClick = useCallback((num: number) => {
        if (status === 'won' || status === 'lost') return;

        // Always remember the selected number for fast fill mode
        setFastFillNumber(num);

        if (fastFillMode) {
            setHighlightedNumber(num);
            // DON'T clear selection in fast fill mode - this allows one-click filling
            // The cell click handler will do the filling directly
        } else {
            // Only clear selection when NOT in fast fill mode
            if (!pencilMode) {
                setSelected(null);
            }
        }

        // Standard fill for currently selected cell (if not in fast fill mode)
        if (!fastFillMode && selected) {
            if (pencilMode) {
                toggleNote(selected[0], selected[1], num);
            } else {
                setCellValue(selected[0], selected[1], num);
            }
        }
    }, [status, fastFillMode, pencilMode, selected, setCellValue, toggleNote]);

    const handleCellClick = useCallback((row: number, col: number) => {
        if (status === 'won' || status === 'lost') return;

        const cellValue = board[row][col];

        // Mistake Instant Clear: Tapping a mistake clears it immediately (Single Tap Fix)
        if (mistakeCells?.has(`${row},${col}`)) {
            setCellValue(row, col, null);
            setSelected([row, col]);
            setHighlightedNumber(null);
            return;
        }

        const isAlreadySelected = selected && selected[0] === row && selected[1] === col;
        const isInitialCell = initialBoard[row][col] !== null;

        // Tap-to-Clear Logic: tapping a user-filled cell again clears it
        if (isAlreadySelected && cellValue !== null && !isInitialCell) {
            setCellValue(row, col, null);
            return;
        }

        // One-Click Fast Fill: if fast fill is active and number selected and cell is empty, fill immediately
        if (fastFillMode && fastFillNumber !== null && cellValue === null) {
            // Fill directly WITHOUT selecting cell first (true one-click fill)
            if (pencilMode) {
                toggleNote(row, col, fastFillNumber);
            } else {
                setCellValue(row, col, fastFillNumber);
            }
            return; // Don't select after filling
        }

        // If clicking a filled cell, highlight and sync the number to pad
        if (cellValue !== null) {
            setHighlightedNumber(cellValue);
            setFastFillNumber(cellValue); // Sync to fast fill - this will trigger pad selection
            setSelected([row, col]);
            return;
        }

        // Normal click on empty cell: select it
        setSelected([row, col]);
        setHighlightedNumber(null);
    }, [status, selected, board, initialBoard, fastFillMode, fastFillNumber, pencilMode, setCellValue, toggleNote, mistakeCells]);

    const handleClear = useCallback(() => {
        if (status === 'won' || status === 'lost') return;
        if (selected) {
            setCellValue(selected[0], selected[1], null);
        }
    }, [status, selected, setCellValue]);

    const handleBackgroundClick = useCallback(() => {
        setSelected(null);
    }, []);

    const resetSelection = useCallback(() => {
        setSelected(null);
        setHighlightedNumber(null);
        setFastFillNumber(null);
    }, []);

    return {
        selected,
        setSelected,
        highlightedNumber,
        setHighlightedNumber,
        fastFillMode,
        setFastFillMode,
        fastFillNumber,
        setFastFillNumber,
        pencilMode,
        setPencilMode,
        handleCellClick,
        handleNumberClick,
        handleClear,
        handleBackgroundClick,
        resetSelection
    };
}
