"use client";

import { useEffect, useState } from "react";
import { twMerge } from "tailwind-merge";

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);
    const [shouldRender, setShouldRender] = useState(true);

    useEffect(() => {
        // Prevent scrolling while splash screen is visible
        if (isVisible) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }

        // Minimum display time for branding + loading buffer
        const timer = setTimeout(() => {
            setIsVisible(false);
            // Remove from DOM after fade out transition
            setTimeout(() => setShouldRender(false), 500);
        }, 2000);

        return () => clearTimeout(timer);
    }, [isVisible]);

    if (!shouldRender) return null;

    return (
        <div
            className={twMerge(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-white dark:bg-gray-950 transition-opacity duration-500 ease-in-out",
                isVisible ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
        >
            <div className="relative flex flex-col items-center animate-bounce-in">
                <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-2xl flex items-center justify-center mb-6 animate-pulse-slow">
                    <span className="text-5xl font-black text-white">S</span>
                </div>
                <h1 className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tighter">
                    SUDOKU BATTLE
                </h1>
                <p className="mt-2 text-sm font-bold text-gray-400 tracking-widest uppercase">
                    Loading Arena...
                </p>
            </div>
        </div>
    );
}
