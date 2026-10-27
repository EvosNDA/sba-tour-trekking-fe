# WeTrek Frontend

React web app for the WeTrek trekking-tour marketplace. Travelers can browse tours, create accounts, and manage their profile. Tour operators can apply to join the platform and, after approval, manage tours. The backend is maintained in the sibling `sba-tour-trekking-be` repository.

For product overview, backend setup, database and migration policy, and the API contract, see the [backend README](../sba-tour-trekking-be/README.md) and [API specification](../sba-tour-trekking-be/docs/API_SPEC.md).

## Requirements

- Node.js and npm (use the versions supported by your team environment).
- The backend running at `http://localhost:8080` for server-backed features.

## Run locally

From this repository:

```powershell
npm ci
npm run dev
```

Open `http://localhost:5173`. Vite proxies requests under `/api` to `http://localhost:8080`, so start the backend separately. Backend environment variables, email setup, and database instructions are in its README.

To use a different port without stopping other applications:

```powershell
npm run dev -- --port 5174
```

For another API origin, set `VITE_API_BASE_URL` in a local `.env` file (start from `.env.example`). By default it is `/api`, which uses the Vite proxy. Do not commit secrets or local credentials.

## Available commands

```powershell
npm run dev       # Start Vite development server
npm run lint      # Type-check with TypeScript (no ESLint command is currently configured)
npm run build     # Create the production bundle in dist/
npm run preview   # Serve the production bundle locally
```

## Project layout

```text
src/
  app/          App shell, screen router, providers, and role-based screen access
  components/   Shared layout, navigation, and UI components
  features/     Feature APIs, hooks, types, and reusable components
  i18n/         English and Vietnamese dictionaries and language provider
  pages/        Public, authentication, customer, partner, and admin screens
  stores/       Shared client-side state, including authentication state
  styles/       Global styles
  types/        Shared application types
public/         Static assets
```

Feature-specific API calls, types, and hooks should live together under `src/features/`. Screen composition and navigation are in `src/app/` and `src/pages/`.

## Working with the backend

- Read `../sba-tour-trekking-be/docs/API_SPEC.md` before changing an API call or building a backend-dependent flow. Keep the API contract aligned when request or response behavior changes.
- The development API base defaults to `/api`; `vite.config.ts` forwards that path to backend port `8080`.
- Authentication uses the shared auth API and store. Keep server-side authorization authoritative; hiding a screen in the frontend does not protect its API.
- Some booking, payment, guide, and staff screens may be incomplete or lack backend endpoints. Check the API specification before treating them as live features.
- Partner applications are activated through an email link. Applicants set their own password during activation, can sign in with customer access to view application status, and receive partner permissions only after platform approval.

## Language and accessibility

- The interface supports Vietnamese and English. Add or update user-facing strings in both dictionaries in `src/i18n/I18nProvider.tsx`; use `useI18n()` in components instead of hard-coded UI text.
- Keep source files UTF-8 so Vietnamese text renders correctly.
- Preserve keyboard access, visible focus states, descriptive labels, and accessible status/error announcements when changing forms and navigation.

## Before handing off a change

Check `AGENTS.md` for frontend contribution rules. Run the relevant checks:

```powershell
npm run lint
npm run build
```

For API-facing work, also check that the backend contract and documented behavior match the frontend.
