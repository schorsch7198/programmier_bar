<div align="center">

# 🍸 programmier_bar

### A full-stack cocktail & tapas online shop

*Built end-to-end: vanilla JavaScript SPA, ASP.NET Core REST API, PostgreSQL, and Docker — no frameworks doing the heavy lifting.*

![.NET](https://img.shields.io/badge/.NET-10-512BD4?style=for-the-badge&logo=dotnet&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![Webpack](https://img.shields.io/badge/Webpack-5-8DD6F9?style=for-the-badge&logo=webpack&logoColor=black)
![Nginx](https://img.shields.io/badge/Nginx-Reverse_Proxy-009639?style=for-the-badge&logo=nginx&logoColor=white)

</div>

---

## 📑 Table of contents

- [Overview](#-overview)
- [Tech stack](#-tech-stack)
- [Features](#-features)
- [Architecture](#-architecture)
- [Quick start](#-quick-start)
- [Project structure](#-project-structure)
- [Roles & permissions](#-roles--permissions)
- [API surface](#-api-surface)
- [Notable engineering decisions](#-notable-engineering-decisions)

---

## 🧭 Overview

**programmier_bar** is an online shop for cocktails and tapas. It demonstrates a complete three-tier system written from scratch — a frontend SPA without React/Vue, a hand-rolled .NET data-access layer without an ORM, and a normalized PostgreSQL schema with recursive category trees, soft-deletes, audit trails, and an anonymous-cart flow that survives login.

Everything is containerized; one `docker compose up` brings up the database, admin console, API, SPA, and a reverse proxy.

---

## 🛠 Tech stack

| Layer | Stack |
|------|-------|
| **Frontend** | Vanilla JS (ES2022), Bootstrap 5, Webpack 5, hash-based routing, ESLint |
| **Backend** | ASP.NET Core 10 Web API, cookie auth |
| **Data access** | Custom DAL on top of `Npgsql` — no EF / no ORM |
| **Database** | PostgreSQL 17 (schema `assortment`, `pgcrypto`, recursive CTEs) |
| **DevOps** | Docker Compose, multi-stage Dockerfile, Nginx reverse proxy |
| **Admin tooling** | pgAdmin 4 |

---

## ✨ Features

- 🛍 **Public storefront** — anonymous visitors can browse categories and products without logging in
- 🛒 **Anonymous cart** — items persist in `localStorage`; on login, the cart auto-syncs to the server via `POST /cart/sync` (merged per product)
- 🌳 **Self-referencing category tree** — unlimited depth, materialized into `id_path` / `name_path` via a recursive view
- 🔐 **Cookie-based auth** — `logintoken` cookie issued on login; every protected endpoint resolves the current user from it
- 👥 **Three-role authorization** — `Standard`, `Disponent`, `Administration`; the SPA gates pages by `roleNumber`
- 🗂 **Soft delete + audit columns** — `deldate`/`deluser`/`insuser`/`insdate`/`upduser`/`upddate` on every mutating entity
- 🧾 **Stock tracking** — per-product stock with its own admin UI
- 🖼 **Product images on the storefront** — admins upload images on the product-detail page (drag-and-drop or click); the shop catalog displays each product's first image with a soft-blurred backdrop fill so non-matching aspect ratios don't leave white gaps. Per-file delete via a trash icon.
- 🪟 **Flippable navbar** — fixed top or bottom, preference persisted in `localStorage`, body padding auto-adjusts via `ResizeObserver`
- ⚡ **Same-origin mode** — optional Nginx reverse proxy serves SPA + API on port 80 to skip CORS entirely

---

## 🏗 Architecture

```
                     ┌────────────────────────────────────┐
                     │     Nginx reverse proxy (:80)      │
                     │   / → SPA   /product /cart … → API │
                     └────────────┬───────────────────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              ▼                   ▼                   ▼
       ┌────────────┐      ┌────────────┐      ┌────────────┐
       │  SPA       │      │  Web API   │      │ PostgreSQL │
       │  :5500     │◄────►│  :5181     │◄────►│  :7777     │
       │  Bootstrap │ HTTP │  ASP.NET   │ ADO  │  schema    │
       │  Vanilla JS│      │  cookies   │ .NET │ assortment │
       └────────────┘      └────────────┘      └────────────┘
                                                      ▲
                                              ┌───────┴────┐
                                              │  pgAdmin   │
                                              │   :5050    │
                                              └────────────┘
```

Three sibling projects in one repo:

- **`programmier_bar.dbClassLibrary/`** — domain entities + DAL. All SQL lives here.
- **`programmier_bar.dbApiControllers/`** — thin ASP.NET controllers that delegate to the library.
- **`programmier_bar.Web/`** — the SPA, organized in a pragmatic Feature-Sliced layout (`pages/`, `widgets/`, `features/`, `entities/`, `shared/`).

---

## 🚀 Quick start

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for the SPA build)

### Run the whole stack

```bash
# 1. Build the SPA bundle into dist/dev
cd programmier_bar.Web
npm install
npm run build:dev      # or `npm run watch` for rebuilds on save

# 2. From the repo root, start everything
cd ..
docker compose up --build
```

| Service | URL | Notes |
|---------|-----|-------|
| 🛍 Storefront (SPA) | http://localhost:5500 | Static SPA served by Nginx |
| 🔗 Unified entry (proxy) | http://localhost | SPA + API on one origin |
| ⚙️ Web API | http://localhost:5181 | ASP.NET Core |
| 🐘 PostgreSQL | `localhost:7777` | user/pass `barAdmin` / `barAdmin` |
| 🖥 pgAdmin | http://localhost:5050 | `pgadmin4@pgadmin.org` / `admin` |

### Default admin login
```
username: barAdmin
password: barAdmin
```
> ⚠️ Seeded by `programmier_bar.sql` for first-run convenience. **Rotate before any non-dev deploy.**

### Frontend dev loop with hot reload
For a faster iteration loop (no static rebuild), run the SPA with `webpack-dev-server` on the host and only the backend in Docker:
```bash
docker compose up postgres webapi          # backend only
cd programmier_bar.Web && npm start        # SPA on :5500 with HMR
```

---

## 📁 Project structure

```
programmier_bar/
├── programmier_bar.dbClassLibrary/      # domain models + DAL (Npgsql, no ORM)
│   ├── Person.cs  Product.cs  Category.cs  Stock.cs  Filedata.cs
│   ├── Cart.cs    CartItem.cs  ProductCategory.cs
│   └── DbSqlConnection.cs  DbSettings.cs
│
├── programmier_bar.dbApiControllers/    # ASP.NET Core Web API
│   └── Controllers/
│       ├── PersonController.cs   ProductController.cs
│       ├── CategoryController.cs StockController.cs
│       ├── CartController.cs     FiledataController.cs
│       └── PageController.cs
│
├── programmier_bar.Web/                 # Vanilla-JS SPA (Webpack 5 + Bootstrap)
│   └── src/
│       ├── pages/      home  login  shop  shop-item  cart
│       │               product-list  product-detail
│       │               categories  person-list  person-detail
│       ├── widgets/    nav-bar  category-tree
│       ├── features/   cart-add-item  category-edit  stock-edit
│       ├── entities/   cart (localStorage helpers)
│       └── shared/     api/client.js  lib/format.js
│
├── programmier_bar.sql                  # full schema + seed (runs on fresh volume)
├── compose.yaml                         # postgres · pgadmin · webapi · spa · nginx
├── Dockerfile                           # multi-stage .NET build
└── nginx.conf                           # reverse-proxy routing
```

---

## 👥 Roles & permissions

| Role | Code | Capabilities |
|------|------|--------------|
| **Standard** | `0` | Browse, manage own cart, checkout |
| **Disponent** | `1` | Standard + manage stock & product catalog |
| **Administration** | `2` | Full access including users and categories |

Public, unauthenticated endpoints (so the storefront works for logged-out visitors):

```
GET /product
GET /product/{id}
GET /product/{id}/filedata
GET /category
GET /filedata/{id}/download
```

Everything else requires the `logintoken` cookie.

---

## 🔌 API surface

| Resource | Routes |
|----------|--------|
| `/person`   | login, current user, list/CRUD (role-gated) |
| `/product`  | list/detail (public) · create/update/delete (auth) |
| `/category` | list (public) · create/update/delete (auth) |
| `/stock`    | per-product stock CRUD |
| `/cart`     | get/add/update/remove · `POST /cart/sync` for anonymous → user migration |
| `/filedata` | public download (`GET /filedata/{id}/download`) · upload via `POST /product/{id}/filedata` · `DELETE /filedata/{id}` (auth) |
| `/page`     | static content blocks |

URL conventions: **lowercase** (`LowercaseUrls` + `LowercaseQueryStrings` enabled in `Program.cs`).

---

## 🧠 Notable engineering decisions

<details>
<summary><strong>No ORM — hand-rolled DAL with a positional row mapper</strong></summary>

Every domain class follows the same template: `TABLE` / `COLUMNS` / `SELECT` constants at the top, a `T(object[] data)` constructor that maps rows by index, and `Save` / `Delete` methods that handle insert-vs-update by checking the primary-key property. Aggregates (e.g. `Product` + its category links + stock rows) save inside a single `NpgsqlTransaction`. The result: full control over SQL, zero migration surprises, and a uniform pattern that's trivial to extend.

</details>

<details>
<summary><strong>Soft delete + full audit trail</strong></summary>

`Product`, `Cart`, and `CartItem` carry `insuser`/`insdate`/`upduser`/`upddate`/`deluser`/`deldate`. `Get` and `GetList` filter `where deldate is null`; deletion is a timestamp + username, never a `DELETE`.

</details>

<details>
<summary><strong>Recursive category tree</strong></summary>

`category` is self-referencing via `category_ref_id`. The `category_info` view uses a recursive CTE to materialize `id_path` and `name_path` for every node, so the frontend can render breadcrumbs and the navbar dropdown without traversing on the client.

</details>

<details>
<summary><strong>Anonymous cart → user cart sync</strong></summary>

Logged-out users get a cart in `localStorage`. On successful login the SPA posts the local cart to `POST /cart/sync`, which **merges by product** rather than replacing — so a returning user keeps both their server-side cart and whatever they added as a guest. The cart page renders both flavors uniformly.

</details>

<details>
<summary><strong>Hash-based SPA routing + per-navigation widget lifecycle</strong></summary>

`src/app.js` switches on `location.hash` and rebuilds the navbar on every navigation. Widgets that attach `window` listeners (cart badge, category dropdowns, navbar `ResizeObserver`) implement a `destroy()` to prevent leaks. Cross-cutting refreshes use `CustomEvent`s: `cart:changed`, `category:changed`.

</details>

<details>
<summary><strong>Same-origin via reverse proxy (optional)</strong></summary>

The `nginx` service proxies `/person /product /category /stock /page /filedata /cart` to the API and everything else to the SPA on port 80. Use it to demo the app on a single origin and bypass the hard-coded CORS allowlist.

</details>

<details>
<summary><strong>Dynamic API origin for same-site cookies</strong></summary>

The SPA derives its API base URL from the page's own origin: `${location.protocol}//${location.hostname}:5181`. This way the `logintoken` cookie qualifies as same-site whether you reach the SPA via `localhost:5500`, `127.0.0.1:5500`, or a custom hostname like `programmier-bar:5500` (added to `/etc/hosts`). The matching origins are in the API's CORS allowlist in `Program.cs`. The port (`5181`) is still hard-coded — change there if the API moves.

</details>

---

<div align="center">

*Built with care · no framework, no shortcuts*

</div>