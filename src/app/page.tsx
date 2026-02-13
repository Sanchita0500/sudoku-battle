"use client";

import { useState } from "react";
import SinglePlayerGame from "@/components/game/SinglePlayerGame";
import MultiplayerGame from "@/components/game/MultiplayerGame";
import Lobby from "@/components/game/Lobby";

import { useAuth } from "@/context/AuthContext";

type GameDifficulty = 'easy' | 'medium' | 'hard';

export default function Home() {
  const { user, signOut } = useAuth();
  const [mode, setMode] = useState<'menu' | 'difficulty-select' | 'single' | 'multi'>('menu');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('easy');
  const [roomId, setRoomId] = useState<string | null>(null);

  const handleJoinGame = (id: string) => {
    setRoomId(id);
    setMode('multi');
  };

  const handleExitGame = () => {
    setRoomId(null);
    setMode('menu');
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
    return <SinglePlayerGame difficulty={difficulty} onExit={handleExitGame} />;
  }

  // Multiplayer Game
  if (mode === 'multi' && roomId) {
    return <MultiplayerGame roomId={roomId} onExit={handleExitGame} />;
  }

  // Main Menu
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col p-4">
      {/* Top Header with Sign Out */}
      {user && (
        <header className="w-full max-w-6xl mx-auto flex justify-end items-center py-4 px-6 animate-fade-in">
          <div className="flex items-center gap-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-md p-2 pl-4 pr-3 rounded-2xl border border-white/20 shadow-sm transition-all hover:shadow-md">
            <div className="flex flex-col items-end">
              <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.displayName}</span>
              <span className="text-[10px] text-gray-500 dark:text-gray-400 leading-tight">{user.email}</span>
            </div>
            <div className="h-8 w-[1px] bg-gray-200 dark:bg-gray-700 mx-1"></div>
            <button
              onClick={signOut}
              className="px-4 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </header>
      )}

      <div className="flex-grow flex flex-col items-center justify-center -mt-10">
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

          {/* Multiplayer Lobby */}
          <Lobby onJoinRoom={handleJoinGame} />
        </div>
      </div>
    </div>
  );
}
