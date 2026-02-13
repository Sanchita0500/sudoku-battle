"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from "firebase/auth";
import { auth } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  playerName: string;
  setPlayerName: (name: string) => void;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [playerName, setPlayerNameState] = useState<string>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sudoku_player_name") || "";
    }
    return "";
  });

  const setPlayerName = (name: string) => {
    setPlayerNameState(name);
    localStorage.setItem("sudoku_player_name", name);
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser && !playerName) {
        setPlayerName(currentUser.displayName || "");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [playerName]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    // Force account picker to show, allowing users to select from logged-in accounts
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google", error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
    } catch (error) {
      console.error("Error signing out", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, playerName, setPlayerName, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
