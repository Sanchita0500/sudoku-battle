"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Lobby from "@/components/game/Lobby";
import DailyChallengeMenu from "@/components/game/DailyChallengeMenu";

const SinglePlayerGame = dynamic(() => import("@/components/game/SinglePlayerGame"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen text-indigo-600 font-bold animate-pulse">Loading Game...</div>
});

const MultiplayerGame = dynamic(() => import("@/components/game/MultiplayerGame"), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center min-h-screen text-indigo-600 font-bold animate-pulse">Loading Battle Arena...</div>
});

import { useAuth } from "@/context/AuthContext";

type GameDifficulty = 'easy' | 'medium' | 'hard';

export default function Home() {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<'menu' | 'difficulty-select' | 'single' | 'multi' | 'daily'>('menu');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [dailyDate, setDailyDate] = useState<string | undefined>(undefined);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleJoinGame = (id: string) => {
    setRoomId(id);
    setMode('multi');
  };

  const handleExitGame = () => {
    setRoomId(null);
    setDailyDate(undefined);
    setMode('menu');
  };

  const handleStartDaily = (dateStr: string, diff: GameDifficulty) => {
    setDailyDate(dateStr);
    setDifficulty(diff);
    setMode('single');
  };

  const handleDifficultySelect = (diff: GameDifficulty) => {
    setDifficulty(diff);
    setMode('single');
  };

  // Difficulty Selection Screen
  if (mode === 'difficulty-select') {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-black flex flex-col items-center justify-center p-4">
        <h1 className="text-3xl font-extrabold mb-4 text-blue-600 dark:text-blue-400">Select Difficulty</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">Choose your challenge level</p>

        <div className="w-full max-w-md space-y-4">
          {(['easy', 'medium', 'hard'] as const).map((diff) => (
            <button
              key={diff}
              onClick={() => handleDifficultySelect(diff)}
              className="w-full py-6 text-2xl font-bold bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-800 rounded-xl shadow-md hover:border-blue-500 hover:scale-105 transition-all text-gray-800 dark:text-gray-100 capitalize"
            >
              {diff}
            </button>
          ))}
        </div>

        <button
          onClick={() => setMode('menu')}
          className="mt-8 px-6 py-2 bg-gray-200 dark:bg-gray-800 rounded hover:bg-gray-300 dark:hover:bg-gray-700 font-bold"
        >
          ← Back
        </button>
      </div>
    );
  }

  // Single Player Game
  if (mode === 'single') {
    return <SinglePlayerGame difficulty={difficulty} date={dailyDate} onExit={handleExitGame} />;
  }

  // Daily Challenge Menu
  if (mode === 'daily') {
    return <DailyChallengeMenu onStartDaily={handleStartDaily} onBack={() => setMode('menu')} />;
  }

  // Multiplayer Game
  if (mode === 'multi' && roomId) {
    return <MultiplayerGame roomId={roomId} onExit={handleExitGame} />;
  }

  // Main Menu
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col p-4">
      {/* Top Header with Sign Out */}
      {/* Top Header with Profile Menu */}
      {user && (
        <header className="w-full max-w-6xl mx-auto flex justify-end items-center py-4 px-6 animate-fade-in relative z-50">
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold flex items-center justify-center shadow-md hover:shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
            </button>

            {showProfileMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowProfileMenu(false)}
                ></div>
                <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 p-4 z-50 animate-pop-in origin-top-right">
                  <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100 dark:border-gray-700">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-xl font-bold text-indigo-600 dark:text-indigo-400">
                      {user.displayName ? user.displayName[0].toUpperCase() : 'U'}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{user.displayName}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      signOut();
                    }}
                    className="w-full py-2.5 flex items-center justify-center gap-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-bold rounded-xl hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        </header>
      )}

      <div className="flex-grow flex flex-col items-center justify-center md:-mt-10">
        <h1 className="text-5xl md:text-7xl font-extrabold mb-12 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent tracking-tighter text-center">
          SUDOKU BATTLE
        </h1>

        <div className="w-full max-w-md space-y-6">
          {/* Single Player Entry */}
          <button
            onClick={() => setMode('difficulty-select')}
            className="w-full py-5 text-2xl font-black bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl hover:border-indigo-500 hover:shadow-indigo-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-gray-800 dark:text-gray-100 group"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-indigo-500 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Practice Solo
            </span>
          </button>

          {/* Daily Challenge Entry */}
          <button
            onClick={() => setMode('daily')}
            className="w-full py-5 text-2xl font-black bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-3xl shadow-xl hover:border-purple-500 hover:shadow-purple-500/10 hover:scale-[1.02] active:scale-[0.98] transition-all text-gray-800 dark:text-gray-100 group"
          >
            <span className="flex items-center justify-center gap-3">
              <svg className="w-6 h-6 text-purple-500 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Daily Challenge
            </span>
          </button>

          {/* Multiplayer Lobby */}
          <Lobby onJoinRoom={handleJoinGame} />
        </div>
      </div>
    </div>
  );
}
