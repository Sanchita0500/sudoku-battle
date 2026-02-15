import { useState, useCallback } from "react";
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
    const [fastFillMode, setFastFillMode] = useState(false);
    const [fastFillNumber, setFastFillNumber] = useState<number | null>(null);
    const [pencilMode, setPencilMode] = useState(false);

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
