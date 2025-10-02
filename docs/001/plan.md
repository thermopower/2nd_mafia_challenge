# Plan - Use Case 001 Signup Module Design

## Overview
- **AuthSignupSchema** (`src/features/auth/backend/schema.ts`): Zod schema for signup request/response payloads and terms version identifiers.
- **AuthSignupErrors** (`src/features/auth/backend/error.ts`): Enumerates domain error codes (duplicate email, missing terms version, Supabase failure).
- **AuthSignupService** (`src/features/auth/backend/service.ts`): Uses the Supabase service-role client to create Auth users, write `profiles`, and append `terms_acceptances` records.
- **AuthRoutes** (`src/features/auth/backend/route.ts`): Exposes `POST /auth/signup` and `GET /auth/terms/latest`, wrapping results with the shared HTTP helpers.
- **AuthSignupDto** (`src/features/auth/lib/signup-dto.ts`): Re-exports backend schemas for client usage (React Query + react-hook-form typing).
- **useLatestTermsVersionQuery** (`src/features/auth/hooks/use-latest-terms-query.ts`): React Query helper to fetch/cache the active terms version.
- **useSignupMutation** (`src/features/auth/hooks/use-signup-mutation.ts`): Mutation hook that calls the API client, normalises errors, and triggers `CurrentUser` refresh logic.
- **SignupForm** (`src/features/auth/components/signup-form.tsx`): Client component powered by `react-hook-form` + Zod, renders role select, terms consent, and orchestrates submission.
- **SignupPage** (`src/app/signup/page.tsx`): Composes the form component, handles authenticated redirects, and wires search params.
- **HonoApp Registration** (`src/backend/hono/app.ts`): Registers the new auth routes inside the singleton Hono application.

## Diagram
```mermaid
graph TD
  A[SignupPage
  src/app/signup/page.tsx]
  A --> B[SignupForm
  features/auth/components]
  B --> C[useSignupMutation
  features/auth/hooks]
  B --> D[useLatestTermsVersionQuery
  features/auth/hooks]
  C --> E[apiClient.post /auth/signup]
  D --> F[apiClient.get /auth/terms/latest]
  E --> G[AuthRoutes (Hono)]
  F --> G
  G --> H[AuthSignupSchema]
  G --> I[AuthSignupService]
  I --> J[(Supabase Auth)]
  I --> K[(profiles)]
  I --> L[(terms_acceptances)]
  G --> M[AuthSignupErrors]
  C --> N[CurrentUserContext.refresh]
  G --> O[AuthSignupDto]
```

## Implementation Plan
1. **Schema & DTO**
   - Create the Zod request/response schema in `schema.ts` and re-export typed helpers in `signup-dto.ts`.
   - Unit Test: Add `vitest` cases that cover valid payloads, missing fields, and invalid `role` values.
2. **Error Codes**
   - Define domain errors in `error.ts` with machine codes and human messages.
   - Unit Test: Ensure the service maps Supabase/admin failures to the declared error codes via mocked dependencies.
3. **Service Layer**
   - Implement `signupUser` and `getLatestTermsVersion` inside `service.ts`, accepting injected Supabase clients for testability.
   - Unit Test: Cover success, duplicate email, missing terms version, and generic Supabase reject branches using `vi.fn()` mocks.
4. **Routes**
   - In `route.ts`, validate with Zod, delegate to service functions, and return responses via `respond`.
   - Update `src/backend/hono/app.ts` to call `registerAuthRoutes`.
   - QA: Manual verification with cURL/Thunder Client for 200, 400, 409, 500 scenarios.
5. **Hooks**
   - `useLatestTermsVersionQuery`: compose a stable React Query key (`['auth','terms','latest']`), call the API client, and surface error messages via `extractApiErrorMessage`.
   - `useSignupMutation`: build the POST payload, call the API, trigger `refresh`, and pass redirect info back to the caller when needed.
   - Unit Test: Mock Axios responses to assert success/error paths for both hooks inside a `QueryClientProvider` harness.
6. **SignupForm Component**
   - Use `react-hook-form` + `zodResolver`, render shadcn `Form`, `Input`, `Select`, `Checkbox`, and disable submit until required fields (name, phone, role, terms consent) pass validation.
   - QA Sheet:
     - Q1: Required field omissions result in inline helper text.
     - Q2: Password/confirmation mismatch blocks submission with focused feedback.
     - Q3: Terms checkbox unchecked prevents submit and highlights the control.
     - Q4: Successful submission shows feedback, resets form, and triggers redirect/state update.
     - Q5: API errors (duplicate email, terms missing) display meaningful toasts/messages.
7. **SignupPage Wiring**
   - Refactor `src/app/signup/page.tsx` to render `SignupForm`, handle `useCurrentUser` state, and guard against authenticated access.
   - QA: Authenticated users are redirected immediately; unauthenticated users see the form.
8. **Shared Context Integration**
   - Ensure `useSignupMutation` invokes `useCurrentUser().refresh()` on success so downstream consumers observe the new session.
   - QA: After signup, `CurrentUserContext` reflects `authenticated` and react-query cache is updated.
9. **Tooling Updates**
   - Add `vitest`, `@vitest/coverage-v8`, and `@testing-library/react` (if missing) to devDependencies and create `vitest.config.ts`.
   - Introduce `npm run test` script and verify new unit tests pass in CI.

Follow-up: seed `terms_versions` with at least one active row and document environment variables (`NEXT_PUBLIC_API_BASE_URL`) if adjustments are required.
