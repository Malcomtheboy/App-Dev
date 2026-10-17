import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

const APP_NAME = "rihla-admin-api";

let services: { auth: Auth; db: Firestore } | undefined;

export function getPrivilegedFirebaseServices(): { auth: Auth; db: Firestore } {
  if (services) return services;

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId || process.env.FIREBASE_AUTH_EMULATOR_HOST) {
    throw new Error("Privileged Firebase access requires a production FIREBASE_PROJECT_ID.");
  }

  const app = getApps().find((candidate) => candidate.name === APP_NAME)
    ?? initializeApp({ credential: applicationDefault(), projectId }, APP_NAME);

  if (app.options.projectId !== projectId) {
    throw new Error("Firebase Admin project changed; restart the API.");
  }

  services = { auth: getAuth(app), db: getFirestore(app) };
  return services;
}
