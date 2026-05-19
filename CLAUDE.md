# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

Three sibling projects in one repo, plus Docker orchestration:

- `programmier_bar.dbClassLibrary/` — .NET class library: domain models (`Person`, `Product`, `Category`, `Stock`, `Filedata`, …) + lightweight data-access layer (`DbSqlConnection`, `DbSettings`). All SQL lives here.
- `programmier_bar.dbApiControllers/` — ASP.NET Core Web API. Thin controllers (`Controllers/*Controller.cs`) that delegate to the class library. References the class library project.
- `programmier_bar.Web/` — Vanilla-JS SPA built with Webpack 5 + Bootstrap 5 (no framework). Entry: `Src/index.js` → `Src/app.js`. Pages are `Src/p-*.js` / `Src/p-*.html`.
- `programmier_bar.sql` — full PostgreSQL bootstrap script (drops/creates DB, role `barAdmin`, schema `assortment`, all tables). Mounted into the postgres container at startup.

The .NET solution file (`programmier_bar.dbApiControllers.sln`) lives **inside** the API project folder, not at the repo root.

## Running everything

Full stack via Docker Compose (the supported path):

```bash
docker compose up --build
```

Services and host ports:
- `postgres` — Postgres 17, host port **7777** → container 5432, initialized from `programmier_bar.sql`
- `pgadmin` — pgAdmin 4, host port **5050** (login `pgadmin4@pgadmin.org` / `admin`)
- `webapi` — ASP.NET API, host port **5181** → container 80
- `spa` — nginx serving the prebuilt SPA from `programmier_bar.Web/dist/dev`, host port **5500**
- `nginx` — reverse proxy on host port **80**, routes `/person|/product|/category|/stock|/page|/filedata` to the webapi and everything else to the SPA (see `nginx.conf`)

The SPA container serves whatever is already in `programmier_bar.Web/dist/dev` — it does **not** build the frontend. You must run the frontend build yourself before (or while) running Docker. Frontend changes are not picked up by `docker compose up` alone.

## Common commands

Frontend (run inside `programmier_bar.Web/`):
```bash
npm run build:dev    # one-shot dev build → dist/dev
npm run watch        # rebuild on change
```

Backend (run inside `programmier_bar.dbApiControllers/`):
```bash
dotnet build
dotnet run                          # runs at the URL in launchSettings (not 5181)
dotnet publish -o ./publish         # produces deploy artifacts
```

There is no test project and no lint script wired up in `package.json` — `eslint-webpack-plugin` runs ESLint as part of `webpack` builds (config: `eslint.config.js`).

## Architecture

### Data-access pattern (class library)

There is no EF / no ORM. Every domain class follows the same convention — copy it when adding a new entity:

- `protected const string TABLE`, `COLUMNS`, `SELECT` at the top.
- `public static List<T> GetList()` and `public static T Get(...)` calling `DbSqlConnection.ExecuteQuery<T>(sql, args)`.
- A constructor `public T(object[] data)` that maps a row by **positional index** matching the `COLUMNS` order — if you reorder columns you break the mapping.
- Mutations go through `int Save(...)` / `int Delete(...)`. `Save` handles INSERT-vs-UPDATE by checking whether the primary-key property is set, and pulls the next id from a sequence named `{table}_seq`.
- Soft delete: every table has `deluser`/`deldate`; `Get`/`GetList` queries filter `where deldate is null`. Don't hard-delete.
- Audit columns `insuser`/`insdate`/`upduser`/`upddate` are populated inside `Save` from the passed `userInfo` (typically `Person.ToString()`).
- Aggregates (e.g. `Product`) save children inside a single transaction by passing the open `NpgsqlConnection` + `NpgsqlTransaction` into the child's `Save(conn, trans)` overload — see `Product.Save` for the template.
- `DbSqlConnection.ExecuteQuery<T>` instantiates `T` reflectively via `Activator.CreateInstance(typeof(T), new object[] { row })`, so the `object[]`-constructor is **required**, not optional.

### Database configuration

`DbSqlConnection` builds its connection string from `DbSettings.Load()`, which deserializes an XML file at `%APPDATA%/programmier_bar.settings` (`Environment.SpecialFolder.ApplicationData`). The file must exist or startup throws. The `ConnectionStrings__Default` env var set in `compose.yaml` is **not** currently read by the code — when running in Docker you still need that settings file present in the container's APPDATA, or you need to wire `IConfiguration` into `DbSqlConnection`. Verify before assuming the env var works.

### API conventions

- Routes are lowercase (`Program.cs` sets `LowercaseUrls`/`LowercaseQueryStrings`), so use `/product`, not `/Product`.
- Auth is cookie-based: clients send a `logintoken` cookie; `Person.Get(this)` inside any controller resolves the current user (or returns null → `Unauthorized()`). Almost every endpoint starts with this check — keep the pattern.
- CORS is hard-coded in `Program.cs` to `http://localhost:5500` / `http://127.0.0.1:5500` with `AllowCredentials()`. Any new frontend origin must be added there.
- Exception handling pattern: `try { … } catch (Exception ex) { #if DEBUG return 500 with ex.Message; #else return 500; #endif }` — preserve it for consistency.
- JSON serialization is configured with `ReferenceHandler.IgnoreCycles` and `WhenWritingNull`, so don't add `[JsonIgnore]` just to avoid cycles.

### Frontend SPA

- Routing is **hash-based**, handled in `Src/app.js` `#navigate()` via a `switch` on `location.hash` (`#login`, `#productlist`, `#productdetail`, …). Add a new page by adding a `case` plus a `p-<name>.js` / `p-<name>.html` pair.
- API base URL is hard-coded as `this.#apiUrl = 'http://localhost:5181'` in `app.js`. There is no build-time env injection — change it there if the port moves.
- All API access goes through `apiGet` / `apiSet` / `apiDelete` / `apiLogin` / `apiFiledata` on the `Application` instance. They send `credentials: 'include'` and also attach a `Bearer` token from `localStorage['programmier_bar-token']` if present (the cookie remains the source of truth on the server side).
- Role gating in the SPA is by `this.user.roleNumber` (numeric). Roles defined server-side (`PersonRole` enum): `Standard=0`, `Disponent=1`, `Administration=2`.

### Database schema

Everything lives in PostgreSQL schema `assortment` (owned by role `barAdmin`). Tables: `person`, `product`, `category`, `product_category` (join), `stock`, `filedata`. Each has a matching `*_seq` sequence. Passwords use the `pgcrypto` extension. The full DDL is `programmier_bar.sql` — treat it as the source of truth for column order, which the C# row-mapping constructors depend on.

## Gotchas

- The `.NET` API csproj targets **`net10.0`**, but the Dockerfile builds with **`mcr.microsoft.com/dotnet/sdk:9.0-alpine`**. If you change the target framework or the base image, keep them consistent.
- `programmier_bar.Web/package.json` currently contains **unresolved Git merge conflict markers** (`<<<<<<<`, `=======`, `>>>>>>>`). `npm install` will fail until that is resolved.
- `programmier_bar.Web/node_modules/` and `programmier_bar.Web/dist/` are present in the working tree from earlier commits; `.gitignore` now excludes them but they may already be tracked locally — check `git ls-files` before assuming a path is clean.
- The repo contains a checked-in `cookie.txt` and `webapi_logs.txt` — these are dev artifacts, not part of the build.
- `app.js`'s `apiFiledata` references an undefined `filedataList` (the parameter is named `dateiListe`). The function is broken as written; don't call it without fixing the binding.
