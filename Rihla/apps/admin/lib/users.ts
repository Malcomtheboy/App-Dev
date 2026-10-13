import { collection, getCountFromServer, getDocs, limit, orderBy, query } from "firebase/firestore";
import { db } from "./firebase";

// Matches what the mobile app writes at sign-up (apps/mobile/src/app/register.tsx).
export type AdminUser = {
  uid: string;
  displayName: string;
  email: string;
  createdAt: Date | null;
};

export type FirestoreProblem = { kind: "denied" | "other"; message: string };

export function describeFirestoreError(error: unknown): FirestoreProblem {
  const code = (error as { code?: string })?.code;
  if (code === "permission-denied") {
    return {
      kind: "denied",
      message:
        "Firestore refused the request. The rules in backend/firestore.rules need to be deployed, and this account needs an admins/{uid} document.",
    };
  }
  return { kind: "other", message: error instanceof Error ? error.message : "Could not reach the database." };
}

export async function fetchUsers(max = 200): Promise<AdminUser[]> {
  const snapshot = await getDocs(query(collection(db, "users"), orderBy("createdAt", "desc"), limit(max)));
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      uid: doc.id,
      displayName: typeof data.displayName === "string" ? data.displayName : "",
      email: typeof data.email === "string" ? data.email : "",
      createdAt: typeof data.createdAt?.toDate === "function" ? data.createdAt.toDate() : null,
    };
  });
}

export async function fetchUserCount(): Promise<number> {
  const snapshot = await getCountFromServer(collection(db, "users"));
  return snapshot.data().count;
}
