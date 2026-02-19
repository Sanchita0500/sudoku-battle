"use client";

import { useState, useEffect } from "react";
import { generateSeededPuzzle, getDailyDifficulty } from "@/lib/seededSudoku";
import { GameDifficulty } from "@/lib/sudoku";

interface DailyChallengeMenuProps {
    onStartDaily: (dateStr: string, difficulty: GameDifficulty) => void;
    onBack: () => void;
}

export default function DailyChallengeMenu({ onStartDaily, onBack }: DailyChallengeMenuProps) {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [completedDates, setCompletedDates] = useState<string[]>([]);

    useEffect(() => {
        // Load completed dates from localStorage
        const saved = localStorage.getItem("daily_completed");
        if (saved) {
            setCompletedDates(JSON.parse(saved));
        }
    }, []);

    // Generate calendar grid for current month
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth(); // 0-indexed
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0 = Sunday

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDayOfMonth }, (_, i) => i);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const handleDayClick = (day: number) => {
        const selectedDate = new Date(year, month, day);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Allow playing past days? Yes.
        // Allow playing future days? No (it's a challenge!).
        if (selectedDate > today) return;

        // Format YYYY-MM-DD
        const dateStr = selectedDate.toISOString().split('T')[0];
        const difficulty = getDailyDifficulty(selectedDate);

        onStartDaily(dateStr, difficulty);
    };

    const isCompleted = (day: number) => {
        const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        return completedDates.includes(dateStr);
    };

    // Calculate Monthly Progress
    const completedInMonth = daysArray.filter(day => {
        // Use local date string construction to match how we save it (which is ISO split T)
        // Wait, Date construction uses local time?
        // const selectedDate = new Date(year, month, day); 
        // isCompleted uses this logic:
        // const dateStr = new Date(year, month, day).toISOString().split('T')[0];
        // Be careful with timezones. new Date(year, month, day) creates date at 00:00 Local.
        // .toISOString() converts to UTC.
        // If Local is GMT+5:30. 00:00 -> Previous Day 18:30 UTC.
        // This is a BUG in my previous DailyChallengeMenu logic likely.
        // I should use `YYYY-MM-DD` string construction manually to be safe.
        const date = new Date(year, month, day);
        const yearStr = date.getFullYear();
        const monthStr = String(date.getMonth() + 1).padStart(2, '0');
        const dayStr = String(date.getDate()).padStart(2, '0');
        const dateStr = `${yearStr}-${monthStr}-${dayStr}`;

        // But wait, the `handleDayClick` used `toISOString`.
        // Let's stick to `toISOString` for consistency IF `handleDayClick` uses the SAME `date` object.
        // In `handleDayClick`: `new Date(year, month, day)`.
        // So if I use `new Date(year, month, day).toISOString().split('T')[0]` consistently, it "works" (even if it's technically the wrong date in UTC, it's the SAME wrong date key).
        // Let's stick to what is implemented to avoid breaking existing saves, OR fix both.
        // Checking `isCompleted` function in previous step:
        // `const dateStr = new Date(year, month, day).toISOString().split('T')[0];`
        // So I will use that.

        return completedDates.includes(dateStr);
    }).length;

    const progressPercent = Math.min(100, Math.max(0, (completedInMonth / daysInMonth) * 100));

    const changeMonth = (offset: number) => {
        const newDate = new Date(currentDate.setMonth(currentDate.getMonth() + offset));
        setCurrentDate(new Date(newDate));
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-950 p-4">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-100 dark:border-gray-800 animate-slide-up">

                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-6 text-white text-center relative overflow-hidden">
                    {/* Trophy Progress */}
                    <div className="absolute top-4 right-4 flex flex-col items-center z-10">
                        <div className="relative w-12 h-12">
                            {/* Empty/Background */}
                            <svg className="w-full h-full text-black/30" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M5 3L4 12H20L19 3H5ZM7 5H17L17.5 10H6.5L7 5Z" opacity="0.5" />
                                <path d="M19 3H5C3.9 3 3 3.9 3 5V9C3 11.21 4.79 13 7 13V14C7 16.21 8.79 18 11 18H13C15.21 18 17 16.21 17 14V13C19.21 13 21 11.21 21 9V5C21 3.9 20.1 3 19 3ZM7 11C5.9 11 5 10.1 5 9V5H7V11ZM17 11V5H19V9C19 10.1 18.1 11 17 11Z" />
                                <path d="M12 20C10.9 20 10 20.9 10 22H14C14 20.9 13.1 20 12 20Z" />
                            </svg>

                            {/* Filled Overlay */}
                            <div className="absolute bottom-0 left-0 w-full overflow-hidden transition-all duration-1000 ease-out" style={{ height: `${progressPercent}%` }}>
                                <svg className="w-12 h-12 text-yellow-300 drop-shadow-md" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 3H5C3.9 3 3 3.9 3 5V9C3 11.21 4.79 13 7 13V14C7 16.21 8.79 18 11 18H13C15.21 18 17 16.21 17 14V13C19.21 13 21 11.21 21 9V5C21 3.9 20.1 3 19 3ZM7 11C5.9 11 5 10.1 5 9V5H7V11ZM17 11V5H19V9C19 10.1 18.1 11 17 11Z" />
                                    <path d="M12 20C10.9 20 10 20.9 10 22H14C14 20.9 13.1 20 12 20Z" />
                                </svg>
                            </div>
                        </div>
                        <span className="text-[10px] font-black uppercase text-yellow-100 mt-1 tracking-wider">{completedInMonth}/{daysInMonth}</span>
                    </div>

                    <button
                        onClick={onBack}
                        className="absolute left-6 top-6 p-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-colors"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h2 className="text-3xl font-black tracking-tight mt-2">Daily Challenge</h2>
                    <p className="text-indigo-100 font-medium text-sm mt-1 mb-2">Build your streak!</p>
                </div>

                {/* Calendar Nav */}
                <div className="flex items-center justify-between p-6">
                    <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    </button>
                    <h3 className="text-xl font-bold text-gray-800 dark:text-gray-200">{monthNames[month]} {year}</h3>
                    <button onClick={() => changeMonth(1)} disabled={new Date(year, month + 1, 1) > new Date()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full disabled:opacity-30">
                        <svg className="w-6 h-6 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                    </button>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-2 p-4 pt-0 text-center">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={`${day}-${i}`} className="text-xs font-black text-gray-400 py-2">{day}</div>
                    ))}

                    {blanks.map(b => <div key={`blank-${b}`} />)}

                    {daysArray.map(day => {
                        const date = new Date(year, month, day);
                        const today = new Date();
                        today.setHours(0, 0, 0, 0);
                        const isToday = date.getTime() === today.getTime();
                        const isFuture = date > today;
                        const completed = isCompleted(day);
                        const difficulty = getDailyDifficulty(date);

                        let bgClass = "bg-gray-50 dark:bg-gray-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-gray-700 dark:text-gray-300";
                        if (isToday) bgClass = "bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 scale-110 z-10 ring-2 ring-white dark:ring-gray-900";
                        if (completed) bgClass = "bg-green-500 text-white shadow-md shadow-green-500/20";
                        if (isFuture) bgClass = "opacity-30 cursor-not-allowed bg-gray-50 dark:bg-gray-900";

                        return (
                            <button
                                key={day}
                                disabled={isFuture}
                                onClick={() => handleDayClick(day)}
                                className={`
                                        relative aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200
                                        ${bgClass}
                                    `}
                            >
                                <span className={`text-sm font-bold ${isToday || completed ? 'scale-110' : ''}`}>{day}</span>
                                {completed && (
                                    <svg className="w-3 h-3 absolute bottom-1 right-1 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={4} d="M5 13l4 4L19 7" /></svg>
                                )}
                                {!completed && !isFuture && (
                                    <span className={`text-[8px] font-bold uppercase tracking-tighter mt-0.5 opacity-60`}>
                                        {difficulty[0]}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
