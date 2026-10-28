# Workspace — All Apps in One Place

An internal launcher page. The home page shows a tile for each company web app (Quotation Hub,
SIC Manager, Client Hub, …); clicking a tile opens that app. Administrators sign in to add,
edit, reorder or hide tiles. The tiles are stored in SQL Server, not in the code.

## Stack

| Layer     | Technology                                                                    |
| --------- | ----------------------------------------------------------------------------- |
| Framework | TanStack Start — React 19 with server-side rendering and **server functions** |
| UI        | TypeScript, Tailwind CSS v4, shadcn/ui (Radix), lucide icons, sonner (toasts) |
| Data (UI) | TanStack Query (caching), TanStack Router (file-based routes)                 |
| Database  | Microsoft SQL Server via the `mssql` driver                                   |
| Auth      | Own login: scrypt-hashed passwords + HTTP-only session cookie                 |
| Build     | Vite 8; Nitro packages the production build as a standalone Node.js server    |

## How it works

Frontend and backend live in **one project and run as one Node.js process** — there is no
separate API server. TanStack Start splits the code at build time:

```
Browser (React pages)                         Node.js server
─────────────────────                         ──────────────────────────────────────────
src/routes/*.tsx  ── calls ──►  src/lib/*.functions.ts  ──►  src/server/*.server.ts ──► SQL Server
                                (server functions: run on      (DB pool, password hashing,
                                 the server; the browser gets   sessions — never sent
                                 only a tiny fetch stub)        to the browser)
```

- A **server function** (`createServerFn`) is written next to the UI code but executes only on
  the server. When a page calls `listApps()`, the browser actually sends an HTTP request to
  `/_serverFn/...`; the server runs the function and returns the result.
- **Home page (`/`)** is public. Its loader calls `listApps()`, which reads the visible rows of
  `dbo.apps` ordered by `sort_order`. The first load is rendered on the server.
- **Login:** `signIn` checks the password hash, stores a random token's SHA-256 in
  `dbo.sessions`, and sets it in an HTTP-only cookie (`ws_session`, 30 days, renewed on use).
- **Access rules:** every server function that changes data uses `requireAuth`
  (`src/lib/auth-middleware.ts`). Every signed-in user is an administrator.
- **Tile icons:** `dbo.apps.icon` holds the key of a built-in icon (`quotation`, `sic`, `client`,
  `password`, `expiry`, `store`, `tasks`, `invoice`, `hrm`, `wcr`, `purchase`, `payable`, … — see
  `src/lib/app-icons.ts`). Add more keys there to offer more icons in /admin.
- **Database setup is automatic:** on the first request, the server connects to the database in
  `DATABASE_URL`, creates the database if it does not exist, and applies `database/schema.sql`
  (tables + the twelve original tiles). The script is idempotent, so it is safe on every start.
  Then open `/login` and it asks you to create the first administrator.

## Files

### Root

| File                                                 | Purpose                                                                       |
| ---------------------------------------------------- | ----------------------------------------------------------------------------- |
| `.env`                                               | Your config (DB connection). Never commit it.                                 |
| `.env.example`                                       | Template for `.env`                                                           |
| `package.json` / `package-lock.json`                 | Dependencies and npm scripts                                                  |
| `vite.config.ts`                                     | Build/dev config: Tailwind, TanStack Start, React, Nitro (Node server output) |
| `tsconfig.json`                                      | TypeScript settings and the `@/` → `src/` import alias                        |
| `eslint.config.js`, `.prettierrc`, `.prettierignore` | Lint and code-format rules (`npm run lint`, `npm run format`)                 |
| `vitest.config.ts`                                   | Test runner config (`npm test`)                                               |
| `.gitignore`                                         | Keeps `node_modules`, `.output`, `.env` out of git                            |
| `database/schema.sql`                                | SQL Server tables and default tiles; applied automatically at startup         |
| `public/`                                            | Static files served as-is (`favicon.ico`, `robots.txt`)                       |
| `.output/`                                           | **Generated** by `npm run build` — the deployable server. Not source code.    |
| `node_modules/`                                      | **Generated** by `npm install`                                                |

### Backend (runs only on the server)

