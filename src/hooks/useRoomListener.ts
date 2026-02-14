import { useEffect } from "react";
import { onValue, ref, onDisconnect } from "firebase/database";
import { db } from "@/lib/firebase";
import { useGameStore } from "@/hooks/useGameStore";
import { Room } from "@/lib/rooms";
import { useAuth } from "@/context/AuthContext";

export function useRoomListener(roomId: string | null) {
    const { user } = useAuth();
    const { setRemoteState } = useGameStore();

    useEffect(() => {
        if (!roomId || !user) return;

        const roomRef = ref(db, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.val() as Room;
                setRemoteState(roomData, user.uid);
            }
        });

        // Set up disconnect handler for dirty exits (tab close, crash)
        const playerStatusRef = ref(db, `rooms/${roomId}/players/${user.uid}/status`);
        const disconnectHandler = onDisconnect(playerStatusRef);
        disconnectHandler.set("disconnected");

        return () => {
            unsubscribe();
            // Cancel onDisconnect if we unmount cleanly (e.g. navigation), 
            // because explicit exit logic handles that case.
            disconnectHandler.cancel();
        };
    }, [roomId, setRemoteState, user]);
}
