# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project layout

Three sibling projects in one repo, plus Docker orchestration:

- `programmier_bar.dbClassLibrary/` — .NET class library: domain models (`Person`, `Product`, `Category`, `Stock`, `Filedata`, …) + lightweight data-access layer (`DbSqlConnection`, `DbSettings`). All SQL lives here.
- `programmier_bar.dbApiControllers/` — ASP.NET Core Web API. Thin controllers (`Controllers/*Controller.cs`) that delegate to the class library. References the class library project.
- `programmier_bar.Web/` — Vanilla-JS SPA built with Webpack 5 + Bootstrap 5 (no framework). Entry: `src/index.js` → `src/app.js`. Pragmatic Feature-Sliced layout under `src/`:
  - `pages/<name>/<name>.{js,html}` — one folder per route (`home`, `login`, `shop`, `shop-item`, `cart`, `product-list`, `product-detail`, `categories`, `person-list`, `person-detail`).
  - `widgets/` — reusable assembled UI (`nav-bar`, `category-tree`, `search-box`).
  - `features/` — user-action slices (`cart-add-item`, `category-edit`, `stock-edit`).
  - `entities/` — domain models + local state (`cart` holds anonymous-cart localStorage helpers).
  - `shared/` — `api/client.js` (apiGet/apiSet/apiDelete/apiLogin/apiFiledata) and `lib/format.js` (date formatting).
  - Webpack `resolve.alias` exposes these as `@app @pages @widgets @features @entities @shared` (see `webpack.dev.config.js`).
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
- `nginx` — reverse proxy on host port **80**, routes `/person|/product|/category|/stock|/page|/filedata|/cart` to the webapi and everything else to the SPA (see `nginx.conf`)

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
- CORS is hard-coded in `Program.cs` to `http://localhost:5500` / `http://127.0.0.1:5500` / `http://programmier-bar:5500` with `AllowCredentials()`. Any new frontend origin must be added there.
- Exception handling pattern: `try { … } catch (Exception ex) { #if DEBUG return 500 with ex.Message; #else return 500; #endif }` — preserve it for consistency.
- JSON serialization is configured with `ReferenceHandler.IgnoreCycles` and `WhenWritingNull`, so don't add `[JsonIgnore]` just to avoid cycles.

### Frontend SPA

- **Responsive layout is non-negotiable**: every page must render cleanly on mobile/tablet/laptop (Bootstrap breakpoints `sm`/`md`/`lg`). Use the responsive grid (`col-12 col-sm-6 col-md-4 col-lg-3` …) and responsive spacing utilities (`p-3 p-md-4`, `g-2 g-md-3`); replace fixed pixel heights with `aspect-ratio`, `clamp()`, or Bootstrap `ratio ratio-*`. Bootstrap has **no** responsive variants of heading or `fs-*` classes — `h2-md` / `fs-md-5` are invalid; use a smaller base class or a media query.
- Routing is **hash-based** via a `switch` on `location.hash` in `app.js` `#navigate()` (default → home). Add a new page = new `case` + `pages/<name>/<name>.{js,html}` pair, imported via the `@pages/<name>/<name>` alias.
- The navbar is **rebuilt on every navigation**: `#navigate()` calls `destroy()` then `new NavBar(...)`. Any widget with `window` / `document` listeners must clean up in its own `destroy()` — `NavBar` clears `cart:changed`, `category:changed`, a `ResizeObserver`, and its embedded `SearchBox` (which itself owns a document-level outside-click handler). Keep the cascade intact.
- Cross-cutting refresh signals are dispatched as `window` `CustomEvent`s: the cart page / cart-add-item feature dispatch `cart:changed`; the categories page dispatches `category:changed` after save/delete. The navbar listens and re-renders the cart badge / category dropdowns accordingly.
- API base URL is **derived from the page's origin**: `this.#apiUrl = `${location.protocol}//${location.hostname}:5181`` in `app.js`. This keeps the API on the same hostname as the SPA so the `logintoken` cookie qualifies as same-site (otherwise `SameSite=Lax` blocks it on cross-host requests like `programmier-bar:5500` → `localhost:5181`). The port `5181` is still hard-coded — change it there if the API moves.
- **Stale-token bootstrap**: in `app.js`, if a `logintoken` cookie exists but `/page/init` fails (expired/unknown token, server restart), the error handler clears the cookie via `expires=Thu, 01 Jan 1970` and falls back to `location.hash` (default → home), instead of forcing a redirect to `#login`. Don't reintroduce the auto-redirect — the storefront is meant to remain usable anonymously even when an old cookie is present.
- All API access goes through `apiGet` / `apiSet` / `apiDelete` / `apiLogin` / `apiFiledata` on the `Application` instance (thin delegates to `@shared/api/client.js`). They send `credentials: 'include'` and also attach a `Bearer` token from `localStorage['programmier_bar-token']` if present (the cookie remains the source of truth on the server side).
- Role gating in the SPA is by `this.user.roleNumber` (numeric). Roles defined server-side (`PersonRole` enum): `Standard=0`, `Disponent=1`, `Administration=2`. Role 0 / anonymous users navigating to `#productlist` are redirected to `#shop` (admin product list vs. public catalog).
- **Public vs. authenticated endpoints**: `GET /product`, `GET /product/{id}`, `GET /product/{id}/filedata`, `GET /category`, and `GET /filedata/{id}/download` are intentionally **unauthenticated** so the storefront (`#shop`, `#shop-item`, navbar dropdowns, product images) works for logged-out visitors. Everything else (cart, stock, filedata mutations, person, product mutations) still requires the `logintoken` cookie.
- **Anonymous cart**: when no user is logged in, `entities/cart/model.js` keeps cart items in `localStorage`. After a successful login, `app.syncLocalCart()` posts them to `POST /cart/sync` (server merges by product) and clears localStorage. The cart page renders both flavors uniformly and the checkout button becomes "Sign in to checkout" in the anonymous case.
- **Fixed navbars & body padding**: both navbars are `position: fixed`; body has `padding-top: 7rem; padding-bottom: 4.5rem` in `index.html` to clear them. When the user flips the navbar (toggle persisted in `localStorage['navbarFlipped']`), JS resets `body.style.padding` to the actual navbar heights via a `ResizeObserver`. New pages should include their own top/bottom spacers so the first/last item clears the bars in either orientation.
- **Whenever you query `product_info`, dedupe by `productUid`** — the view returns one row per (product, category) pair. The shop grid, product list, and search-box widget all rely on this.
- **Product list sort & shared widget**: `pages/product-list` sorts with `Intl.Collator {numeric: true, sensitivity: 'base'}` so `P-2` precedes `P-10`. It no longer uses the shared `CategoryTree` widget, but `pages/product-detail` still does for multi-select category assignment — don't break `CategoryTree`'s public interface.
- **Product detail implicit save on file drop**: dropping a file on an unsaved product saves it first (auto-generates `charcode` + `productUid`, then uploads). Empty name → inline alert next to the Save button, not a bubbled 404. `history.replaceState` syncs the URL so the in-flight upload survives.
- **Theming**: dark/light is driven by `data-bs-theme` on `<body>`, toggled in the navbar and persisted in `localStorage['theme']`. Page-level styles should prefer Bootstrap CSS variables (`var(--bs-body-color)`, `var(--bs-border-color)`, `var(--bs-tertiary-bg)`, `var(--bs-secondary-bg)`, `rgba(var(--bs-primary-rgb), …)`) and theme-aware utility classes (`bg-body-tertiary`, `bg-transparent`) instead of fixed colors like `#eee` or `bg-light`/`bg-white`, otherwise components stay light in dark mode (or vice versa).

