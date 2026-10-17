import assert from "node:assert/strict";
import { test, type TestContext } from "node:test";
import { authErrorMessage, observeAdminSession, type AdminConnection, type AdminSession } from "./admin-session";

type User = { uid: string };
type RoleListener = {
  user: User;
  next: (exists: boolean, fromCache: boolean) => void;
  error: (error: unknown) => void;
  stopped: boolean;
};

// Deliberately retain callbacks after unsubscribe to simulate already-queued
// Firebase work arriving after logout, account switching or unmount.
class FakeFirebase {
  currentUser: User | null = null;
  authStopped = false;
  roles: RoleListener[] = [];
  roleFailure: unknown;
  private authNext: (user: User | null) => void = () => {};
  private authError: (error: unknown) => void = () => {};

  connection: AdminConnection<User> = {
    onUserChanged: (next, error) => {
      this.authNext = next;
      this.authError = error;
      return () => { this.authStopped = true; };
    },
    onAdminChanged: (user, next, error) => {
      if (this.roleFailure) throw this.roleFailure;
      const role = { user, next, error, stopped: false };
      this.roles.push(role);
      return () => { role.stopped = true; };
    },
    isCurrentUser: (user) => this.currentUser?.uid === user.uid,
  };

  userChanged(user: User | null) {
    this.currentUser = user;
    this.authNext(user);
  }

  failAuth(error: unknown) {
    this.authError(error);
  }
}

function observe(t: TestContext, timeout = 100) {
  const firebase = new FakeFirebase();
  const states: AdminSession<User>[] = [];
  const stop = observeAdminSession(() => firebase.connection, (state) => states.push(state), timeout);
  t.after(stop);
  const latest = () => states[states.length - 1];
  return { firebase, states, latest, stop };
}

const alice = { uid: "alice" };
const bob = { uid: "bob" };

test("a signed-out session finishes loading without requesting an admin document", (t) => {
  const { firebase, states, latest } = observe(t);
  assert.deepEqual(states[0], { user: null, isAdmin: false, loading: true, error: null });
  firebase.userChanged(null);
  assert.deepEqual(latest(), { user: null, isAdmin: false, loading: false, error: null });
  assert.equal(firebase.roles.length, 0);
});

test("admin access requires a server-confirmed document, never a cached document", (t) => {
  const { firebase, latest } = observe(t);
  firebase.userChanged(alice);
  assert.deepEqual(latest(), { user: alice, isAdmin: false, loading: true, error: null });
  firebase.roles[0].next(true, true);
  assert.equal(latest().isAdmin, false);
  assert.equal(latest().loading, true);
  firebase.roles[0].next(false, true);
  assert.equal(latest().loading, true);
  firebase.roles[0].next(true, false);
  assert.deepEqual(latest(), { user: alice, isAdmin: true, loading: false, error: null });
});

test("a server-confirmed missing admin document denies access with useful guidance", (t) => {
  const { firebase, latest } = observe(t);
  firebase.userChanged(alice);
  firebase.roles[0].next(false, false);
  assert.equal(latest().user, alice);
  assert.equal(latest().isAdmin, false);
  assert.equal(latest().loading, false);
  assert.match(latest().error ?? "", /isn't authorized.*admins\/\{uid\}/);
});

for (const code of ["permission-denied", "unavailable", "deadline-exceeded"]) {
  test(`admin document ${code} fails closed without exposing the raw error`, (t) => {
    const { firebase, latest } = observe(t);
    firebase.userChanged(alice);
    firebase.roles[0].error({ code, message: "secret-token-123" });
    assert.equal(latest().isAdmin, false);
    assert.equal(latest().loading, false);
    assert.equal(latest().error, authErrorMessage({ code }));
    assert.doesNotMatch(latest().error ?? "", /secret-token/);
  });
}

test("logout removes access immediately and ignores old role snapshots", (t) => {
  const { firebase, states, latest } = observe(t);
  firebase.userChanged(alice);
  const role = firebase.roles[0];
  role.next(true, false);
  firebase.userChanged(null);
  assert.equal(role.stopped, true);
  const count = states.length;
  role.next(true, false);
  role.error({ code: "permission-denied" });
  assert.equal(states.length, count);
  assert.deepEqual(latest(), { user: null, isAdmin: false, loading: false, error: null });
});

test("switching accounts clears old admin access and ignores the old account's result", (t) => {
  const { firebase, states, latest } = observe(t);
  firebase.userChanged(alice);
  firebase.roles[0].next(true, false);
  firebase.userChanged(bob);
  assert.deepEqual(latest(), { user: bob, isAdmin: false, loading: true, error: null });
  assert.equal(firebase.roles[0].stopped, true);
  assert.equal(firebase.roles[1].user, bob);
  const count = states.length;
  firebase.roles[0].next(true, false);
  assert.equal(states.length, count);
  firebase.roles[1].next(false, false);
  assert.equal(latest().user, bob);
  assert.equal(latest().isAdmin, false);
});

test("currentUser guards role results before an account-change observer is delivered", (t) => {
  const { firebase, states } = observe(t);
  firebase.userChanged(alice);
  firebase.currentUser = bob;
  const count = states.length;
  firebase.roles[0].next(true, false);
  firebase.roles[0].error({ code: "permission-denied" });
  assert.equal(states.length, count);
});

test("unmount unsubscribes both listeners and ignores queued callbacks", (t) => {
  const { firebase, states, stop } = observe(t);
  firebase.userChanged(alice);
  const role = firebase.roles[0];
  stop();
  assert.equal(firebase.authStopped, true);
  assert.equal(role.stopped, true);
  const count = states.length;
  role.next(true, false);
  role.error({ code: "unavailable" });
  firebase.failAuth({ code: "auth/network-request-failed" });
  firebase.userChanged(bob);
  assert.equal(states.length, count);
  assert.equal(firebase.roles.length, 1, "queued auth callbacks must not create subscriptions after unmount");
});

test("verification times out closed but a later server result can recover", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { firebase, latest } = observe(t);
  firebase.userChanged(alice);
  firebase.roles[0].next(true, true);
  t.mock.timers.tick(99);
  assert.equal(latest().loading, true);
  t.mock.timers.tick(1);
  assert.equal(latest().loading, false);
  assert.equal(latest().isAdmin, false);
  assert.match(latest().error ?? "", /verify admin access online/);
  firebase.roles[0].next(true, false);
  assert.deepEqual(latest(), { user: alice, isAdmin: true, loading: false, error: null });
});

