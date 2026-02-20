import { db } from "./firebase";
import { ref, runTransaction, get } from "firebase/database";

export interface BattleRecord {
    opponentUid: string;
    opponentName: string;
    wins: number;
    losses: number;
}

/**
 * Record the result of one multiplayer game.
 * Uses runTransaction so concurrent writes (both players updating at the same time) are safe.
 */
export async function recordBattleResult(
    myUid: string,
    opponentUid: string,
    opponentName: string,
    iWon: boolean
): Promise<void> {
    const scoreRef = ref(db, `battleScores/${myUid}/${opponentUid}`);
    await runTransaction(scoreRef, (current) => {
        if (current === null) {
            return {
                opponentName,
                wins: iWon ? 1 : 0,
                losses: iWon ? 0 : 1,
            };
        }
        return {
            ...current,
            opponentName, // keep name up-to-date
            wins: (current.wins || 0) + (iWon ? 1 : 0),
            losses: (current.losses || 0) + (iWon ? 0 : 1),
        };
    });
}

/**
 * Fetch all battle records for a user, sorted by total games played (desc).
 */
export async function getBattleScores(myUid: string): Promise<BattleRecord[]> {
    const scoresRef = ref(db, `battleScores/${myUid}`);
    const snapshot = await get(scoresRef);
    if (!snapshot.exists()) return [];

    const raw = snapshot.val() as Record<string, { opponentName: string; wins: number; losses: number }>;
    return Object.entries(raw)
        .map(([opponentUid, data]) => ({
            opponentUid,
            opponentName: data.opponentName || "Unknown",
            wins: data.wins || 0,
            losses: data.losses || 0,
        }))
        .sort((a, b) => (b.wins + b.losses) - (a.wins + a.losses));
}
