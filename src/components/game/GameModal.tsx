import React, { ReactNode } from 'react';

interface GameModalProps {
    isOpen: boolean;
    title?: string;
    description?: ReactNode;
    icon?: ReactNode;
    children?: ReactNode; // For actions/buttons
    type?: 'default' | 'success' | 'danger' | 'won';
    onClose?: () => void;
    time?: number;
    difficulty?: string;
    onAction?: () => void;
    actionLabel?: string;
}

export default function GameModal({
    isOpen,
    title,
    description,
    icon,
    children,
    type = 'default',
    onClose,
    time,
    difficulty,
    onAction,
    actionLabel = "Play Again"
}: GameModalProps) {
    if (!isOpen) return null;

    // Type-based styling configuration
    const styles = {
        default: {
            bg: 'bg-white dark:bg-gray-800',
            border: 'border-gray-200 dark:border-gray-700',
            text: 'text-gray-900 dark:text-gray-100',
            glow: null,
            iconBg: 'bg-amber-100 dark:bg-amber-900/30',
            iconText: 'text-amber-600 dark:text-amber-400'
        },
        success: {
            bg: 'bg-white/10 backdrop-blur-xl',
            border: 'border-white/20',
            text: 'text-white', // Usually on dark/overlay background
            glow: 'bg-green-500/30',
            iconBg: 'bg-gradient-to-br from-green-400 to-emerald-500',
            iconText: 'text-white'
        },
        won: {
            bg: 'bg-white/10 backdrop-blur-xl',
            border: 'border-white/20',
            text: 'text-white',
            glow: 'bg-yellow-500/30',
            iconBg: 'bg-gradient-to-br from-yellow-400 to-amber-500',
            iconText: 'text-white'
        },
        danger: {
            bg: 'bg-white/10 backdrop-blur-xl',
            border: 'border-white/20',
            text: 'text-white',
            glow: 'bg-red-500/30',
            iconBg: 'bg-gradient-to-br from-red-500 to-rose-600',
            iconText: 'text-white'
        }
    };

    const currentStyle = styles[type];

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className={`
                relative w-full max-w-sm transform overflow-hidden rounded-2xl p-6 text-left align-middle shadow-xl transition-all animate-in zoom-in-95 duration-200
                ${currentStyle.bg} ${currentStyle.border} border
            `}>
                {/* Glow Effect */}
                {currentStyle.glow && (
                    <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl ${currentStyle.glow}`} />
                )}

                <div className="relative">
                    {/* Icon */}
                    <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${currentStyle.iconBg} mb-5`}>
                        {icon || (type === 'won' ? (
                            <svg className={`w-8 h-8 ${currentStyle.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className={`w-8 h-8 ${currentStyle.iconText}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        ))}
                    </div>

                    {/* Content */}
                    <div className="text-center">
                        <h3 className={`text-2xl font-black leading-6 ${currentStyle.text} mb-2 uppercase tracking-tight`}>
                            {title || (type === 'won' ? 'Victory!' : 'Notice')}
                        </h3>
                        <div className="mt-2">
                            <div className={`text-sm opacity-90 ${currentStyle.text}`}>
                                {description}
                            </div>
                        </div>

                        {/* Victory Stats - only for normal wins (not when description overrides) */}
                        {type === 'won' && !description && (time !== undefined || difficulty) && (
                            <div className="mt-6 grid grid-cols-2 gap-3">
                                {time !== undefined && (
                                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md">
                                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Time</div>
                                        <div className="text-2xl font-black text-white font-mono">{formatTime(time)}</div>
                                    </div>
                                )}
                                {difficulty && (
                                    <div className="bg-white/10 rounded-xl p-3 backdrop-blur-md">
                                        <div className="text-[10px] font-bold text-white/60 uppercase tracking-wider">Level</div>
                                        <div className="text-lg font-black text-white capitalize">{difficulty}</div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Actions */}
                        <div className="mt-8 flex gap-3 justify-center">
                            {children}
                            {onAction && (
                                <button
                                    type="button"
                                    className={`
                                        inline-flex justify-center rounded-xl px-6 py-3 text-sm font-bold shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 transition-transform active:scale-95
                                        ${type === 'won'
                                            ? 'bg-white text-yellow-600 hover:bg-yellow-50 focus:ring-yellow-500'
                                            : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500'
                                        }
                                    `}
                                    onClick={onAction}
                                >
                                    {actionLabel}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
