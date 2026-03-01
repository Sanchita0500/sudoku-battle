"use client";


import { useEffect, useState } from "react";
import confetti from 'canvas-confetti';

import Board from "./Board";
import GameControls from "./GameControls";
import { useSinglePlayerStore } from "@/hooks/useSinglePlayerStore";
import { useGameLogic } from "@/hooks/useGameLogic";
import Timer from "./Timer";
import { GameStatus } from "@/lib/types";

import HelpModal from "./HelpModal";
import GameModal from "./GameModal";

interface SinglePlayerGameProps {
    difficulty: 'easy' | 'medium' | 'hard';
    date?: string; // If present, it's a daily challenge
    onExit: () => void;
}

import { useAutoFill } from "@/hooks/useAutoFill";

export default function SinglePlayerGame({ difficulty, date, onExit }: SinglePlayerGameProps) {
    const { board, initialBoard, setCellValue, status, mistakes, startTime, endTime, undo, history, resetGame, toggleNote, resetBoard, mistakeCells, notes, startGame, progress, solution } = useSinglePlayerStore();

    // Auto-fill Magic Hook
    const { activeAutoFillCell } = useAutoFill({
        progress,
        board,
        solution,
        setCellValue,
        status,
        mistakeCells,
        difficulty
    });

    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [showWinModal, setShowWinModal] = useState(false);
    const [showMonthTrophy, setShowMonthTrophy] = useState(false);

    const {
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
        handleBackgroundClick,
        resetSelection
    } = useGameLogic({
        board,
        initialBoard,
        status,
        setCellValue,
        toggleNote,
        mistakeCells
    });

    // Hydration check to prevent race conditions with persist
    const [isHydrated, setIsHydrated] = useState(false);

    useEffect(() => {
        // Check if already hydrated
        if (useSinglePlayerStore.persist.hasHydrated()) {
            setIsHydrated(true);
        } else {
            // Wait for hydration
            const unsub = useSinglePlayerStore.persist.onFinishHydration(() => setIsHydrated(true));
            return () => {
                // Clean up listener if component unmounts before hydration (rare)
                // onFinishHydration returns a cleanup function in recent versions?
                // If not, it's fine, it's a one-time event usually.
            };
        }
    }, []);

    // Reset game state on mount/unmount to prevent glitches
    useEffect(() => {
        if (!isHydrated) return;

        resetGame();
        resetSelection(); // clear any stale number highlights from previous game
        // Start game logic
        useSinglePlayerStore.getState().startGame(difficulty, date);
        return () => { resetGame(); resetSelection(); };
    }, [difficulty, date, isHydrated]); // Restart if difficulty changes or hydration finishes

    // Calculate duration for victory modal
    const gameDuration = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

    // Confetti + delayed win modal so last auto-fill cell renders before modal appears
    useEffect(() => {
        if (status === GameStatus.Won) {
            // Bug 1: track RAF id so we can cancel when user exits
            const duration = 3000;
            const end = Date.now() + duration;
            let rafId: number;
            let cancelled = false;
            const frame = () => {
                if (cancelled) return;
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308', '#22c55e'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308', '#22c55e'] });
                if (Date.now() < end) rafId = requestAnimationFrame(frame);
            };
            confetti({ particleCount: 150, spread: 100, origin: { y: 0.8 }, zIndex: 200 });
            frame();

            // Delay modal slightly so last auto-fill cell animation is visible
            const timer = setTimeout(() => setShowWinModal(true), 600);
            return () => { cancelled = true; cancelAnimationFrame(rafId); confetti.reset(); clearTimeout(timer); };
        } else {
            setShowWinModal(false);
        }
    }, [status]);

    const handleQuit = () => {
        setShowQuitConfirm(true);
    };

    const confirmQuit = () => {
        setShowQuitConfirm(false);
        confetti.reset();
        onExit();
    };

    const cancelQuit = () => {
        setShowQuitConfirm(false);
    };

    const handleTryAgain = () => {
        resetBoard();
        resetSelection();
    };

    const handlePlayAgain = () => {
        if (difficulty) {
            startGame(difficulty, date);
        }
        resetSelection();
    };

    // Save Daily Completion + Bug 5: detect end-of-month completion
    useEffect(() => {
        if (status === GameStatus.Won && date) {
            const saved = localStorage.getItem("daily_completed");
            const completed: string[] = saved ? JSON.parse(saved) : [];
            if (!completed.includes(date)) {
                completed.push(date);
                localStorage.setItem("daily_completed", JSON.stringify(completed));

                // Check if ALL days up to today in this month are now complete
                const d = new Date(date);
                const year = d.getFullYear();
                const month = d.getMonth();
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const lastPlayable = new Date(year, month + 1, 0); // last day of month
                const daysToCheck = lastPlayable.getDate();
                const allDone = Array.from({ length: daysToCheck }, (_, i) => {
                    const dt = new Date(year, month, i + 1);
                    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
                }).every(ds => completed.includes(ds));

                if (allDone) {
                    // Delay so win modal appears first, then trophy popup
                    setTimeout(() => setShowMonthTrophy(true), 900);
                }
            }
        }
    }, [status, date]);

    return (
        <div
            className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-0 md:p-8 font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden"
            onClick={handleBackgroundClick}
        >
            {/* Header Section */}
            <div className="w-full max-w-lg mb-2 md:mb-6">
                <div className="flex items-center justify-between mb-4">
                    <button
                        onClick={() => setShowQuitConfirm(true)}
                        className="flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 font-semibold text-xs md:text-sm shadow-sm transition-all duration-200 hover:shadow-md"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Home
                    </button>

                    <h1 className="text-xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
                        Sudoku Battle
                    </h1>

                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                        <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="font-semibold text-sm text-red-700 dark:text-red-300">{mistakes}/3</span>
                    </div>
                </div>

                {/* Game Information Bar */}
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-2 px-4 md:p-4 md:px-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800">
                    <div className="flex flex-col">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Mistakes</span>
                        <span className={`text-lg md:text-xl font-black ${mistakes >= 2 ? 'text-red-500' : 'text-gray-800 dark:text-gray-100'}`}>{mistakes}/3</span>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider mb-0.5 md:mb-1">Time</span>
                        <Timer startTime={startTime} className="text-xl md:text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight" />
                    </div>

                    <div className="flex flex-col items-end">
                        <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">Difficulty</span>
                        <span className="text-lg md:text-xl font-black text-gray-800 dark:text-gray-100 capitalize">
                            {date ? "Daily" : difficulty}
                        </span>
                    </div>
                </div>

                <div className="flex justify-end mb-2 md:mb-4">
                    <button
                        onClick={() => setShowHelp(true)}
                        className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        How to Play
                    </button>
                </div>
            </div>

            {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

            <main className="w-full flex flex-col items-center justify-center transform origin-top" onClick={(e) => e.stopPropagation()}>
                {/* Mobile Toolbar */}
                <div className="w-full max-w-xl flex items-center justify-end gap-3 mb-2 px-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setFastFillMode(!fastFillMode);
                        }}
                        className={`p-3 rounded-xl transition-all duration-200 shadow-sm border ${fastFillMode
                            ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/50 border-transparent"
                            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                            }`}
                        title={`Fast Fill: ${fastFillMode ? "ON" : "OFF"}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </button>

                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setPencilMode(!pencilMode);
                        }}
                        className={`p-3 rounded-xl transition-all duration-200 shadow-sm border ${pencilMode
                            ? "bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-indigo-200 dark:shadow-indigo-900/50 border-transparent"
                            : "bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700"
                            }`}
                        title={`Pencil Mode: ${pencilMode ? "ON" : "OFF"}`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </div>

                <div className="w-full md:max-w-full mx-auto">
                    <Board
                        selected={selected}
                        onSelect={(coords) => {
                            if (coords) handleCellClick(coords[0], coords[1]);
                            else setSelected(null);
                        }}
                        highlightedNumber={highlightedNumber}
                        isPencilMode={pencilMode}
                        board={board}
                        initialBoard={initialBoard}
                        mistakeCells={mistakeCells}
                        notes={notes}
                        onCellClick={setCellValue}
                        onNoteClick={toggleNote}
                        activeAutoFillCell={activeAutoFillCell}
                    />
                </div>
                <GameControls
                    board={board}
                    onNumberClick={handleNumberClick}
                    onReset={handleTryAgain}
                    selectedNumber={fastFillMode ? fastFillNumber : null}
                    onUndo={undo}
                    canUndo={history.length > 0}
                />
            </main>

            {/* Quit Confirmation Modal */}
            <GameModal
                isOpen={showQuitConfirm}
                onClose={cancelQuit}
                title="Quit Game?"
                description="Your progress will be lost. Are you sure?"
                type="default"
                icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                }
            >
                <div className="flex gap-3 justify-center w-full">
                    <button
                        onClick={confirmQuit}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl"
                    >
                        Yes, Quit
                    </button>
                    <button
                        onClick={cancelQuit}
                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </GameModal>


            {/* Month Trophy Popup (Bug 5) */}
            {showMonthTrophy && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowMonthTrophy(false)} />
                    <div className="relative bg-gradient-to-br from-yellow-400 to-amber-500 rounded-3xl p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300 max-w-xs w-full">
                        <div className="text-7xl mb-4">🏆</div>
                        <h2 className="text-2xl font-black text-white mb-2">Month Complete!</h2>
                        <p className="text-yellow-100 font-semibold text-sm mb-6">You've completed every puzzle this month. Incredible!</p>
                        <button
                            onClick={() => setShowMonthTrophy(false)}
                            className="w-full py-3 bg-white text-amber-600 rounded-xl font-black text-lg hover:bg-yellow-50 transition-colors shadow-lg"
                        >
                            Claim Trophy 🎉
                        </button>
                    </div>
                </div>
            )}

            {/* Win Modal */}
            <GameModal
                isOpen={showWinModal}
                type="won"
                time={gameDuration}
                difficulty={difficulty}
            >
                <div className="flex gap-3 justify-center w-full">
                    <button
                        onClick={() => { confetti.reset(); onExit(); }}
                        className="flex-1 px-4 py-3 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold transition-colors shadow-lg"
                    >
                        Claim Victory
                    </button>
                    <button
                        onClick={handlePlayAgain}
                        className="flex-1 px-4 py-3 bg-white text-yellow-600 hover:bg-yellow-50 rounded-xl font-bold transition-colors shadow-lg"
                    >
                        Play Again
                    </button>
                </div>
            </GameModal>

            {/* Game Over Modal */}
            <GameModal
                isOpen={status === GameStatus.Lost}
                title="Game Over"
                description="You made 3 mistakes. Don't give up!"
                type="danger"
                icon={
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                }
            >
                <div className="flex gap-3 justify-center w-full">
                    <button
                        onClick={handleTryAgain}
                        className="flex-1 px-6 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
                    >
                        Try Again
                    </button>
                    <button
                        onClick={onExit}
                        className="flex-1 px-6 py-4 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-colors"
                    >
                        Home
                    </button>
                </div>
            </GameModal>
        </div>
    );
}
