
import { useEffect } from "react";
import { onValue, ref } from "firebase/database";
import { db } from "@/lib/firebase";
import { useGameStore } from "@/hooks/useGameStore";
import { Room } from "@/lib/rooms";
import { useAuth } from "@/context/AuthContext";

export function useRoomListener(roomId: string | null) {
    const { user } = useAuth();
    const { setRemoteState } = useGameStore();

    useEffect(() => {
        if (!roomId) return;

        const roomRef = ref(db, `rooms/${roomId}`);
        const unsubscribe = onValue(roomRef, (snapshot) => {
            if (snapshot.exists()) {
                const roomData = snapshot.val() as Room;

                // Update local game state based on room data if needed
                // Pass user.uid to sync local status from Firebase
                setRemoteState(roomData, user?.uid);

                // Handle opponent data
                // This logic might need refinement to identify "who is the opponent"
                // For now, we just pass the whole room data to store and let it decide or component decide
            }
        });

        return () => unsubscribe();
    }, [roomId, setRemoteState, user?.uid]);
}
