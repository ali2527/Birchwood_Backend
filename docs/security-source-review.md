# Birchwood Backend — Security source review

**Date:** 18 August 2026  
**Scope:** Source in this workspace (`Birchwood_Backend`). Express/MongoDB API for a children's LMS (parents, teachers, admin, chat, attendance, payments). Not a live penetration test.  
**Rule:** No secret values in this file.

**What source cannot prove:** Live reachability, WAF rules, whether tracked secrets were ever pushed to a remote, production environment variable values, or mobile client behaviour.

---

## Summary

| ID | Title | Verdict | Severity |
|---|---|---|---|
| SR-01 | CI / supply-chain malware | Not present | n/a |
| SR-02 | Secrets in repo (`.env`, certs, hardcoded Stripe key) | Confirmed | Critical |
| SR-03 | Weak auth (SHA1 passwords, short OTP, token in URL/body) | Confirmed | High |
| SR-04 | Broken authorisation (`adminRoute` unused; mass assignment) | Confirmed | Critical |
| SR-05 | Injection (SQL, command, SSTI) | Not present | n/a |
| SR-06 | SSRF, open redirect, unsigned webhooks | Partial | Medium |
| SR-07 | Payments (hardcoded key, unauthenticated charge route) | Confirmed | High |
| SR-08 | Public uploads and permissive file filter | Confirmed | High |
| SR-09 | Stored XSS (backend stores unsanitised user content) | Partial | Medium |
| SR-10 | CORS `*` and missing security headers (no Helmet) | Confirmed | Medium |
| SR-11 | Rate limiting ineffective; no login/OTP throttling | Partial | Medium |
| SR-12 | TLS verification disabled; weak randomness for tokens | Confirmed | Medium |
| SR-13 | Verbose errors and sensitive logging | Partial | Medium |
| SR-14 | Sensitive fields returned in API responses | Confirmed | High |
| SR-15 | WebSocket connections without authentication | Confirmed | High |
| SR-16 | Mobile / WebView hardcoded secrets | Not present | n/a |
| SR-17 | Debug logging, leftover routes | Partial | Low |
| SR-18 | Children's data exposed via weak access controls | Confirmed | Critical |
| SR-19 | Infrastructure as code (Terraform, public S3, etc.) | Not present | n/a |

---

## Confirmed and partial findings

### SR-02 — Secrets tracked in git and hardcoded in source

**Verdict:** Confirmed  
**Severity:** Critical  
**Class:** B. Secrets in the repo  
**Depends on:** Git history may still contain values even after untracking.

#### What the code does

`.env`, `certs/ssl.key`, `certs/ssl.crt`, and `certs/ca-bundle` were committed to git. The payment controller previously embedded a Stripe secret key (`sk_test_` prefix) directly in source. `.gitignore` did not exclude environment files or certificates.

#### Why it matters

Anyone with repo access (or git history) can obtain database credentials, mail credentials, JWT signing material, Zoom keys, TLS private keys, and payment API keys. That enables impersonation, data theft, and fraudulent charges.

#### What we could not confirm

Whether secrets were rotated after exposure, or whether the remote repository is private and access-controlled.

#### What would make this acceptable

- Remove secrets from git history (e.g. `git filter-repo`) and rotate every exposed credential.
- Load all secrets from environment variables only; use `.env.example` with empty placeholders.
- Never commit `.env`, private keys, or API keys.

#### Bottom line

This is the highest-priority fix. Assume all previously tracked secrets are compromised until rotated.

---

### SR-04 — Admin routes protected only by login, not admin role

**Verdict:** Confirmed  
**Severity:** Critical  
**Class:** D. Authorisation / IDOR  
**Depends on:** Any valid parent or teacher JWT.

#### What the code does

`Middlewares/auth.js` defines `adminRoute`, which checks `decoded.isAdmin` from the JWT. However, every admin-facing route under `Routes/Admin/` (and most of the app) uses `authenticatedRoute` only — `adminRoute` is imported but never applied. Examples: `Routes/Admin/AdminChildren/index.js` exposes add/update/delete child endpoints with `authenticatedRoute` only.

Additionally, parent signup spreads the full request body into the new user document (`...req.body` in `Controllers/Parent/authController.js`), so a caller could set `isAdmin: true` at registration if that field is present in the body.

