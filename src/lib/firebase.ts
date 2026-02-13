import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if we have an API key
const isConfigured = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

let app;
if (isConfigured) {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
} else {
  // Basic initialization for build-time without crashing
  app = !getApps().length ? initializeApp({ ...firebaseConfig, apiKey: "LEGIT_FORMAT_BUT_FAKE_KEY_FOR_BUILD" }) : getApp();
}

// Only initialize services if we have a real config to avoid auth/invalid-api-key errors
// During build/prerender, useEffects that use these won't run anyway.
const auth = isConfigured ? getAuth(app) : {} as any;
const db = isConfigured ? getDatabase(app) : {} as any;

export { app, auth, db };
