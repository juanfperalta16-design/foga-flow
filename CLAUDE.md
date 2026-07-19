# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

FOGA Flow — internal project-management system for FOGA (stainless steel kitchens/furniture manufacturer). Tracks projects through departments (Arquitectura → Diseño 3D → Producción → Instalaciones), plus prospects, activities, alerts, and a team calendar.

## Commands

```bash
npm install          # install deps
npm run dev          # start Vite dev server
npm run build         # production build -> dist/
npm run preview       # preview the production build locally
```

There is no test suite and no lint script configured.

### Deploy

```bash
npm run build
firebase deploy --only hosting     # deploys dist/ to https://foga-flow.web.app
```

Push to `main` also triggers `.github/workflows/deploy.yml`, which builds and deploys automatically using Firebase service-account/GitHub secrets (see README.md for the full secrets list). Firestore rules/indexes are NOT deployed by that workflow — deploy them manually with `firebase deploy --only firestore` when `firestore.rules` changes.

Local Firebase credentials go in `.env.local` (copy from `.env.example`, values from Firebase Console → Project Settings → Web app).

## Architecture

**Data flow:** `src/App.jsx` is the single stateful root. On auth (Firebase Auth, email/password via `src/components/Login.jsx`), it opens live `onSnapshot` listeners (via `listenToCollection` in `src/firebase/firestoreService.js`) on every Firestore collection and holds all app data in local React state. There is no router — `page` state plus a `switch` in `App.jsx.renderPage()` selects which top-level component to show, and `AppContext` (created in `App.jsx`, consumed via `useApp()`) passes data + mutator functions down to every page-level component. Components read/write through this context rather than calling Firestore directly.

**Firestore collections** (`COLLECTIONS` in `src/firebase/firestoreService.js`): `proyectos`, `actividades`, `alertas`, `historial`, `responsables`, `departamentos_config`, `prospectos`. All writes go through the generic helpers there (`create`, `setWithId`, `update`, `remove`) — `setWithId` is used wherever the app needs to keep its own IDs (e.g. `P001`) rather than Firestore-generated ones. `src/firebase/seed.js` seeds `proyectos`/`responsables`/`departamentos_config` from `src/data/mockData.js` and `src/utils/settingsStorage.js` the first time a collection is empty (called from `App.jsx` on login).

**Project status is derived, not stored as a free field.** `src/utils/processRules.js` (`calcularEstadoGeneral`) recomputes a project's pipeline stage from its nested `architecture` / `design3d` / `production` / `installations` sub-objects and their `modulos` array every time data changes — this is the source of truth for where a project sits in the flow (Arquitectura → Diseño 3D → Producción → Instalaciones → Finalizado). Any new field that should affect stage progression needs to be threaded into this function, not just written and displayed. `src/utils/dateHelpers.js` (`isAtrasado`) separately flags overdue activities/projects against `estado`.

**Department views:** `src/components/DepartmentView.jsx` is a single shared component parameterized by a `departamento` prop (`"Arquitectura"`, `"Instalaciones"`, `"Diseño 3D"`, `"Producción"`) and reused across multiple `page` routes in `App.jsx` (there are duplicate/legacy route keys like `diseno`/`diseno3d` and `instalacion`/`obra`/`instalaciones` mapping to the same views — check `App.jsx.renderPage()` before adding a new department route to avoid creating another duplicate).

**Auth/security model:** Firestore rules (`firestore.rules`) only check `request.auth != null` — any authenticated account can read/write every collection, there is no per-role permission system yet. Accounts are created manually in the Firebase Console, not via self-signup.

**Migration in progress:** the codebase is mid-migration away from an older architecture (`src/pages/*`, `src/context/AppContext.jsx`, `src/hooks/useAppState.js`, localStorage-based `src/utils/storage.js`) toward the current `src/components/*` + Firestore-backed model described above. If you find references to the old files, prefer extending the new pattern rather than the old one.