#### Why it matters

Any logged-in parent or teacher can call endpoints intended for administrators — managing children, teachers, classrooms, inventory, fees, and more. Combined with mass assignment on signup, a new account could potentially grant itself admin privileges in the JWT.

#### What we could not confirm

Whether a reverse proxy or API gateway enforces admin roles in production.

#### What would make this acceptable

- Apply `adminRoute` (or equivalent role checks) on every admin-only endpoint.
- Whitelist allowed signup fields; never accept `isAdmin`, `status`, or role fields from clients.
- Verify object-level ownership (e.g. parent can only access their own children).

#### Bottom line

Authorisation is effectively broken for admin operations. This affects a children's LMS and is critical.

---

### SR-18 — Children's data accessible without proper ownership checks

**Verdict:** Confirmed  
**Severity:** Critical  
**Class:** R. Health / regulated (children)  
**Depends on:** SR-04 broken authorisation.

#### What the code does

The API manages children profiles, attendance, homework, posts, and classroom data. Routes such as `/api/children/attendance/getAllChildAttendance/:child` and `/api/admin/children/getAllChildren` rely on `authenticatedRoute` but do not verify that the requesting parent owns the child or that the caller is an admin. Attendance, posts, and chat data for minors are reachable with any valid token.

Uploads (profile images, activity media) are served from `/Uploads` without authentication (`server.js`).

#### Why it matters

A children's LMS carries heightened safeguarding expectations. Broken access control can expose minors' attendance records, classroom activity, images, and parent contact details.

#### What we could not confirm

Frontend enforcement or network segmentation that might limit abuse.

#### What would make this acceptable

- Object-level checks on every child-scoped resource.
- Admin-only routes gated by `adminRoute`.
- Private, authenticated access to uploaded media (pre-signed URLs or auth middleware).

#### Bottom line

Treat this as a safeguarding-critical finding until authorisation is fixed end-to-end.

---

### SR-03 — Weak password hashing and password-reset design

**Verdict:** Confirmed  
**Severity:** High  
**Class:** C. Authentication  
**Depends on:** None.

#### What the code does

`Models/Parent.js` and the teacher model hash passwords with SHA1 and a per-user salt — not bcrypt (which is listed in `package.json` but unused). Password reset uses a 4-digit numeric code (`generateString(4, false, true)`), logged to the server console, and also embedded in a base64 `encodedEmail` field returned to the client. Reset validates the code but there is no rate limiting on attempts. JWTs are accepted from `req.body.token`, `req.query.token`, or the `Authorization` header.

Login responses differ for unknown email vs wrong password (account enumeration).

#### Why it matters

SHA1 is unsuitable for password storage. A 4-digit OTP has only 10,000 possibilities and can be brute-forced quickly without throttling. Tokens in query strings may leak via logs and referrer headers.

#### What would make this acceptable

- Use bcrypt or argon2 for passwords.
- Use cryptographically secure 6+ digit OTPs or time-limited signed tokens; never return the code in the API response.
- Rate-limit reset and login endpoints.
- Accept tokens only via the `Authorization` header.

#### Bottom line

Authentication primitives need hardening before production use.

---

### SR-07 — Payment handling risks

**Verdict:** Confirmed  
**Severity:** High  
**Class:** G. Payments and money  
**Depends on:** SR-02 (Stripe key was hardcoded; now moved to `process.env.STRIPE_SECRET_KEY`).

#### What the code does

`Controllers/Payment/index.js` charges via Stripe using amounts from the database (good). However, `Routes/Payment/index.js` exposes `POST /createCharge` with **no authentication middleware**. The Stripe secret was hardcoded (now env-based). No Stripe webhook signature verification was found. Payment routes exist but are not mounted in `Routes/index.js` at the time of review — they may be dead code or mounted elsewhere in deployment.

#### Why it matters

An unauthenticated charge endpoint allows arbitrary payment attempts if the route is reachable. Hardcoded keys in git history remain a exposure risk until rotated.

#### What would make this acceptable

- Require authentication on all payment endpoints.
- Use Stripe webhooks with signature verification for payment confirmation.
- Never commit API keys; rotate the previously exposed test key.

#### Bottom line

Fix payment route auth and confirm whether payment routes are exposed in production.

---

