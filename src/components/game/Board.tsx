"use client";

import { useEffect } from "react";
import { useGameStore } from "@/hooks/useGameStore";
import Cell from "./Cell";

interface BoardProps {
    selected: [number, number] | null;
    onSelect: (coords: [number, number] | null) => void;
    highlightedNumber?: number | null;
    isPencilMode?: boolean;
}

export default function Board({ selected, onSelect, highlightedNumber, isPencilMode = false }: BoardProps) {
    const { board, initialBoard, setCellValue, notes, toggleNote } = useGameStore();

    // Get the value of the selected cell for highlighting
    const selectedValue = selected ? board[selected[0]][selected[1]] : null;

    // Determine which number to highlight: either from selected cell or from number pad
    const numberToHighlight = highlightedNumber !== undefined ? highlightedNumber : selectedValue;

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
                    toggleNote(r, c, num);
                } else {
                    setCellValue(r, c, num);
                }
            } else if (e.key === "Backspace" || e.key === "Delete") {
                setCellValue(r, c, null);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [selected, setCellValue, onSelect, isPencilMode, toggleNote]);

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
                        onClick={() => onSelect([r, c])}
                        notes={notes[r][c]}
                    />
                ))
            )}
        </div>
    );
}
