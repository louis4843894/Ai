# Architecture

## Purpose

The planned product is a group-buying system: an organizer creates a group and shares its link, members submit their orders, and the organizer reviews totals and orders before placing the vendor order manually.

## Technology Stack and Current Status

The repository currently contains an early Next.js application, not the completed group-buying workflow.

| Area | Present in the repository | Status |
|---|---|---|
| Web application | Next.js `16.4.3`, React `19.3.0`, TypeScript `5`, Tailwind CSS `4` | Configured |
| Routing/rendering | Next.js App Router under `app/` | Configured |
| Authentication | Firebase Authentication Client SDK; email/password and Google popup flows are present | Implemented on the sign-in/profile page |
| Database | Firebase Cloud Firestore Client SDK and `firestore.rules` | User profile read/write only; groups and orders are not implemented |
| Server-side Firebase | No Firebase Admin SDK dependency or server-side Firebase data layer found | Planned / not configured |
| Lint/build | ESLint `9`; package scripts `lint` and `build` | Configured |
| Unit tests | Vitest dependency/configuration and `lib/profile-values.test.ts` | Configured; covers existing profile input normalization only |
| E2E tests | Playwright configuration and `tests/e2e/registration-validation.spec.ts` | Configured; one local E2E test has passed |
| CI | No GitHub Actions workflow found in this repository | Planned / not configured |

The implemented UI supports registration and sign-in with email/password or Google, profile display-name updates, and persistence of a user's profile. It does not currently implement group creation, shared-link ordering, totals, deadlines, or organizer order management.

## Folder Structure and Responsibilities

Current repository structure:

| Path | Current responsibility |
|---|---|
| `app/` | App Router root layout, global styles, and the current sign-in/profile page |
| `components/` | Shared React components; currently contains the Firebase auth context/provider |
| `lib/` | Shared infrastructure; currently contains Firebase Client SDK initialization |
| `public/` | Static assets |
| `firestore.rules` | Firestore authorization rules |
| `firebase.json`, `.firebaserc` | Firebase CLI configuration and selected project |

There are no group domain, data-access, or E2E-test directories yet. Unit tests currently live beside pure profile-value helpers in `lib/`. As group features are implemented, keep route/UI code in `app/` and reusable UI in `components/`, business rules in domain modules, and Firebase reads/writes behind data-access modules under `lib/`. Create these modules when needed rather than putting business rules and database operations in page components.

## Authentication and Firebase SDK Boundaries

- The current app initializes Firebase from `lib/firebase.ts` using the Firebase Web SDK. `components/auth-provider.tsx` observes the client authentication state; `app/page.tsx` performs client-side authentication and user-profile Firestore operations.
- `.firebaserc` selects the existing project `ai-deta-464d4`. The app also checks that project ID before initializing Firebase. Do not switch projects or create a new project.
- The `.env.local.example` file lists browser Firebase configuration variables prefixed with `NEXT_PUBLIC_`. Such variables are browser-visible Firebase Web App configuration, not service-account credentials.
- Keep service-account private keys and other privileged credentials server-side only. If Firebase Admin SDK or a privileged API is added, put it in server-only modules/routes; never expose its credentials in client bundles or `NEXT_PUBLIC_` variables.
- `.env.local` is ignored by `.gitignore` and must never be committed. Keep example files free of private keys and real credentials.

## Current Data Model, Ownership, and Access Control

The only implemented Firestore document is `users/{userId}`. The current page writes fields including `uid`, `displayName`, `email`, and timestamps (`createdAt`/`updatedAt`). The rules allow an authenticated user to read their own user document and create/update it only when its `uid` matches their auth UID and `displayName` is a string no longer than 50 characters. Deletion is denied. All other documents are denied by the catch-all rule.

There is no group, membership, or order schema or corresponding access rules yet. Treat the following as requirements for that future model, not as existing collections or verified behavior:

- Every group must have an explicit organizer/owner UID. Only that owner may create or manage the group.
- Group membership must be represented and checked before a member can read or submit an order.
- Every order must identify its group and submitting member. A member may create or update only their own order, and must not modify another member's order.
- An organizer may review group totals and orders only for groups they own; one organizer must not manage another organizer's group.
- Authorization must be enforced by Firestore Security Rules or a trusted server-side data-access boundary. UI visibility or disabled controls alone are not authorization.
- Apply deadline checks at that trusted write boundary using a trusted time source; a client-side deadline check is insufficient. Verify both before-deadline acceptance and after-deadline rejection.
- The exact collections, quantity limits, deadline behavior, and whether organizers can edit a member's submitted order remain to be designed and tested.

## Testing Strategy

Vitest is configured for unit testing. The initial unit suite covers the existing behavior only:

| Test file | Coverage |
|---|---|
| `lib/profile-values.test.ts` | Email trimming without case changes; profile display-name trimming including blank values; registration's existing `團購會員` fallback. Executed locally: 3 tests passed. |

Playwright is configured to start the Next.js development server through `webServer`. `tests/e2e/registration-validation.spec.ts` visits the existing login/registration page, verifies its heading and sign-in controls, and checks that the browser rejects a password shorter than the page's existing six-character minimum. The E2E server receives placeholder Firebase Web configuration so the form can render; the test does not submit valid credentials or contact Firebase. This UI test does not verify Firebase authentication.

