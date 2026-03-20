import { initializeApp } from "firebase/app";
import { getDatabase, ref, get } from "firebase/database";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const getRoom = async () => {
    try {
        const roomRef = ref(db, "rooms/P8MIG2");
        const snapshot = await get(roomRef);
        if (!snapshot.exists()) {
            console.log("Room P8MIG2 does not exist.");
        } else {
            console.log("Room Data:", JSON.stringify(snapshot.val(), null, 2));
        }
    } catch (error) {
        console.error("Error fetching room:", error);
    }
    process.exit(0);
};

getRoom();
