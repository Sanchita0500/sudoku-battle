import { useEffect, useState, useMemo, useRef } from "react";
import { useDebounce } from "use-debounce";
import confetti from "canvas-confetti";
import Board from "./Board";
import GameControls from "./GameControls";
import { useMultiplayerStore } from "@/hooks/useMultiplayerStore";
import { useGameLogic } from "@/hooks/useGameLogic";
import { useAuth } from "@/context/AuthContext";
import { useRoomListener } from "@/hooks/useRoomListener";
import { ref, update, onValue } from "firebase/database";
import { db } from "@/lib/firebase";
import { countEmptyCells } from "@/lib/utils";
import Timer from "./Timer";
import { startGame as fireStartGame, deleteRoom } from "@/lib/rooms";
import { GameStatus, RoomStatus } from "@/lib/types";
import { recordBattleResult } from "@/lib/battleScores";

import HelpModal from "./HelpModal";
import GameModal from "./GameModal";

interface MultiplayerGameProps {
    roomId: string;
    onExit: () => void;
}

import { useAutoFill } from "@/hooks/useAutoFill";

export default function MultiplayerGame({ roomId, onExit }: MultiplayerGameProps) {
    const { user } = useAuth();
    const { board, initialBoard, setCellValue, status, mistakes, players, roomStatus, startTime, endTime, undo, history, resetGame, toggleNote, resetBoard, ownerId, mistakeCells, notes, setRemoteState, progress, solution, difficulty } = useMultiplayerStore();

    // Auto-fill Magic Hook for Multiplayer? 
    // Yes, if a player is close to finishing, we help them finish.
    const { activeAutoFillCell } = useAutoFill({
        progress,
        board,
        solution,
        setCellValue,
        status,
        mistakeCells
    });

    // Use ownerId from Firebase room data to determine host
    const isHost = user && ownerId === user.uid;
    // Calculate duration for victory modal
    const gameDuration = startTime && endTime ? Math.floor((endTime - startTime) / 1000) : 0;

    // If gameDuration is 0 (endTime not set locally), it means opponent made 3 mistakes
    const wonByOpponentMistakes = status === GameStatus.Won && (!endTime || gameDuration === 0);

    const [showQuitConfirm, setShowQuitConfirm] = useState(false);
    const [canCheckVictory, setCanCheckVictory] = useState(false);
    const [showHelp, setShowHelp] = useState(false);
    const [isConnected, setIsConnected] = useState(true);

    // Monitoring connection status
    useEffect(() => {
        const connectedRef = ref(db, ".info/connected");
        const unsubscribe = onValue(connectedRef, (snap) => {
            if (snap.val() === true) {
                setIsConnected(true);
            } else {
                setIsConnected(false);
            }
        });

        return () => unsubscribe();
    }, []);

    // Check if we were removed from the room (e.g. by our own onDisconnect handler triggering on a brief outage)
    useEffect(() => {
        if (!user?.uid) return;

        // If we are connected but not in the players list anymore, we've been booted
        const amIStillInRoom = players && players[user.uid];

        if (isConnected && !amIStillInRoom && roomStatus !== RoomStatus.Waiting) {
            // We could trigger an exit here or show a modal
            // For now, let's just log it. The UI might look broken if player is null.
            // Ideally we should redirect to home.
            // console.log("Detected removal from room.");
            // onExit(); // Force exit? Maybe dangerous if it's just a sync lag.
        }
    }, [isConnected, players, user, roomStatus]);

    useEffect(() => {
        if (!roomId) return;

        const roomRef = ref(db, `rooms/${roomId}`);

        const unsubscribe = onValue(roomRef, (snapshot) => {
            const data = snapshot.val();

            if (data) {
                setRemoteState(data, user?.uid);
            } else {
                // Room deleted or doesn't exist
            }
        });

        return () => unsubscribe();
    }, [roomId, user, setRemoteState]);

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
    } = useGameLogic({
        board,
        initialBoard,
        status,
        setCellValue,
        toggleNote,
        mistakeCells
    });

    // Reset game state on mount/unmount to prevent glitches
    useEffect(() => {
        resetGame();
        return () => resetGame();
    }, []);

    // Sync with Firebase
    useRoomListener(roomId);

    // Safety delay to prevent early victory trigger due to clock skew or race conditions
    useEffect(() => {
        if (status === GameStatus.Playing && roomStatus === RoomStatus.Playing) {
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
        if (!user || status !== GameStatus.Playing || roomStatus !== RoomStatus.Playing) return;

        // Wait for safety delay
        if (!canCheckVictory) return;

        const otherPlayers = Object.values(players).filter(p => p.id !== user.uid);
        if (otherPlayers.length > 0) {
            // Only auto-win if ALL other players have explicitly LOST.
            // If they are simply 'Idle' or disconnected (not in list), we play on.
            const allOthersLost = otherPlayers.every(p => p.status === GameStatus.Lost);

            if (allOthersLost) {
                // You are the last one standing!
                const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
                const roomRef = ref(db, `rooms/${roomId}`);
                update(playerRef, { status: GameStatus.Won });
                update(roomRef, { status: RoomStatus.Finished });
            }
        }
    }, [players, status, user, roomId, roomStatus, canCheckVictory]);

    // Record battle result (wins/losses) exactly once when game ends
    const scoreRecorded = useRef(false);
    useEffect(() => {
        if (!user || scoreRecorded.current) return;
        if (status !== GameStatus.Won && status !== GameStatus.Lost) return;

        scoreRecorded.current = true;
        const opponents = Object.values(players).filter(p => p.id !== user.uid);
        opponents.forEach(op => {
            recordBattleResult(user.uid, op.id, op.name, status === GameStatus.Won)
                .catch(err => console.error("Failed to record battle result:", err));
        });
    }, [status, players, user]);

    // Game Over if room is finished and you didn't win
    // Bug 4: delay before marking Lost so a simultaneous Win update can arrive first (prevents tie glitch)
    useEffect(() => {
        if (roomStatus === RoomStatus.Finished && status === GameStatus.Playing && user) {
            const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
            const t = setTimeout(() => {
                // Re-check: if we've won in the meantime, don't overwrite
                if (useMultiplayerStore.getState().status !== GameStatus.Won) {
                    update(playerRef, { status: GameStatus.Lost });
                }
            }, 1500);
            return () => clearTimeout(t);
        }
    }, [roomStatus, status, user, roomId]);

    // Victory Confetti — Bug 1: track RAF so it stops when user exits
    useEffect(() => {
        if (status === GameStatus.Won) {
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
            return () => { cancelled = true; cancelAnimationFrame(rafId); confetti.reset(); };
        }
    }, [status]);

    // Debounce board state changes to reduce Firebase writes
    // Updates will fire at most once every 500ms instead of on every move
    const [debouncedBoard] = useDebounce(board, 500);
    const [debouncedMistakes] = useDebounce(mistakes, 500);
    const [debouncedStatus] = useDebounce(status, 500);
    const [debouncedProgress] = useDebounce(progress, 500);

    // Effect to update player progress & mistakes & status in Firebase
    useEffect(() => {
        if (!user || !roomId || debouncedStatus === GameStatus.Idle) return;

        const dbRef = ref(db);

        // Batch all updates into a single object
        const batchedUpdates: Record<string, any> = {
            [`rooms/${roomId}/players/${user.uid}/progress`]: debouncedProgress,
            [`rooms/${roomId}/players/${user.uid}/mistakes`]: debouncedMistakes,
            [`rooms/${roomId}/players/${user.uid}/status`]: debouncedStatus
        };

        if (debouncedStatus === GameStatus.Won) {
            batchedUpdates[`rooms/${roomId}/players/${user.uid}/completed`] = true;
            batchedUpdates[`rooms/${roomId}/status`] = RoomStatus.Finished; // Update room status in same call
        }

        // Single atomic update instead of multiple calls
        update(dbRef, batchedUpdates);

    }, [debouncedBoard, debouncedMistakes, debouncedStatus, debouncedProgress, user, roomId]);



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

    const gameStarted = roomStatus !== RoomStatus.Waiting;

    // Delete room when a finished game is exited (host cleans up; 10s delay lets
    // the other player finish recording their score first).
    const roomDeleted = useRef(false);
    const handleExit = () => {
        const gameFinished =
            status === GameStatus.Won ||
            status === GameStatus.Lost ||
            roomStatus === RoomStatus.Finished;

        if (gameFinished && isHost && roomId && !roomDeleted.current) {
            roomDeleted.current = true;
            // Short delay so the opponent can still read their result modal
            setTimeout(() => {
                deleteRoom(roomId).catch(err =>
                    console.error("Failed to delete room:", err)
                );
            }, 10_000);
        }
        confetti.reset();
        onExit();
    };

    const handleLeaveGame = () => {
        if (status === GameStatus.Playing && user && roomId) {
            const playerRef = ref(db, `rooms/${roomId}/players/${user.uid}`);
            update(playerRef, { status: GameStatus.Lost });
        }
        handleExit();
    };

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
        <div className="flex flex-col items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 px-0 md:p-8 font-sans text-gray-900 dark:text-gray-100 overflow-x-hidden">
            {/* Battle Status Header */}
            <div className="w-full max-w-6xl mb-2 space-y-2">
                <div className="flex flex-wrap gap-2 items-center justify-between">
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

                    <button
                        onClick={() => setShowHelp(true)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </button>
                </div>

                {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

                {/* Player Progress Bar - compact to avoid board scrolling */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {sortedPlayers.map((player) => (
                        <div key={player.id} className={`p-2 rounded-xl shadow-sm border transition-all ${player.id === user?.uid
                            ? "bg-indigo-600 text-white border-indigo-500"
                            : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border-gray-100 dark:border-gray-700"
                            }`}>
                            <div className="flex justify-between items-center gap-1">
                                <span className="font-black text-xs truncate max-w-[70px]">{player.name}</span>
                                <span className={`text-[9px] font-black uppercase tracking-tighter px-1.5 py-0.5 rounded-full ${player.status === GameStatus.Lost ? "bg-red-500 text-white" : "bg-green-500 text-white"
                                    }`}>
                                    {player.status === GameStatus.Playing ? "⚔" : player.status}
                                </span>
                            </div>
                            <div className="flex items-baseline gap-1 mt-0.5">
                                <span className="text-lg font-black">{player.progress}</span>
                                <span className="text-[9px] font-bold opacity-70">left</span>
                                <span className="text-[9px] font-black opacity-60 ml-auto">{player.mistakes}/3 ❌</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <main className="w-full flex flex-col items-center justify-center transform origin-top" onClick={handleBackgroundClick}>
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

                <div className="w-full max-w-xl animate-fade-in" onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center mb-4 bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2">
                            <div className="flex flex-col">
                                <span className="text-xs font-black text-gray-400 tracking-widest uppercase">Time</span>
                                <Timer startTime={startTime} className="text-2xl font-black text-indigo-600 dark:text-indigo-400 font-mono tracking-tight" />
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 rounded-xl">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                <span className="font-bold text-red-600 dark:text-red-400 tabular-nums">Mistakes: {mistakes}/3</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowHelp(true)}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-500 dark:text-gray-400 transition-all"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </button>
                    </div>

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
                    <GameControls
                        board={board}
                        onNumberClick={handleNumberClick}
                        onReset={resetBoard}
                        selectedNumber={fastFillMode ? fastFillNumber : null}
                        onUndo={undo}
                        canUndo={history.length > 0}
                    />
                </div>
            </main>

            {/* Quit Confirmation Modal */}
            <GameModal
                isOpen={showQuitConfirm}
                onClose={() => setShowQuitConfirm(false)}
                title="Leave Battle?"
                description="The game will continue without you. Are you sure you want to surrender?"
                type="default"
                icon={
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                }
            >
                <div className="flex gap-3 justify-center w-full">
                    <button
                        onClick={() => {
                            setShowQuitConfirm(false);
                            confetti.reset();
                            handleExit();
                        }}
                        className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-colors shadow-lg hover:shadow-xl"
                    >
                        Yes, Surrender
                    </button>
                    <button
                        onClick={() => setShowQuitConfirm(false)}
                        className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-xl font-bold transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            </GameModal>

            {/* Game Over / Lost Modal */}
            <GameModal
                isOpen={status === GameStatus.Lost}
                title="DEFEAT"
                description={
                    <>
                        <span className="block mb-2">You have been eliminated.</span>
                        <span className="block text-sm opacity-80">
                            {user && players[user?.uid]?.mistakes >= 3
                                ? "Too many mistakes!"
                                : "Better luck next time!"}
                        </span>
                    </>
                }
                type="danger"
                icon={
                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                }
            >
                <button
                    onClick={() => { confetti.reset(); handleExit(); }}
                    className="w-full py-4 bg-white text-gray-900 rounded-xl font-bold text-lg hover:bg-gray-100 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                >
                    Leave Battle
                </button>
            </GameModal>

            {/* Victory Modal */}
            <GameModal
                isOpen={status === GameStatus.Won}
                type="won"
                time={wonByOpponentMistakes ? undefined : gameDuration}
                difficulty={difficulty}
                description={wonByOpponentMistakes ? "Your opponent made 3 mistakes. You win! 🏆" : undefined}
            >
                <button
                    onClick={() => { confetti.reset(); handleExit(); }}
                    className="w-full py-4 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold transition-colors shadow-lg"
                >
                    Claim Victory
                </button>
            </GameModal>
        </div>
    );
}
