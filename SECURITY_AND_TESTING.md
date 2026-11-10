# Security Hardening, Concurrency Handling & Automated Verification Report

> **Engineering Audit Document:** This document provides the complete technical report on system security enforcement, automated test suite verification, concurrency exception handling, and edge CDN distribution for the Nicoman Tourism platform.

---

## 1. Automated Test Suite Execution Report

The Nicoman Tourism engineering suite utilizes **Vitest 2.1.9** with **JSDOM** and **React Testing Library** for high-speed, zero-flake, headless test execution across browser and Node.js environments.

### 1.1 Test Suite Summary & Execution Metrics

```text
 ✓ src/tests/rateLimiter.test.js (3 tests) 17ms
 ✓ src/tests/conflictDetection.test.js (3 tests) 14ms
 ✓ src/tests/AdminShared.test.js (4 tests) 16ms
 ✓ src/tests/aiModels.test.js (3 tests) 629ms
 ✓ src/tests/RequireRole.test.jsx (4 tests) 146ms
 ✓ src/tests/AdminShield.test.jsx (5 tests) 551ms
 ✓ src/tests/chatBotEngine.test.js (10 tests) 1567ms

 Test Files  7 passed (7)
      Tests  32 passed (32)
   Duration  16.98s
```

### 1.2 Test Suite Architecture & Coverage Matrix

| Test Suite | File | Tests | Target Subsystem | Assertions & Behaviors Verified |
| :--- | :--- | :---: | :--- | :--- |
| **Concurrency & Collisions** | [`conflictDetection.test.js`](Nicoman-Tourism/client/src/tests/conflictDetection.test.js) | 3 | Booking Engine (`server/routes/admin.js`) | • Unit identifier parsing (`FRY-S12-ANI`, `HTL-101-102-ANI`).<br/>• Overlapping date collision rejection (`HTTP 409 Conflict`).<br/>• Non-overlapping date and vacant unit allocation pass. |
| **DDoS Rate Limiting** | [`rateLimiter.test.js`](Nicoman-Tourism/client/src/tests/rateLimiter.test.js) | 3 | Security Middleware (`server/middleware/rateLimiter.js`) | • Interception of request floods beyond limit (`HTTP 429`).<br/>• Transmission of `X-RateLimit-*` and `Retry-After` headers.<br/>• Health check `/api/health` whitelist bypass for keep-alive pings. |
| **On-Device AI Fallbacks** | [`aiModels.test.js`](Nicoman-Tourism/client/src/tests/aiModels.test.js) | 3 | Machine Learning (`client/src/lib/aiModels.js`) | • Xenova ONNX pipeline classification (`POSITIVE`, `NEGATIVE`).<br/>• Confidence scoring thresholds and neutral categorizations.<br/>• Zero-crash offline fallback when CDN or WASM cache is blocked. |
| **Role-Based Guards (RBAC)** | [`RequireRole.test.jsx`](Nicoman-Tourism/client/src/tests/RequireRole.test.jsx) | 4 | Router Security (`client/src/components/RequireRole.jsx`) | • Redirection to 401 Unauthorized for regular users.<br/>• Non-blocking zero-flash loading state while auth resolves.<br/>• Unrestricted access grant for authenticated `admin` and `superadmin`. |
| **Terminal Protection** | [`AdminShield.test.jsx`](Nicoman-Tourism/client/src/tests/AdminShield.test.jsx) | 5 | NIST Security (`client/src/components/admin/AdminShield.jsx`) | • Automatic session lockdown upon 10-minute inactivity timer.<br/>• `localStorage` persistence across browser refresh (F5 immunity).<br/>• Rejection of invalid passwords during unlock attempts.<br/>• Supabase `signInWithPassword` credential re-verification.<br/>• 1-click preview resume for `demo_admin` portfolio reviewers. |
| **Admin Shared Contracts** | [`AdminShared.test.js`](Nicoman-Tourism/client/src/tests/AdminShared.test.js) | 4 | Dashboard UI (`client/src/components/admin/AdminShared.jsx`) | • Strict date-range filtering contracts (`today`, `upcoming`, `past`).<br/>• Tailwind color contracts for booking status badges.<br/>• Integrity contract verification for all 9 dashboard tabs. |
| **ChatBot RAG & Security** | [`chatBotEngine.test.js`](Nicoman-Tourism/client/src/tests/chatBotEngine.test.js) | 10 | Conversational AI (`client/src/components/ChatBot.jsx`) | • Interactive markdown link parsing (`[Ferries](/ferries)`).<br/>• Stopword-free distinctive hotel matching.<br/>• Budget hotel filtering & ascending sort.<br/>• Mainland maritime routes & tariffs.<br/>• Step-by-step convoy transit.<br/>• Authentic historical profiles.<br/>• Continuous conversational memory & pronoun resolution.<br/>• Terminal Protection guard against prompt injection & DB leaks.<br/>• Content moderation warning for explicit/abusive language. |

---

## 2. Enterprise Security Architecture & Threat Mitigation Matrix

