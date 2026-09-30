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
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  type User,
} from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

type AdminAuthState = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthState | null>(null);

// Authorization lives in a Firestore "admins/{uid}" document rather than a
// custom claim, since setting claims needs the Admin SDK (a service account
// we don't have wired up here yet). Whoever owns the Firebase project adds a
// doc for each admin's uid by hand.
//
// Until backend/firestore.rules is deployed, Firestore's default rules deny
// this read entirely (not just "doc doesn't exist") — treat that the same
// as "not an admin" instead of letting it blow up as an unhandled rejection.
//
// NEXT_PUBLIC_ADMIN_DEMO_MODE skips the Firestore check entirely (any signed-in
// user is treated as admin) so the portal can be demoed locally before the
// admins collection's rules are deployed. Dev-only — .env.local isn't committed.
async function checkIsAdmin(user: User): Promise<boolean> {
  if (process.env.NEXT_PUBLIC_ADMIN_DEMO_MODE === "true") return true;
  try {
    const snap = await getDoc(doc(db, "admins", user.uid));
    return snap.exists();
  } catch (err) {
    console.warn("Admin check failed (rules not deployed yet?):", err);
    return false;
  }
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }
      const admin = await checkIsAdmin(firebaseUser);
      setUser(firebaseUser);
      setIsAdmin(admin);
      setLoading(false);
    });
  }, []);

  async function signIn(email: string, password: string) {
    const credential = await signInWithEmailAndPassword(auth, email, password);
    const admin = await checkIsAdmin(credential.user);
    if (!admin) {
      await firebaseSignOut(auth);
      throw new Error("This account isn't authorized for the admin portal.");
    }
  }

  async function signOut() {
    await firebaseSignOut(auth);
  }

  return (
    <AdminAuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
