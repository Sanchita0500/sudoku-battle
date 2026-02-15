import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { persist, devtools, PersistStorage } from 'zustand/middleware';
import { createGameSlice, GameSlice } from '@/store/gameSlice';

interface SinglePlayerState extends GameSlice {
    // Single player specific state can go here if needed in future
}

// Custom storage to handle Set serialization/deserialization
const storage: PersistStorage<SinglePlayerState> = {
    getItem: (name) => {
        const str = localStorage.getItem(name);
        if (!str) return null;
        return JSON.parse(str, (_key, value) => {
            if (value && typeof value === 'object' && value.__type === 'Set') {
                return new Set(value.value);
            }
            return value;
        });
    },
    setItem: (name, value) => {
        const str = JSON.stringify(value, (_key, val) => {
            if (val instanceof Set) {
                return { __type: 'Set', value: Array.from(val) };
            }
            return val;
        });
        localStorage.setItem(name, str);
    },
    removeItem: (name) => localStorage.removeItem(name),
};

export const useSinglePlayerStore = create<SinglePlayerState>()(
    devtools(
        persist(
            immer((set, get, store) => ({
                ...createGameSlice(set as any, get as any, store as any),
            })),
            {
                name: 'single-player-storage',
                storage: storage,
            }
        ),
        { name: 'SinglePlayerStore' }
    )
);
