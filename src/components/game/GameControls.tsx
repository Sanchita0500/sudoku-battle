"use client";

interface GameControlsProps {
    onNumberClick: (num: number) => void;
    onClear: () => void;
    onUndo?: () => void;
    canUndo?: boolean;
    board: (number | null)[][];
    selectedNumber?: number | null;
}

export default function GameControls({ onNumberClick, onClear, onUndo, canUndo, board, selectedNumber }: GameControlsProps) {
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
        <div className="flex flex-col gap-2 md:gap-3 mt-4 md:mt-8 max-w-xl mx-auto w-full px-2 md:px-0">
            <div className="grid grid-cols-5 gap-2 md:gap-3">
                {[1, 2, 3, 4, 5].map((num) => {
                    const isComplete = isNumberComplete(num);
                    const isSelected = selectedNumber === num;
                    return (
                        <button
                            key={num}
                            onClick={() => !isComplete && onNumberClick(num)}
                            disabled={isComplete}
                            className={`h-12 md:h-14 text-lg font-bold rounded-xl shadow-md transition-all duration-200 ${isComplete
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
            <div className="grid grid-cols-5 gap-2 md:gap-3">
                {[6, 7, 8, 9].map((num) => {
                    const isComplete = isNumberComplete(num);
                    const isSelected = selectedNumber === num;
                    return (
                        <button
                            key={num}
                            onClick={() => !isComplete && onNumberClick(num)}
                            disabled={isComplete}
                            className={`h-10 md:h-12 text-base md:text-lg font-bold rounded-xl shadow-sm transition-all duration-200 ${isComplete
                                ? "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed opacity-50"
                                : isSelected
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-300 dark:shadow-green-900/50 scale-105 ring-2 ring-green-400"
                                    : "bg-white dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-100 border-2 border-gray-200 dark:border-gray-600 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md hover:scale-105"
                                }`}
                        >
                            {num}
                        </button>
                    );
                })}
                <div className="flex gap-1 h-10 md:h-12">
                    <button
                        onClick={onUndo}
                        disabled={!onUndo || !canUndo}
                        className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold rounded-l-xl shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-r border-gray-300 dark:border-gray-600"
                        title="Undo"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={onClear}
                        className="flex-1 bg-gradient-to-br from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white font-bold rounded-r-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center justify-center"
                        title="Clear Cell"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