test("a stale role error cannot cancel the new account's verification timeout", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { firebase, latest } = observe(t);
  firebase.userChanged(alice);
  firebase.userChanged(bob);
  firebase.roles[0].error({ code: "unavailable" });
  t.mock.timers.tick(100);
  assert.equal(latest().user, bob);
  assert.equal(latest().isAdmin, false);
  assert.equal(latest().loading, false);
  assert.match(latest().error ?? "", /verify admin access online/);
});

test("a verified admin is denied when revoked or when only cached access remains", (t) => {
  const { firebase, latest } = observe(t);
  firebase.userChanged(alice);
  const role = firebase.roles[0];
  role.next(true, false);
  role.next(false, false);
  assert.equal(latest().isAdmin, false);
  assert.equal(latest().loading, false);
  role.next(true, false);
  assert.equal(latest().isAdmin, true);
  role.next(true, true);
  assert.equal(latest().isAdmin, false);
  assert.match(latest().error ?? "", /Connect to Firebase/);
  role.next(true, false);
  assert.equal(latest().isAdmin, true);
});

test("auth observer failures clear access and unsubscribe the admin listener", (t) => {
  const { firebase, latest } = observe(t);
  firebase.userChanged(alice);
  const role = firebase.roles[0];
  role.next(true, false);
  firebase.failAuth({ code: "auth/network-request-failed" });
  assert.equal(role.stopped, true);
  assert.deepEqual(latest(), {
    user: null, isAdmin: false, loading: false,
    error: authErrorMessage({ code: "auth/network-request-failed" }),
  });
  role.next(true, false);
  assert.equal(latest().isAdmin, false);
});

test("synchronous configuration and listener setup errors fail closed", (t) => {
  const states: AdminSession<User>[] = [];
  const stop = observeAdminSession<User>(() => {
    throw { code: "admin/missing-config", message: "secret-config-value" };
  }, (state) => states.push(state));
  t.after(stop);
  assert.deepEqual(states[states.length - 1], {
    user: null, isAdmin: false, loading: false,
    error: authErrorMessage({ code: "admin/missing-config" }),
  });
  const { firebase, latest } = observe(t);
  firebase.roleFailure = { code: "permission-denied", message: "secret-config-value" };
  firebase.userChanged(alice);
  assert.equal(latest().isAdmin, false);
  assert.equal(latest().loading, false);
  assert.equal(latest().error, authErrorMessage({ code: "permission-denied" }));
});

test("auth errors map to safe, useful messages without exposing credentials", () => {
  const categories: [string[], RegExp][] = [
    [["admin/missing-config"], /\.env\.local/],
    [["admin/project-mismatch"], /Restart/],
    [["auth/invalid-api-key", "auth/api-key-not-valid.-please-pass-a-valid-api-key.", "auth/app-not-authorized", "auth/unauthorized-domain"], /configuration.*restrictions.*domains/],
    [["auth/invalid-credential", "auth/invalid-login-credentials", "auth/wrong-password", "auth/user-not-found"], /email or password is incorrect/],
    [["auth/invalid-email"], /valid email/],
    [["auth/missing-password"], /Enter your password/],
    [["auth/user-disabled"], /disabled/],
    [["auth/too-many-requests"], /Too many attempts/],
    [["auth/operation-not-allowed"], /enabled in Firebase Console/],
    [["permission-denied"], /Firestore rules.*admins\/\{uid\}/],
    [["unavailable", "deadline-exceeded", "auth/network-request-failed"], /connection/],
  ];
  for (const [codes, message] of categories) {
    for (const code of codes) {
      const result = authErrorMessage({ code, message: "secret-key-password-token" });
      assert.match(result, message, code);
      assert.doesNotMatch(result, /secret-key-password-token/);
    }
  }
  for (const error of [null, undefined, "secret-token", new Error("secret-token"), { code: "unknown", message: "secret-token" }]) {
    assert.equal(authErrorMessage(error), "Couldn't complete the request. Please try again or contact the project owner.");
  }
});
