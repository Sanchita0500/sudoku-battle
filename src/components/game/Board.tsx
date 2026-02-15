"use client";

import { useEffect, useMemo } from "react";

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

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selected) return;
            const [r, c] = selected;

            // Prevent default scrolling for arrow keys
            if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
                e.preventDefault();
            }

            // Navigation
            if (e.key === "ArrowUp") onSelect([Math.max(0, r - 1), c]);
            else if (e.key === "ArrowDown") onSelect([Math.min(8, r + 1), c]);
            else if (e.key === "ArrowLeft") onSelect([r, Math.max(0, c - 1)]);
            else if (e.key === "ArrowRight") onSelect([r, Math.min(8, c + 1)]);

            // Input
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

    // Stable callback for cell selection
    const handleCellSelect = (r: number, c: number) => onSelect([r, c]);

    return (
        <div className="grid grid-cols-9 border-4 border-gray-800 bg-white w-full max-w-xl aspect-square mx-auto shadow-2xl rounded-xl overflow-hidden select-none">
            {board.map((row, r) =>
                row.map((val, c) => (
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
                    />
                ))
            )}
        </div>
    );
}