### Database schema

Everything lives in PostgreSQL schema `assortment` (owned by role `barAdmin`). Tables: `person`, `product`, `category` (self-referencing tree via `category_ref_id`), `product_category` (join), `stock`, `filedata`, `cart`, `cart_item`. Each has a matching `*_seq` sequence. Views: `product_info`, `stock_info`, `filedata_info`, `category_info` (recursive CTE producing `id_path` / `name_path`). Passwords use the `pgcrypto` extension. The full DDL is `programmier_bar.sql` — treat it as the source of truth for column order, which the C# row-mapping constructors depend on. The bootstrap also seeds a default `barAdmin` admin user (login `barAdmin` / password `barAdmin`) so a fresh install has a way in; remove or rotate before any non-dev deploy.

The script runs **only on a fresh Postgres volume** (`docker compose down -v && up`). Edits to `programmier_bar.sql` therefore don't reach a live DB — for schema/data changes against an existing instance, write an additive idempotent SQL script and run it via `docker exec -i programmier_bar_postgres psql -U barAdmin -d programmier_bar < script.sql`.

## Editing conventions

- When writing or editing any file, do **not** leave a trailing newline at the end. The last line must end without a final `\n`.
- For section dividers (e.g. inside a class: private vars / constructor / properties / private methods / public methods), use VS Code region syntax — **but only when the file is longer than 100 lines**. Shorter files don't need them. This gives folding chevrons + Outline-panel entries in code-oss/VS Code. Only use it for section division; do not wrap individual functions. Example: see `programmier_bar.Web/src/app.js`. Per-language syntax:
  - JS:   `//#region <name>` … `//#endregion`
  - C#:   `#region <name>` … `#endregion` (built-in language feature)
  - CSS:  `/* #region <name> */` … `/* #endregion */`
  - HTML: `<!-- #region <name> -->` … `<!-- #endregion -->`
  - SQL:  `-- #region <name>` … `-- #endregion`

## Gotchas

- The `.NET` API csproj targets **`net10.0`**, but the Dockerfile builds with **`mcr.microsoft.com/dotnet/sdk:9.0-alpine`**. If you change the target framework or the base image, keep them consistent.
- Linux is case-sensitive: prefer lowercase paths everywhere (the SPA folder is `src/`, not `Src/`; all image filenames in `programmier_bar.Web/images/` are `.png`, not `.PNG`). Webpack and `html-loader` will not silently match case mismatches.
- `Stock`, `Category`, `Filedata`, and `Person` do **not** have audit / soft-delete columns; only `Product`, `Cart`, and `CartItem` do. If you copy the data-access pattern wholesale, decide deliberately whether the new entity needs them.
- There is **no `price` column on `product`** yet — storefront, cart, and checkout deliberately have no money math. The shop card already has a placeholder slot (`data-price` em-dash beside the cart-add button) for the eventual wire-up.
- Both csprojs set `<Nullable>annotations</Nullable>` (not `enable`). This keeps `?` annotations on nullable types but disables the analyzer warnings (CS8600/CS8602/CS8604/CS8629/etc.) that the existing codebase isn't fully annotated for. If you want analyzer enforcement on a specific file, opt-in locally with `#nullable enable` at the top of that file.
- `Filedata` has a hard `Delete()` (no `deldate` column) — see `Filedata.cs`. The DELETE endpoint is `DELETE /filedata/{id}` (auth-required). Used by the product-detail page's trash icon next to each uploaded file.