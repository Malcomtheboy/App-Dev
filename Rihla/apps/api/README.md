# Gemini API authentication

Use Node.js 22 or newer (required by the installed Firebase Admin SDK).

Set the variables from `.env.example` in `apps/api/.env` (or in the server's
environment). `FIREBASE_PROJECT_ID` must match the mobile app's
`EXPO_PUBLIC_FIREBASE_PROJECT_ID`; for Rihla this is `rihla-31cd5`.
`GEMINI_API_KEY` stays on the API server. No Admin SDK private key is needed
for this endpoint: `verifyIdToken()` validates Firebase ID tokens using Google's
public signing certificates. The server needs outbound HTTPS access to Google.

`POST /api/ai/ask` requires `Authorization: Bearer <Firebase ID token>`.
It validates the signature, issuer, audience and expiration before calling
Gemini. Missing or invalid tokens return `401`, verification/configuration
failures return `503`, and rate limits return `429` with `Retry-After`.
Requests may include `level` (`new`, `beginner` or `advanced`) alongside
`message` and `history`. Responses contain `{ "reply": "...", "sources": [...] }`;
the server checks source references before returning them. Errors remain
`{ "error": "..." }`.

Limits are 5 requests per Firebase UID per minute and 8 requests across all users
per minute, in addition to the existing general API limit. Counters are held in
memory per API process and reset on restart. Use a shared rate-limit store before
running multiple API instances. Failed authentication does not consume the
Gemini limits. Auth emulator mode is deliberately rejected.

The mobile app retrieves a current ID token for each request. Configure
`EXPO_PUBLIC_API_URL` with an **HTTPS** API URL outside local development to
protect bearer tokens in transit. Never put `GEMINI_API_KEY` or Admin credentials
in the mobile app. Release builds reject HTTP for AI requests. Basic Gemini token
verification does not check account disablement or token revocation; already-issued
tokens can remain valid until they expire.

## Privileged admin routes

`GET /api/admin/users/:uid` and `PATCH /api/admin/users/:uid/status` are used by
the admin portal. They verify the Firebase ID token with revocation checking,
then verify the caller against `admins/{uid}` before reading or changing another
account. The status route accepts `{ "disabled": true | false }` and refuses to
disable the current administrator's own account.

These operations require Firebase Admin privileges. In hosted Google environments,
use the runtime's Application Default Credentials. For local development, set
`GOOGLE_APPLICATION_CREDENTIALS` to a service-account JSON file stored **outside**
the repository. Never copy that file into `apps/api`, the mobile app, the admin
portal, Git, or any `NEXT_PUBLIC_*`/`EXPO_PUBLIC_*` variable. Without credentials,
the routes fail closed with `503`; Gemini token verification continues to work as
before without a private key.

Run `npm test` and `npx tsc --noEmit` in `apps/api` for local checks. The test
command runs both the source-parser tests in `src/` and the security/integration tests in
`tests/`. Tests use isolated HTTP handlers, test tokens and mocked upstream
responses; they do not call the live Gemini service.
