"use client";

import { useEffect, useState, useMemo } from "react";
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
    const { board, setCellValue, status, mistakes, difficulty, players, roomStatus, startTime } = useGameStore();
    const [selected, setSelected] = useState<[number, number] | null>(null);
    const [highlightedNumber, setHighlightedNumber] = useState<number | null>(null);
    const [fastPencilMode, setFastPencilMode] = useState(false);
    const [fastPencilNumber, setFastPencilNumber] = useState<number | null>(null);
    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [showConfetti, setShowConfetti] = useState(false);

    // Sync with Firebase
    useRoomListener(roomId);

    // Automatic Victory Logic: If you are the only one left 'playing'
    // Safety: Only check after game has started and been running for at least 2 seconds to avoid race conditions
    useEffect(() => {
        if (!user || status !== 'playing' || roomStatus !== 'playing') return;

        // Wait at least 2 seconds after startTime to allow all clients to check in
        if (!startTime || Date.now() - startTime < 2000) return;

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
    }, [players, status, user, roomId, roomStatus, startTime]);

    // Victory Confetti
    useEffect(() => {
        if (status === 'won') {
            setShowConfetti(true);
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

        if (fastPencilMode && fastPencilNumber !== null) {
            setCellValue(row, col, fastPencilNumber);
        } else {
            const cellValue = board[row][col];
            setHighlightedNumber(cellValue);
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
            {showConfetti && (
                <div className="fixed inset-0 pointer-events-none z-[100] flex items-center justify-center overflow-hidden">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute w-2 h-4 bg-indigo-500 rounded-full animate-confetti"
                            style={{
                                left: `${Math.random() * 100}%`,
                                backgroundColor: ['#6366f1', '#a855f7', '#ec4899', '#eab308', '#22c55e'][Math.floor(Math.random() * 5)],
                                animationDelay: `${Math.random() * 3}s`,
                                transform: `rotate(${Math.random() * 360}deg)`
                            }}
                        />
                    ))}
                </div>
            )}

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
                        <h1 className="text-2xl md:text-3xl font-black tracking-tight">Battle: <span className="font-mono text-indigo-600">{roomId}</span></h1>
                    </div>

                    <Timer startTime={startTime} className="text-4xl md:text-5xl font-black text-indigo-600 dark:text-indigo-400 tabular-nums bg-white/50 dark:bg-gray-800/50 backdrop-blur-md px-8 py-3 rounded-3xl border border-white/20 shadow-lg" />

                    <div className="flex items-center gap-4">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setFastPencilMode(!fastPencilMode);
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-sm ${fastPencilMode
                                ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-green-200 dark:shadow-green-900/50"
                                : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 border border-gray-100 dark:border-gray-700"
                                }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            Fast Pencil {fastPencilMode ? "ON" : "OFF"}
                        </button>

                        <div className="px-5 py-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm font-black text-indigo-500 tracking-widest uppercase text-xs">
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
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-6">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[3rem] p-12 text-center shadow-2xl animate-pop-in">
                        <div className="w-24 h-24 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-red-500">
                            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <h2 className="text-4xl font-black mb-4 uppercase">You&apos;re Out!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold text-lg">
                            {isBattleOngoing
                                ? "You made 3 mistakes. Don't worry, you can still watch the battle!"
                                : "The battle is over! Better luck next time."}
                        </p>
                        <button onClick={onExit} className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-[1.5rem] font-black text-xl hover:scale-105 active:scale-95 transition-all">
                            LEAVE BATTLE
                        </button>
                    </div>
                </div>
            )}

            {status === 'won' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/80 backdrop-blur-md p-6">
                    <div className="w-full max-w-md bg-white dark:bg-gray-800 rounded-[3rem] p-12 text-center shadow-2xl animate-pop-in border-4 border-yellow-400">
                        <div className="w-24 h-24 bg-yellow-100 dark:bg-yellow-900/30 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-yellow-500 animate-bounce">
                            <svg className="w-12 h-12 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </div>
                        <h2 className="text-5xl font-black mb-4">VICTORY!</h2>
                        <p className="text-gray-500 dark:text-gray-400 mb-8 font-bold text-lg">Incredible! You were the first to finish.</p>
                        <button onClick={onExit} className="w-full py-5 bg-gradient-to-r from-yellow-400 to-amber-500 text-white rounded-[1.5rem] font-black text-xl hover:scale-105 active:scale-95 transition-all">
                            EXIT BATTLE
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