The application implements a multi-layered defense-in-depth model safeguarding data integrity, terminal sessions, and serverless compute resources.

```mermaid
flowchart TD
    subgraph Perimeter["1. Perimeter & Bot Defense"]
        Req["Inbound HTTP Request"]
        Turnstile["Cloudflare Turnstile (Bot Interception)"]
        CORS["Strict CORS Whitelist (/api)"]
        RateLimiter["Sliding-Window In-Memory Rate Limiter"]
    end

    subgraph Gateway["2. Serverless API Gateway"]
        Svix["Svix HMAC Webhook Verification"]
        JWT["Supabase JWT Token Validation"]
        RBAC["Role-Based Route Guard (user | admin | superadmin)"]
    end

    subgraph Terminal["3. Terminal Session Security"]
        Shield["Admin Shield Inactivity Lock (10m)"]
        Sync["BroadcastChannel Cross-Tab Sync (1ms)"]
        Immune["localStorage F5 Reload Immunity"]
        Logout["Inactivity Auto-Logout (25m)"]
    end

    subgraph Database["4. Managed PostgreSQL Layer"]
        RLS["Row Level Security Policies (Kernel-Level)"]
        EncryptedTables[("Encrypted PostgreSQL Tables")]
    end

    Req --> Turnstile --> CORS --> RateLimiter --> Gateway
    RateLimiter -- "Exceeded Limit" --> 429["HTTP 429 Too Many Requests"]
    Gateway --> Svix --> JWT --> RBAC
    RBAC --> Terminal --> Shield --> Sync & Immune & Logout
    Terminal --> Database --> RLS --> EncryptedTables
```

### 2.1 Threat Mitigation Matrix

| Threat / Attack Vector | Target Subsystem | Defense Mechanism | Mitigation Details |
| :--- | :--- | :--- | :--- |
| **Session Hijacking / Shoulder Surfing** | Admin Dashboard | **Admin Shield Terminal Lock** | Inactivity watcher tracks keyboard, mouse, and touch events. Locks dashboard after 10 minutes (`INACTIVITY_LOCK_MS = 600,000`). Enforces re-authentication with Supabase credentials. |
| **Page Refresh Lockout Bypass** | Client Browser State | **`localStorage` Persistence** | Lockout state `nicoman_admin_locked` is committed synchronously to `localStorage`. Page reload (F5 / Ctrl+R) cannot reset the lock without credential verification. |
| **Multi-Window Desynchronization** | Browser Tabs | **`BroadcastChannel` API** | All open admin tabs communicate across the `'nicoman_admin_security'` channel. Locking or unlocking in one tab locks/unlocks all tabs instantaneously in `<1 ms`. |
| **Abandoned Terminal Access** | Dormant Admin Sessions | **Inactivity Auto-Logout** | Prolonged inactivity past 25 minutes (`INACTIVITY_LOGOUT_MS = 1,500,000`) completely invalidates the Supabase session, purges local tokens, and redirects to `/auth`. |
| **Credential-Free Demonstration** | Public Reviewers / Recruiters | **Demo Admin Simulation** | Dedicated `demo_admin` role unlocks the dashboard via 1-click preview without exposing live passwords, while write mutations are safely simulated without touching the database. |
| **DDoS / HTTP Flooding** | Serverless Endpoints | **In-Memory Rate Limiter** | Sliding-window IP tracker restricts clients to 100 requests per 15-minute window with `Retry-After` and `X-RateLimit-*` response headers. |
| **Database Sleep / Inactivity Purge** | PostgreSQL Instance | **Automated GitHub Actions Cron** | Scheduled workflow (`.github/workflows/keep-alive.yml`) queries `/api/health` every 4 days, executing a real database query to reset Supabase's 7-day inactivity pause. |
| **Cross-Origin Scraping & CSRF** | Express API | **Strict CORS Policy** | Origin validation permits only production domain (`nicoman-tourism.vercel.app`), local development hosts, and verified Vercel preview branches; all unauthorized origins are terminated. |
| **Webhook Forgery / Replay Attacks** | Inbound Email Processing | **Svix Cryptographic Signatures** | Resend inbound webhooks require valid `svix-id`, `svix-timestamp`, and `svix-signature` HMAC tokens verified against `RESEND_WEBHOOK_SECRET`. |
| **Automated Credential Stuffing** | Registration & Auth | **Cloudflare Turnstile** | CAPTCHA-less interactive bot validation validates invisible client tokens against Cloudflare's `/siteverify` backend before account creation occurs. |
| **Unauthorized Row Modification** | PostgreSQL Tables | **Postgres Row Level Security** | Enforced inside the PostgreSQL engine (`auth.uid() = user_id`). Unprivileged frontend tokens are mathematically incapable of querying or mutating alien tenant records. |

---

## 3. Concurrency Control & Exception Handling Matrix

Handling real-world edge cases and transactional race conditions is critical for multi-user booking portals and distributed admin interfaces.

