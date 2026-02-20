"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import Cell from "./Cell";

interface BoardProps {
    selected: [number, number] | null;
    onSelect: (coords: [number, number] | null) => void;
    highlightedNumber?: number | null;
    isPencilMode?: boolean;
    board: (number | null)[][];
    initialBoard: (number | null)[][];
    mistakeCells: Set<string>;
    notes: number[][][];
    onCellClick: (row: number, col: number, value: number | null) => void;
    onNoteClick: (row: number, col: number, num: number) => void;
    onClear?: () => void;
    activeAutoFillCell?: { r: number, c: number } | null;
}

export default function Board({
    selected,
    onSelect,
    highlightedNumber,
    isPencilMode = false,
    board,
    initialBoard,
    mistakeCells,
    notes,
    onCellClick,
    onNoteClick,
    onClear,
    activeAutoFillCell
}: BoardProps) {

    // Memoize the value of the selected cell for highlighting
    const selectedValue = useMemo(() =>
        selected ? board[selected[0]][selected[1]] : null,
        [selected, board]
    );

    // Memoize which number to highlight: either from selected cell or from number pad
    const numberToHighlight = useMemo(() =>
        highlightedNumber !== undefined ? highlightedNumber : selectedValue,
        [highlightedNumber, selectedValue]
    );

    // --- Completed row/column detection ---
    // A row/col is "complete" if all 9 cells are filled AND none are mistakes
    const completedRows = useMemo(() => {
        const set = new Set<number>();
        for (let r = 0; r < 9; r++) {
            const rowFull = board[r].every(v => v !== null);
            const rowNoMistake = board[r].every((_, c) => !mistakeCells.has(`${r},${c}`));
            if (rowFull && rowNoMistake) set.add(r);
        }
        return set;
    }, [board, mistakeCells]);

    const completedCols = useMemo(() => {
        const set = new Set<number>();
        for (let c = 0; c < 9; c++) {
            const colFull = board.every(row => row[c] !== null);
            const colNoMistake = board.every((_, r) => !mistakeCells.has(`${r},${c}`));
            if (colFull && colNoMistake) set.add(c);
        }
        return set;
    }, [board, mistakeCells]);

    // Track which rows/cols are currently in the "flash" animation (1.2s burst)
    const [flashingRows, setFlashingRows] = useState<Set<number>>(new Set());
    const [flashingCols, setFlashingCols] = useState<Set<number>>(new Set());
    const prevCompletedRows = useRef<Set<number>>(new Set());
    const prevCompletedCols = useRef<Set<number>>(new Set());

    useEffect(() => {
        const newRows = [...completedRows].filter(r => !prevCompletedRows.current.has(r));
        const newCols = [...completedCols].filter(c => !prevCompletedCols.current.has(c));

        if (newRows.length > 0) {
            setFlashingRows(prev => new Set([...prev, ...newRows]));
            setTimeout(() => {
                setFlashingRows(prev => {
                    const next = new Set(prev);
                    newRows.forEach(r => next.delete(r));
                    return next;
                });
            }, 1200);
        }

        if (newCols.length > 0) {
            setFlashingCols(prev => new Set([...prev, ...newCols]));
            setTimeout(() => {
                setFlashingCols(prev => {
                    const next = new Set(prev);
                    newCols.forEach(c => next.delete(c));
                    return next;
                });
            }, 1200);
        }

        prevCompletedRows.current = completedRows;
        prevCompletedCols.current = completedCols;
    }, [completedRows, completedCols]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selected) return;
            const [r, c] = selected;

            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }

            if (e.key === "ArrowUp") onSelect([Math.max(0, r - 1), c]);
            else if (e.key === "ArrowDown") onSelect([Math.min(8, r + 1), c]);
            else if (e.key === "ArrowLeft") onSelect([r, Math.max(0, c - 1)]);
            else if (e.key === "ArrowRight") onSelect([r, Math.min(8, c + 1)]);

            if (e.key >= "1" && e.key <= "9") {
                const num = parseInt(e.key);
                if (isPencilMode) {
                    onNoteClick(r, c, num);
                } else {
                    onCellClick(r, c, num);
                }
            } else if (e.key === "Backspace" || e.key === "Delete") {
                onCellClick(r, c, null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selected, onCellClick, onSelect, isPencilMode, onNoteClick]);

    const handleCellSelect = (r: number, c: number) => onSelect([r, c]);

    return (
        <div className="grid grid-cols-9 border-2 md:border-4 border-gray-800 bg-white w-full max-w-xl aspect-square mx-auto overflow-hidden select-none">
            {board.map((row, r) =>
                row.map((val, c) => {
                    const isFlashing = flashingRows.has(r) || flashingCols.has(c);
                    return (
                        <Cell
                            key={`${r}-${c}`}
                            row={r}
                            col={c}
                            value={val}
                            isInitial={initialBoard[r][c] !== null}
                            isSelected={selected?.[0] === r && selected?.[1] === c}
                            isHighlighted={numberToHighlight !== null && val === numberToHighlight && !(selected?.[0] === r && selected?.[1] === c)}
                            hasMistake={mistakeCells.has(`${r},${c}`)}
                            onSelect={handleCellSelect}
                            notes={notes[r][c]}
                            isFlashing={isFlashing}
                        />
                    );
                })
            )}
        </div>
    );
}
