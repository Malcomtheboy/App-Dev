export type AdminSession<User> = {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
};

type Unsubscribe = () => void;
export type AdminConnection<User> = {
  onUserChanged: (next: (user: User | null) => void, error: (error: unknown) => void) => Unsubscribe;
  onAdminChanged: (user: User, next: (exists: boolean, fromCache: boolean) => void, error: (error: unknown) => void) => Unsubscribe;
  isCurrentUser: (user: User) => boolean;
};

export function authErrorMessage(error: unknown): string {
  const code = (error as { code?: string } | null)?.code;
  switch (code) {
    case "admin/missing-config":
      return "Firebase isn't configured. Add NEXT_PUBLIC_FIREBASE_* settings to apps/admin/.env.local and restart the admin server.";
    case "admin/project-mismatch":
      return "The Firebase project settings changed. Restart the admin server and reload this page.";
    case "auth/invalid-api-key":
    case "auth/api-key-not-valid.-please-pass-a-valid-api-key.":
    case "auth/app-not-authorized":
    case "auth/unauthorized-domain":
      return "Check the admin portal's Firebase web configuration, API key restrictions and authorized domains in Firebase Console.";
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "The email or password is incorrect.";
    case "auth/invalid-email":
      return "Enter a valid email address.";
    case "auth/missing-password":
      return "Enter your password.";
    case "auth/user-disabled":
      return "This account has been disabled. Contact the Firebase project owner.";
    case "auth/too-many-requests":
      return "Too many attempts. Please wait a little before trying again.";
    case "auth/operation-not-allowed":
      return "Email/password sign-in must be enabled in Firebase Console.";
    case "permission-denied":
      return "Admin access could not be verified. Ask the project owner to check Firestore rules and your admins/{uid} document.";
    case "unavailable":
    case "deadline-exceeded":
    case "auth/network-request-failed":
      return "Couldn't reach Firebase. Check your connection and try again.";
    default:
      return "Couldn't complete the request. Please try again or contact the project owner.";
  }
}

// One authorization pipeline for login, restored sessions and role revocation.
// Firestore rules remain the security boundary; this listener controls the UI.
export function observeAdminSession<User>(
  connect: () => AdminConnection<User>,
  update: (state: AdminSession<User>) => void,
  verificationTimeoutMs = 15_000,
): Unsubscribe {
  let active = true;
  let generation = 0;
  let stopRole: Unsubscribe | undefined;
  let stopAuth: Unsubscribe | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function clearRole() {
    stopRole?.();
    stopRole = undefined;
    clearTimeout(timer);
  }

  function publish(state: AdminSession<User>) {
    if (active) update(state);
  }

  publish({ user: null, isAdmin: false, loading: true, error: null });
  try {
    const connection = connect();
    stopAuth = connection.onUserChanged((user) => {
      if (!active) return;
      const currentGeneration = ++generation;
      clearRole();
      publish({ user, isAdmin: false, loading: !!user, error: null });
      if (!user) return;

      const current = () => active && generation === currentGeneration && connection.isCurrentUser(user);
      const deny = (error: string) => {
        if (current()) publish({ user, isAdmin: false, loading: false, error });
      };
      let verified = false;
      timer = setTimeout(() => deny("Couldn't verify admin access online. Check your connection and try again."), verificationTimeoutMs);
      try {
        stopRole = connection.onAdminChanged(user, (exists, fromCache) => {
          if (!current()) return;
          // A cached admin document is never enough to grant access.
          if (fromCache) {
            if (verified) deny("Connect to Firebase to verify your admin access again.");
            return;
          }
          verified = true;
          clearTimeout(timer);
          publish({
            user,
            isAdmin: exists,
            loading: false,
            error: exists ? null : "This account isn't authorized for the admin portal. Ask the project owner to add your UID to admins/{uid}.",
          });
        }, (error) => {
          if (!current()) return;
          clearTimeout(timer);
          deny(authErrorMessage(error));
        });
      } catch (error) {
        clearTimeout(timer);
        deny(authErrorMessage(error));
      }
    }, (error) => {
      if (!active) return;
      generation++;
      clearRole();
      publish({ user: null, isAdmin: false, loading: false, error: authErrorMessage(error) });
    });
  } catch (error) {
    clearRole();
    publish({ user: null, isAdmin: false, loading: false, error: authErrorMessage(error) });
  }

  return () => {
    active = false;
    generation++;
    clearRole();
    stopAuth?.();
  };
}
