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
                        <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white shadow-lg shadow-green-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Fast Fill Mode</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Select a number from the bottom pad first. Then, tap any cell on the board to fill it with that number instantly. Great for speed!
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <div className="shrink-0 w-10 h-10 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                                </svg>
                            </div>
                            <div>
                                <h4 className="font-bold text-gray-900 dark:text-gray-100 mb-1">Pencil Mode (Notes)</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
                                    Toggle this ON to make small notes in cells instead of filling them. Use it to track possible candidates without committing to a number.
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
