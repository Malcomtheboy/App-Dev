"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/logo";
import { useAdminAuth } from "@/lib/admin-auth";
import { authErrorMessage } from "@/lib/admin-session";

export default function LoginPage() {
  const { user, isAdmin, loading, error: accessError, signIn, signOut, resetPassword, retryAccess } = useAdminAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    // Redirect only after the provider has confirmed admin access, not merely
    // after Firebase accepts the password.
    if (!loading && user && isAdmin) router.replace("/dashboard");
  }, [loading, user, isAdmin, router]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (submitting || loading) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await signIn(email, password);
      setPassword("");
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleResetPassword() {
    if (submitting || loading) return;
    setError(null);
    setNotice(null);
    if (!email.trim()) {
      setError("Enter your email address first, then choose Forgot password.");
      return;
    }
    setSubmitting(true);
    try {
      await resetPassword(email);
      setNotice("If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.");
    } catch (error) {
      // Do not disclose whether the entered email has a Firebase account.
      if ((error as { code?: string } | null)?.code === "auth/user-not-found") {
        setNotice("If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.");
      } else {
        setError(authErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSignOut() {
    if (submitting || loading) return;
    setError(null);
    setNotice(null);
    setSubmitting(true);
    try {
      await signOut();
    } catch (error) {
      setError(authErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  }

  const displayedError = error ?? accessError;

  return (
    <div className="flex flex-1 items-center justify-center px-4">
      <form
        onSubmit={handleSubmit}
        aria-busy={submitting || loading}
        className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
      >
        <Logo className="mx-auto h-24 w-auto" />
        <h1 className="mt-4 text-center text-xl font-semibold">Admin portal</h1>
        <p className="mt-1 text-center text-sm text-zinc-500">Sign in with an authorized admin account.</p>

        <label className="mt-6 block text-sm font-medium">
          Email
          <input
            type="email"
            name="email"
            autoComplete="username"
            required
            disabled={submitting || loading}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-300"
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Password
          <input
            type="password"
            name="password"
            autoComplete="current-password"
            required
            disabled={submitting || loading}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:focus:border-zinc-300"
          />
        </label>

        <button
          type="button"
          onClick={handleResetPassword}
          disabled={submitting || loading}
          className="mt-3 text-sm text-zinc-500 underline underline-offset-4 disabled:opacity-50"
        >
          Forgot password?
        </button>

        {displayedError && <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">{displayedError}</p>}
        {notice && <p role="status" className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{notice}</p>}
        {accessError && (
          <button type="button" onClick={() => { setError(null); retryAccess(); }} disabled={submitting || loading} className="mt-3 text-sm underline underline-offset-4 disabled:opacity-50">
            Check access again
          </button>
        )}
        {user && !isAdmin && !loading && (
          <p className="mt-3 break-words text-xs text-zinc-500">
            Signed in as {user.email}. <button type="button" onClick={handleSignOut} disabled={submitting} className="underline underline-offset-4 disabled:opacity-50">Sign out</button>
          </p>
        )}

        <button
          type="submit"
          disabled={submitting || loading || isAdmin}
          className="mt-6 w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-on transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {loading ? "Checking access…" : submitting ? "Please wait…" : "Sign in"}
        </button>
      </form>
    </div>
  );
}
