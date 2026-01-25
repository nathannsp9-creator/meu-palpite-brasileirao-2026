Purpose
This file gives an AI coding agent the minimum, actionable context to be immediately productive in this repo.

Quick Start
- Commands: `npm install`, `npm run dev`, `npm run build`, `npm run preview` (see [package.json](package.json)).
- Vite base and alias: see [vite.config.ts](vite.config.ts) — `@` resolves to `src`.
- Required env vars (used via `import.meta.env`): VITE_FIREBASE_API_KEY, VITE_FIREBASE_AUTH_DOMAIN, VITE_FIREBASE_PROJECT_ID, VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_APP_ID, VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY.

Architecture (big picture)
- Frontend: React + Vite + TypeScript. UI primitives from shadcn-ui under [src/components/ui](src/components/ui).
- State & data fetching: `@tanstack/react-query` used across hooks in [src/hooks](src/hooks). Look for query key patterns like `['rodada-atual']`, `['proximos-jogos']`, `['meus-palpites', user?.uid, rodadaId]`.
- Auth & data backends: two backends are prepared — Firebase (Firestore + Auth) and Supabase. Firebase init: [src/lib/firebase.ts](src/lib/firebase.ts). Supabase init: [src/lib/supabase.ts](src/lib/supabase.ts).
- Routing: uses `HashRouter` (see [src/App.tsx](src/App.tsx)). Route protection implemented via [src/components/ProtectedRoute.tsx]. Admin gating is implemented with a `requireAdmin` prop and `user_roles` lookup.

Data model & flows
- Firestore collections used: `rodadas`, `jogos`, `palpites`, `profiles`, `user_roles` — see hooks in [src/hooks/useJogosFirebase.ts](src/hooks/useJogosFirebase.ts) and [src/hooks/usePalpitesFirebase.ts](src/hooks/usePalpitesFirebase.ts).
- Important patterns:
  - Use `serverTimestamp()` for created/updated fields and convert `Timestamp` to `Date` on reads.
  - Batch writes use Firestore `writeBatch` with a `BATCH_LIMIT` of 500 (see `useSalvarPalpitesBatch`).
  - Hooks include explicit index-error handling and throw helpful messages when a composite index is needed (see `useRodadaAtual` in [src/hooks/useJogosFirebase.ts](src/hooks/useJogosFirebase.ts)).
  - React Query invalidation: mutations call `invalidateQueries` and often `refetchQueries` to ensure UI freshness.

Conventions & patterns to follow
- File alias: import paths use `@/...` (e.g., `@/lib/firebase`). Honor the alias instead of relative paths.
- Two auth implementations exist. `AuthContextFirebase.tsx` is wired into the app by default (see [src/App.tsx](src/App.tsx)). If changing auth, update providers and hooks consistently.
- Prefer the typed models in `src/types` (`types/firebase.ts` and `types/database.ts`) when adding or editing hooks and components.
- Keep React Query keys stable and namespaced (use arrays). When adding mutations, follow existing invalidation patterns.

Integration notes and gotchas
- Firestore permissions: many reads have `permission-denied` fallbacks (they assume `user` role if cannot read `user_roles`). Don't break that behavior unless you update Firestore rules accordingly (see [src/contexts/AuthContextFirebase.tsx](src/contexts/AuthContextFirebase.tsx)).
- Firestore composite indexes: code surfaces index errors with instructions — follow stack trace links or create indexes for queries using `where`+`orderBy` combinations.
- Supabase flows: `signUp` explicitly signs out after creating a profile to ensure a fresh session (see [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx)). Be careful when switching between supabase and firebase logic.

Developer workflows
- Run locally: `npm run dev` (Vite). Production build: `npm run build` then `npm run preview`.
- Lint: `npm run lint`.
- No automated tests present in repo — assume manual testing and dev server for verification.

Where to look first when debugging or changing behavior
- Auth flows: [src/contexts/AuthContextFirebase.tsx](src/contexts/AuthContextFirebase.tsx) and [src/contexts/AuthContext.tsx](src/contexts/AuthContext.tsx).
- Data hooks & business logic: [src/hooks/useJogosFirebase.ts](src/hooks/useJogosFirebase.ts), [src/hooks/usePalpitesFirebase.ts](src/hooks/usePalpitesFirebase.ts).
- UI primitives: [src/components/ui](src/components/ui) and pages under [src/pages](src/pages).

If you need clarification
- Ask the maintainer to provide sample env files (local `.env`) and any Firestore rules or Supabase migrations.
- If you change backend shape (collection/table columns), update `src/types` and all hooks using that data.

Next steps for the agent
- When implementing features: run `npm run dev`, reproduce flows in the browser, and use console logs for Firestore index error links.
- Keep pull requests small and focused: update types, hooks, then components.

Please review this draft and tell me which sections need more detail or any missing local commands/envars.
