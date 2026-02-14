
"use client";

import { useEffect, useState } from "react";

interface TimerProps {
    startTime: number | null;
    className?: string;
}

export default function Timer({ startTime, className }: TimerProps) {
    const [now, setNow] = useState(Date.now());

    useEffect(() => {
        if (!startTime) return;

        const interval = setInterval(() => {
            setNow(Date.now());
        }, 1000);

        return () => clearInterval(interval);
    }, [startTime]);

    const elapsed = startTime ? Math.max(0, Math.floor((now - startTime) / 1000)) : 0;

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    return (
        <div className={`font-mono text-2xl font-bold ${className}`}>
            {formatTime(elapsed)}
        </div>
    );
}