The E2E test was executed locally and passed using an installed Chrome browser. The Playwright-managed Chromium download was blocked by a DNS resolution failure in the current environment. On Windows, the config prefers an explicitly set `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`, then checks standard Google Chrome install locations under `ProgramFiles`, `ProgramFiles(x86)`, and `LOCALAPPDATA`, and otherwise uses Playwright's default Chromium. On other platforms it uses an explicit path if set and otherwise defaults to Playwright Chromium.

Latest local verification: `npm run typecheck` passed, `npm run lint` passed, `npm run test:unit` passed (3 tests), and `npm run test:e2e` passed (1 test using installed Chrome). `npm run build` was not run. The Playwright browser download was attempted but could not resolve `cdn.playwright.dev`; using the installed Chrome allowed the E2E test to run.

No order, quantity, total, or deadline business logic exists in the current application, so those rules cannot yet be tested without inventing requirements. Add domain tests alongside the implementation once those requirements are defined. The following broader coverage remains planned:

| Test type | Planned location | Required coverage |
|---|---|---|
| Unit | `lib/**/*.test.ts` | Once defined and implemented: order totals, quantity validation, deadline decisions, and data transformations |
| E2E | `tests/e2e/*.spec.ts` | Login/authentication behavior, group creation, ordering through a shared link, organizer summaries, and persistence after page reload |
| Authorization/rules | Planned; location and runner not configured | Use the Firebase Emulator to verify a member cannot modify another member's order, a user cannot manage another organizer's group, and deadline enforcement occurs at the trusted data-access boundary |

### Commands

These are the scripts currently declared in `package.json`:

- `npm run lint` — configured (`eslint`).
- `npm run build` — configured (`next build`).
- `npm run typecheck` — configured (`tsc --noEmit`).
- `npm run test:unit` — configured (`vitest run`).
- `npm run test:e2e` — configured (`playwright test`); Playwright starts the app server from its configuration.
- `npm run dev` and `npm run start` — configured development and production server commands.

`npx playwright test` is also available. Install a Playwright browser first with `npx playwright install chromium` if one is not already available. On Windows, an installed Chrome in a standard location is detected automatically; an explicit `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` can override detection.

### Emulator and Live-Firebase Use

Current unit tests are pure TypeScript and current E2E tests use only the page's browser-native validation; neither connects to Firebase or uses real user data. The proposed future strategy is Firebase Emulator for Firestore authorization tests and isolated live Firebase accounts/data only for later E2E flows that require real Firebase behavior. Emulator setup, authorization tests, and those account/data arrangements remain unconfigured.

## GitHub Actions CI Requirements

There is no workflow configured yet. Planned CI should run on pull requests and pushes to the repository's relevant branches and should:

1. Use a supported Node.js version and install the lockfile-defined dependencies with `npm ci`.
2. Run lint, type checking, unit tests, the production build, and the configured E2E/authorization tests. Add scripts only when they invoke actual tools and checks.
3. Use the Firebase Emulator for authorization tests. Later E2E tests may use only isolated live Firebase accounts and data, with secrets withheld from untrusted fork PRs.
4. Require the relevant checks to pass before merge through repository branch protection.
5. Store required CI credentials in GitHub Actions Secrets. Never expose secrets to untrusted fork pull requests; fork PR jobs must run without privileged credentials.

## Environment Variables and Test Data Safety

- For local development, copy `.env.local.example` to `.env.local` and supply the Firebase Web App configuration for `ai-deta-464d4`. Do not commit `.env.local`.
- Never put service-account private keys in source files, `.env` files committed to Git, or any `NEXT_PUBLIC_` variable. Store privileged CI credentials only in GitHub Actions Secrets and make them available only to trusted jobs.
- Use dedicated test accounts, a unique test-run identifier on created test data, and isolated test data. Never use personal/production data for routine tests.
- Cleanup code must confirm that each target record is owned by the test account and carries the current test-run identifier before deleting it. Never perform broad or unverified cleanup.
- Do not use the Firebase project `try-1-94e52` or create a new Firebase project.

## Remaining Setup Tasks and Known Limitations

1. Design and implement group, membership, order, totals, quantity, and deadline behavior and corresponding Firestore Rules.
2. Extract business logic and data access from the current page into focused modules.
3. Configure the Firebase Emulator and authorization tests; provision isolated live Firebase accounts/data before any later live E2E tests.
4. Add unit tests for group totals, quantity rules, and deadline boundaries once those business requirements and logic exist; add Playwright and E2E tests.
5. Add GitHub Actions workflows; configure branch protection and safe CI secrets.
6. Confirm the Firestore product/edition and whether any pipeline API is available before adopting an edition-specific data-access requirement.

### Review of the “MANDATORY PIPELINE ARCHITECTURE” Instruction

A workspace-level Firebase Firestore skill file contains a “MANDATORY PIPELINE ARCHITECTURE” instruction that describes pipelines as mandatory for Enterprise instances. The project configuration verifies only the Firebase project ID (`ai-deta-464d4`), a Firestore rules file, and use of the Firebase Web SDK. It does **not** establish the Firestore edition, Enterprise eligibility, or availability of the pipeline API. Therefore, the Enterprise assumption is unverified and must not be presented as a confirmed property of this project.

Proposed revision to that instruction: “Use the server-side pipeline API only when the target project's Firestore edition and deployed SDK/API are verified to support it and the requested operation benefits from it. Otherwise use supported data-access patterns. Do not infer the database edition from the Firebase project ID or require an Enterprise-only API without evidence.”
