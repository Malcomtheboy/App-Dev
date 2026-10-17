import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

let services: { auth: Auth; db: Firestore } | undefined;

// Initialize on use, not on import: an unconfigured portal must still be able
// to render its login page and explain which public settings are missing.
export function getFirebaseServices() {
  if (services) return services;
  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
    throw Object.assign(new Error("Firebase configuration is missing."), {
      code: "admin/missing-config",
    });
  }

  const app = getApps().some((app) => app.name === "[DEFAULT]") ? getApp() : initializeApp(firebaseConfig);
  if (app.options.projectId !== firebaseConfig.projectId) {
    throw Object.assign(new Error("Firebase project configuration changed. Restart the admin server."), {
      code: "admin/project-mismatch",
    });
  }
  services = { auth: getAuth(app), db: getFirestore(app) };
  return services;
}
