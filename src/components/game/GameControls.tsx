"use client";

interface GameControlsProps {
    onNumberClick: (num: number) => void;
    onReset: () => void; // Changed from onClear
    onClear?: () => void; // Keep for valid prop passing if needed, but we focus on Reset
    onUndo?: () => void;
    canUndo?: boolean;
    board: (number | null)[][];
    selectedNumber?: number | null;
}

export default function GameControls({ onNumberClick, onReset, onUndo, canUndo, board, selectedNumber }: GameControlsProps) {
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

    const getRemainingCount = (num: number): number => {
        return 9 - countNumber(num);
    };

    return (
        <div className="flex flex-col gap-1.5 md:gap-3 mt-1 md:mt-8 max-w-xl mx-auto w-full px-2 md:px-0">
            <div className="grid grid-cols-5 gap-1.5 md:gap-3">
                {[1, 2, 3, 4, 5].map((num) => {
                    const isComplete = isNumberComplete(num);
                    const isSelected = selectedNumber === num;
                    const remaining = getRemainingCount(num);
                    return (
                        <button
                            key={num}
                            onClick={() => !isComplete && onNumberClick(num)}
                            disabled={isComplete}
                            className={`relative h-11 md:h-14 text-lg font-bold rounded-xl shadow-md transition-all duration-200 ${isComplete
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                                : isSelected
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg shadow-green-300 scale-105 ring-2 ring-green-400"
                                    : "bg-white hover:bg-indigo-50 text-gray-800 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-lg hover:scale-105"
                                }`}
                        >
                            {num}
                            {!isComplete && remaining > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                                    {remaining}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
            <div className="grid grid-cols-5 gap-1.5 md:gap-3">
                {[6, 7, 8, 9].map((num) => {
                    const isComplete = isNumberComplete(num);
                    const isSelected = selectedNumber === num;
                    const remaining = getRemainingCount(num);
                    return (
                        <button
                            key={num}
                            onClick={() => !isComplete && onNumberClick(num)}
                            disabled={isComplete}
                            className={`relative h-10 md:h-12 text-base md:text-lg font-bold rounded-xl shadow-sm transition-all duration-200 ${isComplete
                                ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                                : isSelected
                                    ? "bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-green-300 scale-105 ring-2 ring-green-400"
                                    : "bg-white hover:bg-indigo-50 text-gray-800 border-2 border-gray-200 hover:border-indigo-300 hover:shadow-md hover:scale-105"
                                }`}
                        >
                            {num}
                            {!isComplete && remaining > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md">
                                    {remaining}
                                </span>
                            )}
                        </button>
                    );
                })}
                <div className="flex gap-1 h-10 md:h-12">
                    <button
                        onClick={onUndo}
                        disabled={!onUndo || !canUndo}
                        className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-l-xl shadow-sm transition-all duration-200 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center border-r border-gray-300"
                        title="Undo"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                        </svg>
                    </button>
                    <button
                        onClick={onReset}
                        className="flex-1 bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold rounded-r-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105 flex items-center justify-center"
                        title="Reset Board"
                    >
                        <svg className="w-4 h-4 md:w-5 md:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
}