| File                                                | Purpose                                                                        |
| --------------------------------------------------- | ------------------------------------------------------------------------------ |
| `src/server/db.server.ts`                           | Parses `DATABASE_URL`, connection pool, auto-creates the DB and applies schema |
| `src/server/crypto.server.ts`                       | Password hashing (scrypt) and session tokens                                   |
| `src/server/auth.server.ts`                         | Create / read / destroy login sessions (cookie + `dbo.sessions`)               |
| `src/lib/auth-middleware.ts`                        | `requireAuth` guard for server functions                                       |
| `src/lib/auth.functions.ts`                         | `signIn`, `signOut`, `getSession`, `adminExists`, `createFirstAdmin`           |
| `src/lib/apps.functions.ts`                         | Tiles: `listApps` (public), `listAllApps`, `saveApp`, `deleteApp`              |
| `src/lib/users.functions.ts`                        | Administrators: `listUsers`, `createUser`, `deleteUser`                        |
| `src/server.ts`                                     | Server entry: wraps every request and shows a friendly page on crashes         |
| `src/start.ts`                                      | Global middleware: error handling and CSRF protection for server functions     |
| `src/lib/error-capture.ts`, `src/lib/error-page.ts` | Helpers for the crash page and error logging                                   |

### Frontend (React, runs in the browser)

| File                                  | Purpose                                                           |
| ------------------------------------- | ----------------------------------------------------------------- |
| `src/routes/__root.tsx`               | HTML shell, fonts, toasts, 404 and error pages                    |
| `src/routes/index.tsx`                | `/` — the app tiles (public)                                      |
| `src/routes/login.tsx`                | `/login` — admin sign-in (and first-administrator setup)          |
| `src/routes/_authenticated/route.tsx` | Guard + header for signed-in pages; redirects to `/login`         |
| `src/routes/_authenticated/admin.tsx` | `/admin` — add/edit/delete tiles, manage administrators           |
| `src/lib/app-icons.ts`                | Icons a tile can use, keyed by the name stored in `dbo.apps.icon` |
| `src/components/ui/*.tsx`             | Reusable UI pieces (button, input, select, dialog, table, …)      |
| `src/lib/utils.ts`                    | `cn()` helper for combining CSS classes                           |
| `src/router.tsx`                      | Creates the router and the shared query cache                     |
| `src/routeTree.gen.ts`                | **Generated** route list — do not edit                            |
| `src/styles.css`                      | Tailwind setup and the colour theme                               |

## Configuration (`.env`)

| Variable                | Purpose                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `DATABASE_URL`          | `sqlserver://HOST[\INSTANCE][:PORT];database=NAME;user=...;password=...;encrypt=true;trustServerCertificate=true` |
| `SESSION_COOKIE_SECURE` | `true` when the site is served over HTTPS                                                                         |
| `PORT` (optional)       | Port to listen on (default 3000)                                                                                  |

**Switching database:** change `DATABASE_URL` and restart. If the database does not exist it
is created (the SQL login needs `CREATE DATABASE` permission for that; `sa` has it), tables are
created with the twelve default tiles, and `/login` asks for a new administrator. Data is not
copied between databases.

## Run locally

Requires Node.js 20.12 or newer.

```sh
copy .env.example .env   # then edit DATABASE_URL
npm install              # once, or after package.json changes
npm run dev              # http://localhost:3000, reloads on code changes
```

## Build and host

```sh
npm run build      # creates .output/ (the complete server)
npm start          # runs .output/server/index.mjs with .env, on PORT (default 3000)
```

To deploy, copy **`.output/`, `.env` and `package.json`** to the server (it needs Node.js but
not `node_modules` or the source) and run `npm start` there — or directly
`node --env-file=.env .output/server/index.mjs`.

Keep it running with pm2 (`pm2 start npm --name leads-dashboard -- start`) or as a Windows service
(e.g. NSSM), and put IIS (URL Rewrite + ARR) or nginx in front for HTTPS; then set
`SESSION_COOKIE_SECURE=true`.

## Other scripts

| Command          | What it does                       |
| ---------------- | ---------------------------------- |
| `npm test`       | Run the tests with Vitest          |
| `npm run lint`   | Check code with ESLint             |
| `npm run format` | Auto-format all code with Prettier |
