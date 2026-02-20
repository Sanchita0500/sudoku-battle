"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getBattleScores, BattleRecord } from "@/lib/battleScores";

interface BattleScoresProps {
    onBack: () => void;
}

function WinRateBar({ wins, losses }: { wins: number; losses: number }) {
    const total = wins + losses;
    const rate = total === 0 ? 0 : Math.round((wins / total) * 100);
    return (
        <div className="mt-2">
            <div className="flex justify-between text-[10px] font-bold mb-0.5 text-gray-500 dark:text-gray-400">
                <span>{rate}% win rate</span>
                <span>{total} game{total !== 1 ? "s" : ""}</span>
            </div>
            <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-700"
                    style={{ width: `${rate}%` }}
                />
            </div>
        </div>
    );
}

function RecordCard({ record }: { record: BattleRecord }) {
    const total = record.wins + record.losses;
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-1">
            <div className="flex justify-between items-start">
                <div className="flex flex-col min-w-0">
                    <span className="font-black text-gray-900 dark:text-gray-100 truncate text-sm">
                        {record.opponentName}
                    </span>
                    <span className="text-[10px] text-gray-400">{total} battle{total !== 1 ? "s" : ""}</span>
                </div>
                <div className="flex gap-1.5 ml-2 shrink-0">
                    <span className="px-2.5 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-black">
                        {record.wins}W
                    </span>
                    <span className="px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-xs font-black">
                        {record.losses}L
                    </span>
                </div>
            </div>
            <WinRateBar wins={record.wins} losses={record.losses} />
        </div>
    );
}

function SkeletonCard() {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse">
            <div className="flex justify-between items-center mb-3">
                <div className="space-y-1.5">
                    <div className="h-3.5 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
                    <div className="h-2.5 w-16 bg-gray-100 dark:bg-gray-700 rounded" />
                </div>
                <div className="flex gap-1.5">
                    <div className="h-6 w-10 bg-green-100 dark:bg-green-900/20 rounded-full" />
                    <div className="h-6 w-10 bg-red-100 dark:bg-red-900/20 rounded-full" />
                </div>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-700 rounded-full" />
        </div>
    );
}

export default function BattleScores({ onBack }: BattleScoresProps) {
    const { user } = useAuth();
    const [records, setRecords] = useState<BattleRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!user?.uid) return;
        setLoading(true);
        getBattleScores(user.uid)
            .then(setRecords)
            .catch((err) => {
                // PERMISSION_DENIED means the Firebase rule doesn't exist yet OR no data —
                // treat it as empty state so it's not scary for new users.
                const code = err?.code || err?.message || "";
                if (code.includes("PERMISSION_DENIED") || code.includes("permission")) {
                    setRecords([]);
                } else {
                    setError("Failed to load scores. Check your connection.");
                }
            })
            .finally(() => setLoading(false));
    }, [user?.uid]);

    const totalWins = records.reduce((s, r) => s + r.wins, 0);
    const totalLosses = records.reduce((s, r) => s + r.losses, 0);
    const totalGames = totalWins + totalLosses;

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-950 dark:via-gray-900 dark:to-indigo-950 flex flex-col">
            {/* Header */}
            <header className="w-full px-4 pt-6 pb-4 flex items-center gap-3">
                <button
                    onClick={onBack}
                    className="w-9 h-9 rounded-full bg-white dark:bg-gray-800 shadow border border-gray-100 dark:border-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:scale-105 transition-transform"
                >
                    ←
                </button>
                <div>
                    <h1 className="text-xl font-black text-gray-900 dark:text-gray-100">Battle Scores ⚔️</h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Head-to-head records</p>
                </div>
            </header>

            {/* Summary banner */}
            {!loading && totalGames > 0 && (
                <div className="mx-4 mb-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg">
                    <div className="flex justify-around">
                        <div className="text-center">
                            <div className="text-2xl font-black">{totalWins}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Wins</div>
                        </div>
                        <div className="w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-2xl font-black">{totalLosses}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Losses</div>
                        </div>
                        <div className="w-px bg-white/20" />
                        <div className="text-center">
                            <div className="text-2xl font-black">{records.length}</div>
                            <div className="text-[10px] font-bold uppercase tracking-widest opacity-80">Rivals</div>
                        </div>
                    </div>
                </div>
            )}

            {/* Content */}
            <main className="flex-1 px-4 pb-8">
                {error && (
                    <div className="text-center py-16 text-red-500 font-semibold text-sm">{error}</div>
                )}

                {loading && (
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => <SkeletonCard key={i} />)}
                    </div>
                )}

                {!loading && !error && records.length === 0 && (
                    <div className="text-center py-24 flex flex-col items-center gap-4">
                        <div className="text-6xl">⚔️</div>
                        <p className="font-black text-lg text-gray-800 dark:text-gray-200">No battles yet</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Challenge someone to see your records here</p>
                    </div>
                )}

                {!loading && !error && records.length > 0 && (
                    <div className="space-y-3">
                        {records.map(r => <RecordCard key={r.opponentUid} record={r} />)}
                    </div>
                )}
            </main>
        </div>
    );
}
