"use client";

import { useEffect, useState } from "react";
import Board from "./Board";
import GameControls from "./GameControls";
import { useGameStore } from "@/hooks/useGameStore";
import Timer from "./Timer";

interface SinglePlayerGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onExit: () => void;
}

export default function SinglePlayerGame({ difficulty, onExit }: SinglePlayerGameProps) {
    const { board, startGame, setCellValue, resetBoard, status, mistakes } = useGameStore();
    const [selected, setSelected] = useState<[number, number] | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
    const [fastPencilMode, setFastPencilMode] = useState(false);
    const [fastPencilNumber, setFastPencilNumber] = useState<number | null>(null);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    useEffect(() => {
        // Always start a fresh game when component mounts
        startGame(difficulty);
        setStartTime(Date.now());
    }, [difficulty]); // Only depend on difficulty

    const handleNumberClick = (num: number) => {
        // Always remember the selected number for fast pencil mode
        setFastPencilNumber(num);
        setHighlightedNumber(num);
        // Clear cell selection when selecting from number pad
        setSelected(null);

        if (!fastPencilMode) {
            // Normal mode: fill selected cell if one was selected
            if (selected) {
                setCellValue(selected[0], selected[1], num);
            }
        }
    };

    const handleCellClick = (row: number, col: number) => {
        setSelected([row, col]);

        if (fastPencilMode && fastPencilNumber !== null) {
            // In fast pencil mode, clicking a cell fills it with the selected number
            setCellValue(row, col, fastPencilNumber);
            // Keep highlighting the selected number from pad
            // Don't change highlightedNumber
        } else {
            // In normal mode OR fast pencil without number selected,
            // update highlighted number based on clicked cell
            const cellValue = board[row][col];
            setHighlightedNumber(cellValue);
        }
    };

    const handleClear = () => {
        if (selected) {
            setCellValue(selected[0], selected[1], null);
        }
    };

    const handleQuit = () => {
        setShowQuitConfirm(true);
    };

    const confirmQuit = () => {
        setShowQuitConfirm(false);
        onExit();
    };

    const cancelQuit = () => {
        setShowQuitConfirm(false);
    };

    const handleTryAgain = () => {
        // Reset the same board instead of generating a new one
        resetBoard();
        setStartTime(Date.now());
        setSelected(null);
        setHighlightedNumber(null);
        setFastPencilNumber(null);
    };

    const handlePlayAgain = () => {
        // Generate a new puzzle
        startGame(difficulty);
        setStartTime(Date.now());
        setSelected(null);
        setHighlightedNumber(null);
        setFastPencilNumber(null);
    };

    const handleBackgroundClick = () => {
        // Deselect cell when clicking outside the board/controls
        setSelected(null);
    };

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-6 font-sans text-gray-900 dark:text-gray-100"
            onClick={handleBackgroundClick}
        >
            {/* Header Section */}
            <div className="w-full max-w-2xl mb-8">
                <div className="flex items-center justify-between mb-6">
                    <button
                        onClick={handleQuit}
                        className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 font-semibold text-sm shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Home
                    </button>

                    <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Sudoku Battle
                    </h1>

                    <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-red-700 dark:text-red-300">{mistakes}/3</span>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center justify-between px-6 py-4 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-3">
                        <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <Timer startTime={startTime} className="text-2xl font-mono font-bold text-gray-800 dark:text-gray-200" />
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFastPencilMode(!fastPencilMode);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 shadow-sm ${fastPencilMode
                                    ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/50"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Fast Pencil {fastPencilMode ? "ON" : "OFF"}
                        </button>
                        {fastPencilMode && fastPencilNumber && (
                            <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                                <span className="text-xs font-medium text-green-700 dark:text-green-300">Selected:</span>
                                <span className="text-sm font-bold text-green-800 dark:text-green-200">{fastPencilNumber}</span>
                            </div>
                        )}
                    </div>

                    <div className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                        <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300 capitalize">{difficulty}</span>
                    </div>
                </div>
            </div>

            <main className="w-full flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
                <Board
                    selected={selected}
                    onSelect={(coords) => {
                        if (coords) {
                            handleCellClick(coords[0], coords[1]);
                        } else {
                            setSelected(null);
                        }
                    }}
                    highlightedNumber={highlightedNumber}
                />
                <GameControls
                    board={board}
                    onNumberClick={handleNumberClick}
                    onClear={handleClear}
                    selectedNumber={fastPencilMode ? fastPencilNumber : null}
                />
            </main>

            {/* Quit Confirmation Modal */}
            {showQuitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center max-w-md mx-4 transform transition-all">
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold mb-3 text-gray-900 dark:text-gray-100">Quit Game?</h2>
                        <p className="mb-6 text-gray-600 dark:text-gray-400">
                            Your progress will be lost. Are you sure?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={confirmQuit}
                                className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold transition-colors shadow-lg hover:shadow-xl"
                            >
                                Yes, Quit
                            </button>
                            <button
                                onClick={cancelQuit}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Win Modal */}
            {status === 'won' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center max-w-md mx-4">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 dark:from-green-400 dark:to-emerald-400 bg-clip-text text-transparent">
                            You Won!
                        </h2>
                        <p className="mb-8 text-gray-600 dark:text-gray-400">
                            Congratulations on completing the {difficulty} puzzle!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handlePlayAgain}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                Play Again
                            </button>
                            <button
                                onClick={onExit}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-colors"
                            >
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Modal */}
            {status === 'lost' && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={(e) => e.stopPropagation()}>
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 text-center max-w-md mx-4">
                        <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-bold mb-3 text-red-600 dark:text-red-400">Game Over!</h2>
                        <p className="mb-8 text-gray-600 dark:text-gray-400">
                            You made 3 mistakes. Better luck next time!
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleTryAgain}
                                className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onExit}
                                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-semibold transition-colors"
                            >
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
