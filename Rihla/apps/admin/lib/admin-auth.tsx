"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { getFirebaseServices } from "./firebase";
import { observeAdminSession, type AdminSession } from "./admin-session";

type AdminAuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  retryAccess: () => void;
};

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AdminSession<User>>({
    user: null, isAdmin: false, loading: true, error: null,
  });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    return observeAdminSession(() => {
      const { auth, db } = getFirebaseServices();
      return {
        onUserChanged: (next, error) => onAuthStateChanged(auth, next, error),
        onAdminChanged: (user, next, error) => onSnapshot(
          doc(db, "admins", user.uid),
          { includeMetadataChanges: true },
          (snapshot) => next(snapshot.exists(), snapshot.metadata.fromCache),
          error,
        ),
        isCurrentUser: (user) => auth.currentUser?.uid === user.uid,
      };
    }, setState);
  }, [attempt]);

  async function signIn(email: string, password: string) {
    const { auth } = getFirebaseServices();
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async function signOut() {
    const { auth } = getFirebaseServices();
    await firebaseSignOut(auth);
  }

  async function resetPassword(email: string) {
    const { auth } = getFirebaseServices();
    await sendPasswordResetEmail(auth, email.trim());
  }

  return (
    <AdminAuthContext.Provider value={{ ...state, signIn, signOut, resetPassword, retryAccess: () => setAttempt((value) => value + 1) }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