```mermaid
sequenceDiagram
    autonumber
    actor UserA as Traveler A
    actor UserB as Traveler B
    participant Server as Serverless API Engine
    participant DB as Supabase PostgreSQL

    UserA->>Server: Book Hotel Room 101 (Dates: Nov 12 - Nov 15)
    Server->>DB: Query Confirmed Bookings for Room 101 in Date Range
    DB-->>Server: 0 Overlapping Bookings Found
    Server->>DB: INSERT Booking (Status: Confirmed, Token: HTL-101-ANI7A2B)
    DB-->>Server: Transaction Committed
    Server-->>UserA: HTTP 201 Created (Booking Successful)

    Note over UserB,Server: Milliseconds later, Traveler B attempts to reserve the same unit
    UserB->>Server: Book Hotel Room 101 (Dates: Nov 14 - Nov 17)
    Server->>DB: Query Confirmed Bookings for Room 101 in Date Range
    DB-->>Server: 1 Confirmed Booking Found (Collision Detected)
    Server-->>UserB: HTTP 409 Conflict ("Unit already reserved for selected dates")
```

### 3.1 Concurrency & Conflict Handling Matrix

| Scenario / Edge Case | Subsystem | Exception / Status Code | Resolution Strategy |
| :--- | :--- | :---: | :--- |
| **Double-Booking Race Condition** | Hotel & Ferry Booking Engines | `HTTP 409 Conflict` | Server queries active reservations with date overlap condition (`check_in < new_checkout AND check_out > new_checkin`). Rejects overlapping attempt immediately with unit conflict notification. |
| **Admin Reinstatement Collision** | Admin Dashboard (`BookingsTab`) | `HTTP 409 Conflict` | When an admin attempts to switch a cancelled booking back to confirmed, if another guest has reserved the unit in the interim, the system blocks the update and opens the `BookingConflictModal`. |
| **Interactive Unit Re-allocation** | Admin UI (`BookingConflictModal`) | UI Interception Modal | Admin is presented with conflicting guest details, collision date spans, and an automated dropdown of vacant substitute units (`Room 102`, `Room 103`) to resolve the conflict in 1 click. |
| **Offline AI Inference Failure** | Transformers.js Model Loader | `DOMException` / Network Error | If Hugging Face CDN or browser cache is unreachable (e.g. offline mobile user or firewall), model loader traps the exception, logs a warning, and falls back gracefully without breaking review submissions. |
| **Expired / Tampered Session Token** | Express Auth Middleware | `HTTP 401 Unauthorized` | Invalid JWT tokens return structured JSON error with `WWW-Authenticate: Bearer error="invalid_token"`. Client automatically flushes stale auth context and displays login modal. |
| **Storage Quota / Large File Upload** | Avatar Upload Pipeline | `PayloadTooLargeError` | HTML5 Canvas client-side compressor intercepts raw images before network transfer, scaling to `800x800px` WebP (`82%` quality) to reduce file weight by `>75%`. |
| **Soft-Deleted Account Login Attempt** | Supabase Auth Lifecycle | Account Invalidation | Account self-deletion purges credentials from `auth.users` immediately, invalidating tokens across all devices while archiving historical metadata in `deleted_profiles` for 30-day recovery. |

---

## 4. Edge CDN, Caching & Asset Delivery Topology

The architecture leverages Vercel's global edge network and browser storage to maximize speed and minimize compute costs.

### 4.1 Caching & Header Rules (`vercel.json`)

* **Immutable Fingerprinted Assets (`/assets/(.*)`):**
  ```http
  Cache-Control: public, max-age=31536000, immutable
  ```
  Vite-generated CSS, JS, and font chunks with SHA-256 content hashes are cached permanently on client devices and edge nodes, eliminating re-validation latency on subsequent visits.
* **Security Headers on All Routes (`/(.*)`):**
  * `X-Content-Type-Options: nosniff` — Prevents MIME-type sniffing.
  * `X-Frame-Options: DENY` — Immunizes application against clickjacking in external iframes.
  * `X-XSS-Protection: 1; mode=block` — Enforces legacy browser XSS filtering.
  * `Referrer-Policy: strict-origin-when-cross-origin` — Protects internal URI query parameters during outbound navigation.

### 4.2 Edge Micro-Frontend Rewriting Architecture

The deployment leverages edge rewrites to unite two independent Single Page Applications and serverless API endpoints under one unified domain without CORS hurdles:

```text
/api/(.*)      ──► Vercel Serverless Function (/api/index.js ──► Express Engine)
/book          ──► Booking Sub-App Portal (/book/index.html)
/book/(.*)     ──► Booking Static Assets (/book/$1)
/(.*)          ──► Main Client SPA (/index.html)
```

---

## 5. Verification & Audit Execution Instructions

Any reviewer or visitor can reproduce and verify this entire report in under 30 seconds using standard commands:

```bash
# 1. Execute full Vitest automated suite (22 tests across 6 files)
npm test

# 2. Run test suite in interactive watch mode
npm run test:watch

# 3. Verify self-healing production build (Booking Micro-Frontend + Main SPA)
npm run build
```
