# Rihla Admin

Next.js admin portal using the Firebase JavaScript SDK. The existing dashboard,
content pages and user list are unchanged. No service-account private key belongs
in this project or in a `NEXT_PUBLIC_*` variable.

## Local configuration

1. Copy `.env.example` to `.env.local` and fill in the Firebase **web app** settings
   from the same project used by mobile (`rihla-31cd5`). The corresponding mobile
   settings use the prefix `EXPO_PUBLIC_FIREBASE_`; admin uses `NEXT_PUBLIC_FIREBASE_`.
   Do not copy Gemini, Quran Foundation or service-account secrets into this file.
2. In Firebase Console, enable Authentication → Email/Password. Use an existing
   Firebase Auth account or create one in the console; the portal has no public
   admin registration. A mobile account alone does **not** grant admin access.
3. The Firebase project owner must create a Firestore document `admins/{uid}`, with
   the document ID equal to the intended admin's Authentication UID. For example,
   it may contain a `label` string. Only the document's existence is used for roles.
   Never let the client create or modify admin documents.
4. Review the **currently deployed** Firestore rules before changing them. The
   tracked `../../backend/firestore.rules` mirrors what was published to project
   `rihla-31cd5` on 2026-10-17: users may read their own admin document, clients
   cannot write `admins`, and verified admins may read root `users` documents.
   Rules are not automatically deployed by this app. Preserve any later production
   collections/rules. An admin UID document is not secure if deployed rules allow
   users to create one themselves.
5. Check Firebase authorized domains and any API-key restrictions for the admin
   hostname. After changing `.env.local`, restart Next.js; public variables are
   inlined into the browser bundle.

Run the admin portal on a different port from Express:

```sh
npm run dev -- --port 3001
```

Open <http://localhost:3001/login>. Express continues to use port 3000. Point
`NEXT_PUBLIC_API_URL` at the Express server, not at the admin portal; use HTTPS in
production. Firebase login/user reads work independently of Express.

The Users page loads basic rows through the existing Firestore rules. Its account
detail and activate/disable controls call the protected Express admin routes. For
those controls, the API needs Application Default Credentials as documented in
`../api/README.md`; credentials always stay on the API server. If the API is down
or lacks credentials, those controls show an error and no account is changed.

## Authentication and authorization

- Firebase validates the email/password. Password reset sends Firebase's reset
  email, with a neutral response that does not reveal whether an account exists.
- One auth listener handles sign-in, restored sessions, account switching and
  sign-out. Login redirects only after that listener has verified admin access.
- A live Firestore listener checks `admins/{uid}`. Cached documents alone never
  authorize the UI. Removing a role or losing verification hides admin content.
  Offline/unavailable verification fails closed and offers retry, not demo access.
- There is **no demo-mode authorization bypass**, even if an old environment file
  still contains `NEXT_PUBLIC_ADMIN_DEMO_MODE=true`.
- The existing Firebase browser persistence is retained; it normally restores a
  session after a reload/browser restart until sign-out. The admin role is checked
  online again on each restored session. Verify this in the intended browser.
- The React route guard is navigation/UX, **not a security boundary**. User data is
  requested from the browser through Firebase and must be protected by deployed
  Firestore rules. Privileged account changes go through Express, which independently
  verifies a current ID token and `admins/{uid}` role before using Firebase Admin.
  Any future Next.js server action/route must do the same.

## Checks and manual testing

```sh
npm test
npm exec next typegen
npm exec tsc -- --noEmit --incremental false
npm run lint
```

The session tests use fake Firebase callbacks, not a live Firebase project. They
cover authorization, cache rejection, revocation, late callbacks after logout or
account changes, timeouts and safe errors. Type generation is not a native or
production build.

Before sharing the portal, test an ordinary account (denied), an authorized admin,
refresh/direct `/users` navigation, password reset, sign-out, offline behavior and
admin-role removal. Check in Firebase Console/Rules Playground that ordinary users
cannot list `users` or create/change `admins` documents. Automated tests alone do
not prove live configuration; an authorized live login and user-list read were
also verified manually on 2026-10-17.
