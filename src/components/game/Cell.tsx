import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

interface CellProps {
    value: number | null;
    onClick: () => void;
    isSelected?: boolean;
    isInitial?: boolean;
    isHighlighted?: boolean;
    row: number;
    col: number;
    notes?: number[];
}

function Cell({ value, onClick, isSelected, isInitial, isHighlighted, row, col, notes }: CellProps) {
    return (
        <div
            onClick={onClick}
            className={twMerge(
                "relative w-full h-full flex items-center justify-center text-xl md:text-2xl font-bold cursor-pointer select-none transition-all duration-150 border border-gray-300 dark:border-gray-700",
                // Grid Borders (Thick borders for 3x3 boxes)
                col % 3 === 2 && col !== 8 && "border-r-[3px] border-r-gray-800 dark:border-r-gray-300",
                row % 3 === 2 && row !== 8 && "border-b-[3px] border-b-gray-800 dark:border-b-gray-300",
                // Selection
                isSelected && "bg-indigo-200 dark:bg-indigo-900/50 ring-2 ring-inset ring-indigo-500 dark:ring-indigo-400",
                // Highlight matching numbers
                !isSelected && isHighlighted && "bg-amber-100 dark:bg-amber-900/30",
                // Initial Value
                isInitial ? "text-gray-900 dark:text-gray-100 font-extrabold" : "text-indigo-600 dark:text-indigo-400 font-bold",
                // Hover
                !isSelected && "hover:bg-gray-100 dark:hover:bg-gray-800/50"
            )}
        >
            {value !== null ? (
                value
            ) : (
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <div key={num} className="flex items-center justify-center text-[8px] md:text-[10px] font-medium text-gray-500 dark:text-gray-400">
                            {notes?.includes(num) ? num : ''}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Custom comparison function for React.memo to handle notes array prop
function arePropsEqual(prevProps: CellProps, nextProps: CellProps) {
    // Check all primitive props
    if (
        prevProps.value !== nextProps.value ||
        prevProps.isSelected !== nextProps.isSelected ||
        prevProps.isInitial !== nextProps.isInitial ||
        prevProps.isHighlighted !== nextProps.isHighlighted ||
        prevProps.row !== nextProps.row ||
        prevProps.col !== nextProps.col
    ) {
        return false;
    }

    // Deep compare notes array
    const prevNotes = prevProps.notes || [];
    const nextNotes = nextProps.notes || [];

    if (prevNotes.length !== nextNotes.length) {
        return false;
    }

    for (let i = 0; i < prevNotes.length; i++) {
        if (prevNotes[i] !== nextNotes[i]) {
            return false;
        }
    }

    return true;
}

export default React.memo(Cell, arePropsEqual);
