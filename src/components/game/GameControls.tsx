"use client";

interface GameControlsProps {
    onNumberClick: (num: number) => void;
    onClear: () => void;
    onUndo?: () => void; // Optional for now
    board: (number | null)[][];
    selectedNumber?: number | null;
}

export default function GameControls({ onNumberClick, onClear, board, selectedNumber }: GameControlsProps) {
    // Count occurrences of each number on the board
    const countNumber = (num: number): number => {
        let count = 0;
        for (const row of board) {
            for (const cell of row) {
                if (cell === num) count++;
            }
        }
        return count;
    };

    const isNumberComplete = (num: number): boolean => {
        return countNumber(num) >= 9;
    };

    return (
        <div className="flex flex-col gap-3 mt-8 max-w-xl mx-auto w-full">
            <div className="grid grid-cols-5 gap-3">
                {[1, 2, 3, 4, 5].map((num) => {
                    const isComplete = isNumberComplete(num);
                    const isSelected = selectedNumber === num;
                    return (
                        <button
                            key={num}
                            onClick={() => !isComplete && onNumberClick(num)}
                            disabled={isComplete}
                            className={`h-14 text-lg font-bold rounded-xl shadow-md transition-all duration-200 ${isComplete
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                                    : isSelected
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-300 dark:shadow-green-900/50 scale-105 ring-2 ring-green-400"
                                        : "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:scale-105"
                                }`}
                        >
                            {num}
                        </button>
                    );
                })}
            </div>
            <div className="grid grid-cols-5 gap-3">
                {[6, 7, 8, 9].map((num) => {
                    const isComplete = isNumberComplete(num);
                    const isSelected = selectedNumber === num;
                    return (
                        <button
                            key={num}
                            onClick={() => !isComplete && onNumberClick(num)}
                            disabled={isComplete}
                            className={`h-14 text-lg font-bold rounded-xl shadow-md transition-all duration-200 ${isComplete
                                    ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                                    : isSelected
                                        ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-300 dark:shadow-green-900/50 scale-105 ring-2 ring-green-400"
                                        : "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-lg hover:scale-105"
                                }`}
                        >
                            {num}
                        </button>
                    );
                })}
                <button
                    onClick={onClear}
                    className="h-14 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
                >
                    <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
