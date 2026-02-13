"use client";

import { useState, useEffect } from "react";
import { createRoom, joinRoom, GameDifficulty } from "@/lib/rooms";
import { useAuth } from "@/context/AuthContext";

interface LobbyProps {
    onJoinRoom: (roomId: string) => void;
}

export default function Lobby({ onJoinRoom }: LobbyProps) {
    const { user, playerName, setPlayerName, signInWithGoogle } = useAuth();
    const [joinRoomId, setJoinRoomId] = useState("");
    const [error, setError] = useState("");
    const [isCreating, setIsCreating] = useState(false);
    const [isJoining, setIsJoining] = useState(false);

    const handleCreateRoom = async (difficulty: GameDifficulty) => {
        if (!user) {
            try {
                await signInWithGoogle();
            } catch (err) {
                setError("Sign-in cancelled or failed");
            }
            return;
        }

        if (!playerName.trim()) {
            setError("Please enter your player name");
            return;
        }

        setIsCreating(true);
        setError("");
        try {
            const roomId = await createRoom(user.uid, playerName, difficulty);
            onJoinRoom(roomId);
        } catch (err: any) {
            console.error("Room creation error:", err);
            setError(err.message || "Failed to create room. Please check your connection.");
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinRoom = async () => {
        if (!user) {
            try {
                await signInWithGoogle();
            } catch (err) {
                setError("Sign-in cancelled or failed");
            }
            return;
        }

        if (!playerName.trim()) {
            setError("Please enter your player name before joining");
            return;
        }

        if (!joinRoomId) return;

        setIsJoining(true);
        setError("");
        try {
            const result = await joinRoom(joinRoomId.toUpperCase(), user.uid, playerName);
            if (result.success) {
                onJoinRoom(joinRoomId.toUpperCase());
            } else {
                setError(result.message || "Failed to join room");
            }
        } catch (err: any) {
            console.error("Room join error:", err);
            setError(err.message || "Failed to join room. Please check your connection.");
        } finally {
            setIsJoining(false);
        }
    };

    if (!user) {
        return (
            <div className="w-full max-w-md mx-auto p-8 bg-white/70 dark:bg-gray-800/70 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20">
                <div className="flex flex-col items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-indigo-500/10 rounded-3xl flex items-center justify-center rotate-3 border border-indigo-500/20 shadow-inner">
                        <svg className="w-10 h-10 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Multiplayer</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">Battle against other players in real-time</p>
                    </div>
                    <button
                        onClick={signInWithGoogle}
                        className="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white dark:bg-gray-700 border-2 border-gray-100 dark:border-gray-600 rounded-2xl font-black text-lg hover:border-indigo-500 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg"
                    >
                        <svg className="w-6 h-6" viewBox="0 0 24 24">
                            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                        </svg>
                        Login to Play
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-md mx-auto p-8 bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl border border-gray-100 dark:border-gray-700 animate-slide-up">
            <h2 className="text-3xl font-black mb-8 text-center bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">Multiplayer Hub</h2>

            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-700 dark:text-red-300 rounded-2xl text-sm font-bold flex items-center gap-2">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    {error}
                </div>
            )}

            <div className="space-y-8">
                {/* Player Name Settings */}
                <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-gray-400 pl-1">Your Battle Name</label>
                    <input
                        type="text"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        placeholder="Enter your name..."
                        className="w-full px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 font-bold focus:border-indigo-500 focus:bg-white dark:focus:bg-gray-900 transition-all outline-none"
                    />
                </div>

                <div className="space-y-4">
                    <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 pl-1">Create Battle</h3>
                    <div className="flex gap-3">
                        {(['easy', 'medium', 'hard'] as const).map((diff) => (
                            <button
                                key={diff}
                                onClick={() => handleCreateRoom(diff)}
                                disabled={isCreating}
                                className="flex-1 py-4 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl font-black text-sm capitalize hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                            >
                                {diff}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t-2 border-gray-100 dark:border-gray-700"></div>
                    <span className="flex-shrink-0 mx-4 text-xs font-black text-gray-300 dark:text-gray-600">OR JOIN WITH CODE</span>
                    <div className="flex-grow border-t-2 border-gray-100 dark:border-gray-700"></div>
                </div>

                <div className="space-y-4">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            value={joinRoomId}
                            onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                            placeholder="CODE"
                            maxLength={6}
                            className="w-32 px-5 py-4 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-100 dark:border-gray-700 rounded-2xl text-gray-900 dark:text-gray-100 text-center font-black tracking-widest focus:border-purple-500 outline-none"
                        />
                        <button
                            onClick={handleJoinRoom}
                            disabled={isJoining || !joinRoomId || joinRoomId.length < 6}
                            className="flex-1 py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-2xl font-black hover:scale-[1.02] active:scale-95 transition-all shadow-xl disabled:opacity-50"
                        >
                            {isJoining ? "JOINING..." : "ENTER BATTLE"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
