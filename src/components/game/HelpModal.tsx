"use client";

import { useState } from "react";

export default function HelpModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
            <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-700 animate-pop-in" onClick={(e) => e.stopPropagation()}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-lg">?</span>
                            How to Play
                        </h3>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="space-y-6">
                        {/* FAST FILL - Highlight Feature */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-2xl">⚡</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                    Fast Fill Mode
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] rounded-full uppercase tracking-wide">Pro Tip</span>
                                </h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Select a number first, then tap any empty cell to fill it instantly! Great for speed.
                                </p>
                            </div>
                        </div>

                        {/* PENCIL MODE */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-2xl">✏️</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Pencil Mode</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Add small notes to track possibilities. Notes are automatically removed when you fill the cell.
                                </p>
                            </div>
                        </div>

                        {/* MISTAKES LIMIT */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-2xl">❤️</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Mistakes & Lives</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    You have <strong>3 lives</strong>. Entering a wrong number costs a life and turns the cell <span className="text-red-500 font-bold">red</span>. Game over if you lose all 3!
                                </p>
                            </div>
                        </div>

                        {/* NUMBER COUNTS */}
                        <div className="flex gap-4">
                            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                                <span className="text-2xl">🔢</span>
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-gray-100">Number Tracker</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    The small numbers on the keypad show <strong>how many of that digit are left</strong> to place. When a number acts as 0, it grays out.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 px-6 py-4 text-center">
                    <button
                        onClick={onClose}
                        className="w-full py-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-indigo-600 dark:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors shadow-sm"
                    >
                        Got it!
                    </button>
                </div>
            </div>
        </div>
    );
}
