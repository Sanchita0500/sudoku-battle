"use client";


import { useEffect, useState } from "react";
import confetti from 'canvas-confetti';

import Board from "./Board";
import GameControls from "./GameControls";
import { useGameStore } from "@/hooks/useGameStore";
import Timer from "./Timer";

interface SinglePlayerGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    onExit: () => void;
}

export default function SinglePlayerGame({ difficulty, onExit }: SinglePlayerGameProps) {
    const { board, startGame, setCellValue, resetBoard, status, mistakes, toggleNote, history, undo } = useGameStore();
    const [selected, setSelected] = useState<[number, number] | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
    const [fastFillMode, setFastFillMode] = useState(false);
    const [fastFillNumber, setFastFillNumber] = useState<number | null>(null);
    const [pencilMode, setPencilMode] = useState(false);
    const [startTime, setStartTime] = useState<number | null>(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);

    useEffect(() => {
        // Always start a fresh game when component mounts
        startGame(difficulty);
        setStartTime(Date.now());
    }, [difficulty]); // Only depend on difficulty

    const handleNumberClick = (num: number) => {
        // Always remember the selected number for fast fill mode
        setFastFillNumber(num);
        if (fastFillMode) {
            setHighlightedNumber(num);
        }

        // Clear cell selection when selecting from number pad
        setSelected(null);

        if (!fastFillMode) {
            // Normal mode: check if selected, then set value or note
            // But wait, if I select from pad, 'selected' becomes null?
            // "Clear cell selection when selecting from number pad" -> This line 37 in original file.
            // If I click a number on pad, I usually want to fill the *currently selected cell*?
            // The original logic was: setHighlightedNumber(num); setSelected(null);
            // And then: if (!fastPencilMode) { if(selected) setCellValue... }
            // But if we set Selected(null) before, then selected is null?
            // Ah, standard state update batching? No.
            // Original code:
            // setFastPencilNumber(num);
            // setHighlightedNumber(num);
            // setSelected(null);
            // if (!fastPencilMode && selected) { ... }
            // This relies on closure 'selected' being the *old* value before re-render? Yes.

            if (selected) {
                if (pencilMode) {
                    toggleNote(selected[0], selected[1], num);
                } else {
                    setCellValue(selected[0], selected[1], num);
                }
            }
        }
    };

    const handleCellClick = (row: number, col: number) => {
        setSelected([row, col]);

        const cellValue = board[row][col];
        if (cellValue !== null) {
            setHighlightedNumber(cellValue);
            if (fastFillMode) {
                setFastFillNumber(cellValue);
            }
        }

        if (fastFillMode && fastFillNumber !== null && cellValue === null) {
            // In fast fill mode, clicking an empty cell fills it with the selected number
            if (pencilMode) {
                toggleNote(row, col, fastFillNumber);
            } else {
                setCellValue(row, col, fastFillNumber);
            }
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
        setFastFillNumber(null);
    };

    const handlePlayAgain = () => {
        // Generate a new puzzle
        startGame(difficulty);
        setStartTime(Date.now());
        setSelected(null);
        setHighlightedNumber(null);
        setFastFillNumber(null);
    };

    const handleBackgroundClick = () => {
        // Deselect cell when clicking outside the board/controls
        setSelected(null);
    };

    return (
        <div
            className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-4 md:p-6 font-sans text-gray-900 dark:text-gray-100"
            onClick={handleBackgroundClick}
        >
            {/* Header Section */}
            <div className="w-full max-w-lg mb-4 md:mb-6">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={handleQuit}
                        className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-750 font-semibold text-xs md:text-sm shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Home
                    </button>

                    <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Sudoku Battle
                    </h1>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm text-red-700 dark:text-red-300">{mistakes}/3</span>
                    </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <Timer startTime={startTime} className="text-xl font-mono font-bold text-gray-800 dark:text-gray-200" />
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFastFillMode(!fastFillMode);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 shadow-sm ${fastFillMode
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/50"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Fast Fill {fastFillMode ? "ON" : "OFF"}
                        </button>

                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setPencilMode(!pencilMode);
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[10px] uppercase tracking-wider transition-all duration-200 shadow-sm ${pencilMode
                                ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-200 dark:shadow-indigo-900/50"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600"
                                }`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Pencil {pencilMode ? "ON" : "OFF"}
                        </button>
                    </div>

                    <div className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg">
                        <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300 capitalize">{difficulty}</span>
                    </div>
                </div>
            </div>

            <main className="w-full flex flex-col items-center justify-center transform scale-95 md:scale-100" onClick={(e) => e.stopPropagation()}>
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
                    isPencilMode={pencilMode}
                />
                <GameControls
                    board={board}
                    onNumberClick={handleNumberClick}
                    onClear={handleClear}
                    selectedNumber={fastFillMode ? fastFillNumber : null}
                    onUndo={undo}
                    canUndo={history.length > 0}
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
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden"
                        ref={() => {
                            // Trigger confetti on mount
                            confetti({
                                particleCount: 150,
                                spread: 100,
                                origin: { y: 0.8 },
                                zIndex: 200
                            });
                        }}
                    >
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-green-500/30 rounded-full blur-3xl -z-10"></div>

                        <div className="w-24 h-24 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-green-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                            <div className="relative w-full h-full bg-gradient-to-br from-green-400 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-green-500/30 rotate-[-5deg]">
                                <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-emerald-100 to-green-300 tracking-tight drop-shadow-sm">
                            SOLVED!
                        </h2>
                        <p className="text-green-100/90 mb-8 font-medium text-lg tracking-wide uppercase text-[10px] md:text-sm">
                            Difficulty: {difficulty} • Outstanding
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handlePlayAgain}
                                className="px-6 py-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex-1"
                            >
                                Play Again
                            </button>
                            <button
                                onClick={onExit}
                                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex-1"
                            >
                                Home
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Modal */}
            {status === 'lost' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-red-500/30 rounded-full blur-3xl -z-10"></div>

                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20 rotate-12">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">Game Over</h2>
                        <p className="text-gray-300 mb-8 font-medium text-lg leading-relaxed">
                            You made 3 mistakes. Don't give up!
                        </p>

                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={handleTryAgain}
                                className="px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 flex-1"
                            >
                                Try Again
                            </button>
                            <button
                                onClick={onExit}
                                className="px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors flex-1"
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
