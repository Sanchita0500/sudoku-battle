"use client";

import { useEffect, useState, useMemo } from "react";
import confetti from 'canvas-confetti';
import Board from "./Board";
import GameControls from "./GameControls";
import { useGameStore } from "@/hooks/useGameStore";
import { useAuth } from "@/context/AuthContext";
import { useRoomListener } from "@/hooks/useRoomListener";
import { ref, update, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { countEmptyCells } from "@/lib/utils";
import Timer from "./Timer";
import { startGame as fireStartGame, Player, Room } from "@/lib/rooms";

interface MultiplayerGameProps {
    roomId: string;
    onExit: () => void;
}

export default function MultiplayerGame({ roomId, onExit }: MultiplayerGameProps) {
    const { user } = useAuth();
    const { board, setCellValue, status, mistakes, difficulty, players, roomStatus, startTime, undo, history, resetGame } = useGameStore();


    const [selected, setSelected] = useState<[number, number] | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
    const [fastPencilMode, setFastPencilMode] = useState(false);
    const [fastPencilNumber, setFastPencilNumber] = useState<number | null>(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [canCheckVictory, setCanCheckVictory] = useState(false);

    // Reset game state on mount/unmount to prevent glitches
    useEffect(() => {
        resetGame();
        return () => resetGame();
    }, []);

    // Sync with Firebase
    useRoomListener(roomId);

    // Safety delay to prevent early victory trigger due to clock skew or race conditions
    useEffect(() => {
        if (status === 'playing' && roomStatus === 'playing') {
            const timer = setTimeout(() => {
                setCanCheckVictory(true);
            }, 3000); // 3 seconds grace period

            return () => clearTimeout(timer);
        } else {
            setCanCheckVictory(false);
        }
    }, [status, roomStatus]);

    // Automatic Victory Logic: If you are the only one left 'playing'
    useEffect(() => {
        if (!user || status !== 'playing' || roomStatus !== 'playing') return;

        // Wait for safety delay
        if (!canCheckVictory) return;

        const otherPlayers = Object.values(players).filter(p => p.id !== user.uid);
        if (otherPlayers.length > 0) {
            const anyoneElsePlaying = otherPlayers.some(p => p.status === 'playing');
            if (!anyoneElsePlaying) {
                // You are the last one standing!
                const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
                const roomRef = ref(db, `rooms/${roomId}`);
                update(playerRef, { status: "won" });
                update(roomRef, { status: "finished" });
            }
        }
    }, [players, status, user, roomId, roomStatus, canCheckVictory]);

    // Game Over if room is finished and you didn't win
    useEffect(() => {
        if (roomStatus === 'finished' && status === 'playing' && user) {
            const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
            update(playerRef, { status: "lost" });
        }
    }, [roomStatus, status, user, roomId]);

    // Victory Confetti
    useEffect(() => {
        if (status === 'won') {
            // Blow up from the bottom
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 5,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308', '#22c55e']
                });
                confetti({
                    particleCount: 5,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#6366f1', '#a855f7', '#ec4899', '#eab308', '#22c55e']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };

            // Initial burst
            confetti({
                particleCount: 150,
                spread: 100,
                origin: { y: 0.8 },
                zIndex: 200
            });

            frame();
        }
    }, [status]);

    // Effect to update player progress & mistakes & status in Firebase
    useEffect(() => {
        if (!user || !roomId || status === 'idle') return;

        const progress = countEmptyCells(board);
        const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
        const roomRef = ref(db, `rooms/${roomId}`);

        const updates: { progress: number; mistakes: number; status: string; completed?: boolean } = {
            progress,
            mistakes,
            status
        };

        if (progress === 0 && mistakes < 3) {
            updates.completed = true;
            updates.status = "won";
            // If you win by completion, the whole room is finished
            update(roomRef, { status: "finished" });
        } else if (mistakes >= 3) {
            updates.status = "lost";
        }

        update(playerRef, updates);

    }, [board, mistakes, status, user, roomId]);

    const handleNumberClick = (num: number) => {
        if (status === 'won' || status === 'lost') return;
        setFastPencilNumber(num);
        setHighlightedNumber(num);
        setSelected(null);

        if (!fastPencilMode && selected) {
            setCellValue(selected[0], selected[1], num);
        }
    };

    const handleCellClick = (row: number, col: number) => {
        if (status === 'won' || status === 'lost') return;
        setSelected([row, col]);

        const cellValue = board[row][col];
        if (cellValue !== null) {
            setHighlightedNumber(cellValue);
            if (fastPencilMode) {
                setFastPencilNumber(cellValue);
            }
        }

        if (fastPencilMode && fastPencilNumber !== null && cellValue === null) {
            setCellValue(row, col, fastPencilNumber);
        }
    };

    const handleClear = () => {
        if (status === 'won' || status === 'lost') return;
        if (selected) {
            setCellValue(selected[0], selected[1], null);
        }
    };

    const handleStartGame = async () => {
        try {
            await fireStartGame(roomId);
        } catch (err) {
            console.error(err);
        }
    };

    // Identified sorted players by progress
    const sortedPlayers = useMemo(() => {
        return Object.values(players).sort((a, b) => a.progress - b.progress);
    }, [players]);

    const isHost = user && Object.keys(players)[0] === user.uid;
    const gameStarted = roomStatus !== 'waiting';

    // Check if battle is still ongoing for the loser
    const isBattleOngoing = useMemo(() => {
        return Object.values(players).some(p => p.status === 'playing');
    }, [players]);

    if (!gameStarted) {
        return (
            <div className="flex flex-col items-center justify-center min-vh-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-6 min-h-screen">
                <div className="w-full max-w-xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl p-10 border border-gray-100 dark:border-gray-700 animate-slide-up">
                    <div className="flex flex-col items-center text-center space-y-6">
                        <div className="px-6 py-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-full text-xs font-black tracking-widest uppercase">
                            Waiting for Players
                        </div>

                        <h1 className="text-4xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Room: <span className="text-indigo-600 font-mono tracking-wider">{roomId}</span></h1>

                        <div className="w-full space-y-3">
                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest pl-1 text-left">Joined Players</p>
                            <div className="grid grid-cols-1 gap-3">
                                {Object.values(players).map((player) => (
                                    <div key={player.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl border-2 border-gray-100 dark:border-gray-700">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-black">
                                                {player.name[0].toUpperCase()}
                                            </div>
                                            <span className="font-bold text-gray-900 dark:text-gray-100">{player.name} {player.id === user?.uid && "(You)"}</span>
                                        </div>
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-sm shadow-green-500/50"></div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="w-full pt-4 space-y-4">
                            {isHost ? (
                                <button
                                    onClick={handleStartGame}
                                    disabled={Object.keys(players).length < 2}
                                    className="w-full py-5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-[1.5rem] font-black text-xl hover:scale-[1.02] active:scale-95 transition-all shadow-xl shadow-green-500/20 disabled:opacity-50 disabled:grayscale"
                                >
                                    START BATTLE
                                </button>
                            ) : (
                                <div className="text-gray-500 font-bold animate-pulse">Waiting for host to start...</div>
                            )}

                            <button onClick={onExit} className="text-sm font-black text-red-500 uppercase tracking-widest hover:text-red-600 transition-colors">
                                Leave Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 p-4 md:p-8 font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden">
            {/* Battle Status Header */}
            <div className="w-full max-w-6xl mb-8 space-y-6">
                <div className="flex flex-wrap gap-4 items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setShowQuitConfirm(true)}
                            className="p-3 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm hover:scale-105 active:scale-95 transition-all"
                        >
                            <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="text-xl md:text-3xl font-black tracking-tight">Battle: <span className="font-mono text-indigo-600">{roomId}</span></h1>
                    </div>

                    <Timer startTime={startTime} className="text-2xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-4 md:px-8 py-2 md:py-3 rounded-2xl md:rounded-3xl border border-white/20 shadow-lg" />

                    <div className="flex items-center gap-2 md:gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFastPencilMode(!fastPencilMode);
                            }}
                            className={`flex items-center gap-2 px-3 md:px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-sm ${fastPencilMode
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/50"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border border-gray-100 dark:border-gray-700"
                                }`}
                            title={fastPencilMode ? "Fast Pencil ON" : "Fast Pencil OFF"}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            <span className="hidden md:inline">Fast Pencil {fastPencilMode ? "ON" : "OFF"}</span>
                        </button>

                        <div className="px-3 md:px-5 py-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm font-black text-indigo-500 tracking-widest uppercase text-[10px] md:text-xs">
                            {difficulty}
                        </div>
                    </div>
                </div>

                {/* Player Progress Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {sortedPlayers.map((player) => (
                        <div key={player.id} className={`p-4 rounded-[1.5rem] shadow-sm border transition-all ${player.id === user?.uid
                            ? "bg-indigo-600 text-white border-indigo-500 scale-105"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-100 dark:border-gray-700"
                            }`}>
                            <div className="flex justify-between items-start mb-2">
                                <span className="font-black truncate max-w-[100px]">{player.name}</span>
                                <span className={`text-[10px] font-black uppercase tracking-tighter px-2 py-0.5 rounded-full ${player.status === 'lost' ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                    }`}>
                                    {player.status === 'playing' ? "Battle" : player.status}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black">{player.progress}</span>
                                <span className="text-[10px] font-bold opacity-70">left</span>
                            </div>
                            <div className="mt-2 text-[10px] font-black opacity-80 uppercase tracking-widest">
                                Mistakes: {player.mistakes}/3
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <main className="w-full flex flex-col md:flex-row gap-8 items-center md:items-start justify-center" onClick={() => setSelected(null)}>
                <div className="flex flex-col items-center flex-1 max-w-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
                    <Board
                        selected={selected}
                        onSelect={(coords) => {
                            if (coords) handleCellClick(coords[0], coords[1]);
                            else setSelected(null);
                        }}
                        highlightedNumber={highlightedNumber}
                    />
                    <GameControls
                        board={board}
                        onNumberClick={handleNumberClick}
                        onClear={handleClear}
                        selectedNumber={fastPencilMode ? fastPencilNumber : null}
                    />
                </div>
            </main>

            {/* Quit Confirmation Modal */}
            {showQuitConfirm && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[110]" onClick={() => setShowQuitConfirm(false)}>
                    <div className="bg-white dark:bg-gray-800 p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-gray-700 text-center max-w-md mx-4 transform transition-all animate-pop-in" onClick={e => e.stopPropagation()}>
                        <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4 border-2 border-amber-500">
                            <svg className="w-8 h-8 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        </div>
                        <h2 className="text-3xl font-black mb-3 text-gray-900 dark:text-gray-100">Leave Battle?</h2>
                        <p className="mb-8 text-gray-500 dark:text-gray-400 font-bold">
                            Leaving now will forfeit your position in this battle. Are you sure?
                        </p>
                        <div className="flex gap-3 justify-center">
                            <button
                                onClick={onExit}
                                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black transition-all shadow-lg shadow-red-500/20"
                            >
                                YES, LEAVE
                            </button>
                            <button
                                onClick={() => setShowQuitConfirm(false)}
                                className="px-8 py-4 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl font-black transition-all"
                            >
                                STAY
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Game Over Overlays */}
            {status === 'lost' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-32 bg-red-500/30 rounded-full blur-3xl -z-10"></div>

                        <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/20 rotate-12">
                            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>

                        <h2 className="text-3xl md:text-4xl font-black mb-3 text-white tracking-tight">Knocked Out</h2>
                        <p className="text-gray-300 mb-8 font-medium text-lg leading-relaxed">
                            {isBattleOngoing
                                ? "You've made 3 mistakes. You can still spectate the ongoing battle."
                                : "The battle has ended. Better luck in the next round!"}
                        </p>

                        <button
                            onClick={onExit}
                            className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                        >
                            Leave Battle
                        </button>
                    </div>
                </div>
            )}

            {status === 'won' && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 backdrop-blur-md p-6 animate-fade-in">
                    <div className="w-full max-w-md bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] p-8 md:p-12 text-center shadow-2xl relative overflow-hidden">
                        {/* Ambient Glow */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-40 bg-yellow-500/30 rounded-full blur-3xl -z-10"></div>

                        <div className="w-24 h-24 mx-auto mb-6 relative">
                            <div className="absolute inset-0 bg-yellow-400 rounded-full blur-xl opacity-40 animate-pulse"></div>
                            <div className="relative w-full h-full bg-gradient-to-br from-yellow-400 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-yellow-500/30 rotate-[-10deg]">
                                <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                            </div>
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black mb-2 text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-yellow-100 to-yellow-300 tracking-tight drop-shadow-sm">
                            VICTORY
                        </h2>
                        <p className="text-yellow-100/90 mb-8 font-medium text-lg tracking-wide uppercase text-[10px] md:text-sm">
                            First Place • Undisputed Champion
                        </p>

                        <button
                            onClick={onExit}
                            className="w-full py-4 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-xl font-black text-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-orange-500/20"
                        >
                            CLAIM VICTORY
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