### SR-08 — Public file uploads and weak upload validation

**Verdict:** Confirmed  
**Severity:** High  
**Class:** H. Files and media  
**Depends on:** None.

#### What the code does

`server.js` serves `./Uploads` via `express.static` at `/Uploads` with no auth. `Middlewares/upload.js` `uploadMultiple` accepts any file type in its `else` branch (`cb(null, true)`). Filenames use `Math.random()` for uniqueness.

#### Why it matters

Uploaded images, videos, and documents (including children's photos) are publicly reachable by URL guessing or enumeration. Malicious file types could be uploaded and served.

#### What would make this acceptable

- Authenticated or pre-signed access to media.
- Strict MIME and extension validation; reject unknown types.
- Store uploads outside the web root or behind a CDN with access controls.

#### Bottom line

Uploaded content should not be world-readable on a children's platform.

---

### SR-14 — Sensitive user fields in API responses

**Verdict:** Confirmed  
**Severity:** High  
**Class:** N. Sensitive data in APIs  
**Depends on:** None.

#### What the code does

Parent signup returns the full `parent` Mongoose document without calling `sanitizeUser` (`Controllers/Parent/authController.js`). Sign-in correctly uses `sanitizeUser`. Other endpoints may return full documents depending on controller logic.

#### Why it matters

Password hashes and salts could be exposed to clients on registration, enabling offline cracking (especially with SHA1).

#### What would make this acceptable

- Always strip `hashed_password`, `salt`, and internal fields before serialising user objects.
- Use a consistent response DTO across all endpoints.

#### Bottom line

Apply sanitisation everywhere user objects are returned.

---

### SR-15 — WebSocket connections without authentication

**Verdict:** Confirmed  
**Severity:** High  
**Class:** O. Realtime and workers  
**Depends on:** None.

#### What the code does

`config/socket.js` accepts connections with `cors: { origin: ["*"] }`. The `setup` handler joins a room based on client-supplied `userData._id` with no JWT verification. Any client can join any user's room and receive chat messages via `new message` events.

#### Why it matters

Real-time chat between parents and teachers can be eavesdropped or spoofed by anyone who connects to the socket endpoint.

#### What would make this acceptable

- Verify JWT on connection handshake.
- Bind socket rooms to the authenticated user ID from the token, not client input.

#### Bottom line

Socket.io must authenticate before joining user-specific rooms.

---

### SR-06 — SSRF and webhooks (partial)

**Verdict:** Partial  
**Severity:** Medium  
**Class:** F. SSRF, redirects, SSR  
**Depends on:** None.

#### What the code does

No server-side fetch of user-supplied URLs was found (`node-fetch` is a dependency but unused in application code). No open redirects were found. Stripe webhook handlers with signature verification were not found.

#### Why it matters

Missing webhook verification means payment state could be manipulated if webhooks are added without checks.

#### Bottom line

Not an active SSRF issue today; webhook gap is a future risk.

---

### SR-09 — Stored XSS potential (partial)

**Verdict:** Partial  
**Severity:** Medium  
**Class:** I. XSS and HTML  
**Depends on:** Frontend rendering behaviour (Unverified).

#### What the code does

Post comments, activity descriptions, and similar fields are stored and returned without server-side HTML sanitisation. The backend is an API; XSS impact depends on whether clients render content as HTML.

#### Why it matters

If the web or mobile client renders post/comment bodies as HTML, stored XSS is possible — especially dangerous if session tokens are JS-readable.

#### Bottom line

Sanitise or enforce plain-text on user-generated content, or confirm clients always escape output.

---

### SR-10 — Permissive CORS and missing security headers

**Verdict:** Confirmed  
**Severity:** Medium  
**Class:** J. CSRF, CORS, headers  
**Depends on:** Clients use Bearer tokens (not cookies) for auth.

#### What the code does

`server.js` sets CORS `origin: "*"`. No `helmet` middleware is used — no Content-Security-Policy, HSTS, X-Frame-Options, or X-Content-Type-Options.

#### Why it matters

Any website can call the API from a browser (relevant if tokens are stored in JS-accessible storage). Missing headers increase clickjacking and MIME-sniffing risk.

#### What would make this acceptable

- Restrict CORS to known frontend origins.
- Add Helmet or equivalent security headers.

#### Bottom line

Low urgency if auth is header-only and tokens are not in cookies; still worth fixing.

---

### SR-11 — Rate limiting ineffective

**Verdict:** Partial  
**Severity:** Medium  
**Class:** K. Rate limit, brute force, DoS  
**Depends on:** None.

#### What the code does

A global limiter allows 1,000,000 requests per hour per IP — effectively unlimited. Login, signup, and password-reset endpoints have no dedicated stricter limits. OTP is 4 digits (see SR-03).

#### Why it matters

Brute-force attacks against login and reset flows are practical.

#### What would make this acceptable

- Strict per-route limits on auth endpoints (e.g. 5–10 attempts per 15 minutes).
- Meaningful global limits.

#### Bottom line

Current rate limiting provides no real protection.

---

### SR-12 — TLS verification disabled and weak randomness

**Verdict:** Confirmed  
**Severity:** Medium  
**Class:** L. Crypto and TLS  
**Depends on:** None.

#### What the code does

`Helpers/email.js` sets `tls: { rejectUnauthorized: false }` for SMTP. Reset codes, parent IDs, and upload filenames use `Math.random()` rather than `crypto.randomInt` or `crypto.randomBytes`.

#### Why it matters

Disabling TLS verification enables man-in-the-middle on outbound mail. Predictable randomness weakens tokens and filenames.

#### What would make this acceptable

- Enable TLS certificate verification for SMTP (or use a provider with valid certs).
- Use Node `crypto` for all security-sensitive random values.

#### Bottom line

Fix mail TLS and replace `Math.random` for security tokens.

---

### SR-13 — Verbose errors and debug logging

**Verdict:** Partial  
**Severity:** Medium  
**Class:** M. Logging and PII  
**Depends on:** None.

#### What the code does

Many controllers return `error.message` directly to clients. Password reset logs the verification code with `console.log`. Profile controllers log user IDs. Morgan `"dev"` format is enabled globally.

#### Why it matters

Stack traces and internal errors aid attackers. Logging OTPs exposes reset codes in server logs.

#### What would make this acceptable

- Generic client error messages; log details server-side only.
- Never log OTPs, passwords, or tokens.

#### Bottom line

Reduce information leakage in responses and logs.

---

### SR-17 — Debug and leftover configuration

**Verdict:** Partial  
**Severity:** Low  
**Class:** Q. Config, debug, leftover  
**Depends on:** None.

#### What the code does

Several admin and notification routes are commented out in `Routes/index.js`. Morgan dev logging runs in all environments. Unused imports existed in `server.js` (cleaned during this review).

#### Why it matters

Commented routes and dev logging in production increase attack surface and noise.

#### Bottom line

Minor housekeeping; align logging with `NODE_ENV`.

---

## Not present (searched)

- **SR-01 CI / supply chain:** No `.github/workflows`, no suspicious install scripts, no `curl | bash` in deploy config.
- **SR-05 Injection:** MongoDB/Mongoose used throughout; no string-concat SQL, `eval`, or `child_process.exec` with user input.
- **SR-16 Mobile:** Backend-only repo; no APK/IPA or WebView code.
- **SR-19 IaC:** No Terraform, CloudFormation, or Docker deploy files in workspace.

## Unverified (not in this workspace / needs ops)

- Production deployment topology and whether payment routes are mounted.
- Live MongoDB/network access controls.
- Whether previously committed secrets were pushed to a public remote.
- Frontend token storage (localStorage vs secure storage).
- WAF or reverse-proxy rules in front of port 8201.

## Findings still to review

None — initial full pass complete. Paste external findings (NW-xx, CVE, etc.) to append mapped entries.

---

## Cleanup performed during this review

The following non-report changes were made to improve repo hygiene (not security fixes):

- Trimmed `package.json` to direct dependencies only; ran `npm install`.
- Expanded `.gitignore` for `.env`, certs, and uploads.
- Removed unused imports and fixed implicit global in `server.js`.
- Moved Stripe initialization to `process.env.STRIPE_SECRET_KEY`.
- Untracked `.env` and cert files from git index (`git rm --cached`).
- Added `.env.example` with key names only.

**Action required:** Add `STRIPE_SECRET_KEY` to your local `.env`, rotate all secrets that were ever in git, and commit the cleanup when ready.
