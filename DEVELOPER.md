# Developer guide

Everything you need to continue building **Smart To-Let** (house rental portal): Laravel REST API + React web app + admin panel.
Read this first, then `DOCKER.md` (run it) and `DEPLOYMENT.md` (ship it). API conventions are also kept as a Claude skill in `.claude/skills/api-conventions/SKILL.md`.

---

## 1. What the product does

| Audience | Capabilities |
|---|---|
| **Visitors** | Browse/search properties (filters, sort, pagination), property details with gallery/map/nearby, compare up to 3, recently viewed, category + city pages, blog (en/bn), contact, newsletter, FAQ/about/legal pages |
| **Users** (registered) | Register/login (email, Google/Facebook token exchange), wishlist, post a property (photos), pay the listing fee online (SSLCommerz, coupons), book a property visit, "My properties / visits / payments", profile + password, password reset |
| **Admins** (`/admin`) | Dashboard, approve/edit/publish properties, visit bookings, payments, inbox (property requests, contact messages, newsletter), cities & areas, coupons, blog, delivered report + CSV, site settings, DB backups, **sub-admins with per-section permissions** |

Money flow: a user pays a **listing fee** for a property they posted (`service_charge` on the property, else `PAYMENT_DEFAULT_AMOUNT`). There is no rent payment or rental booking yet (only *visit* booking).

---

## 2. Architecture

```
Browser ──► nginx (frontend container)
              ├─ /            → React SPA (static, Vite build)
              └─ /backend/*   → Laravel (nginx + php-fpm, prefix stripped)
                                   └─ MySQL
```

* **Backend:** Laravel **6** on PHP **7.4** (Laravel 6 does not run on PHP ≥ 8.1; see backlog). Legacy Blade site still exists next to the API (`routes/web.php`, `resources/views`). **All new work goes in the API** (`routes/api.php`, prefix `/api/v1`).
* **Frontend:** React 18 + plain JavaScript (no TypeScript), Vite, React Router 6, hand-written CSS. No state library: React context + a small `useFetch` hook.
* **Auth:** stateless bearer tokens in table `api_tokens` (SHA-256 hashed). Two guards: `api` (users, 30-day tokens) and `api-admin` (admins, 7-day tokens). A user token never works on admin routes.
* **Same-origin in Docker:** the SPA calls the API with the relative URL `/backend/api/v1`, so no CORS and no per-environment config.

---

## 3. Repository layout

```
app/
  Http/Controllers/Api/V1/          user + public controllers
  Http/Controllers/Api/V1/Admin/    admin controllers (AdminCrudController = generic CRUD base)
  Http/Resources/                   API Resources (JSON shape of every model)
  Http/Responses/ApiResponse.php    THE response envelope
  Http/Middleware/                  Cors, SecurityHeaders, ApplyUrlPrefix, AdminPermission, TrustProxies
  Exceptions/                       Handler (global JSON errors) + ApiException
  Model/                            Eloquent models (namespace App\Model; User/Admin/Order live in App\)
  Traits/                           ApiResponder, HasApiTokens, PropertyInput
  Support/                          ImageUploader, PublicUrl
  Console/                          scheduler + tokens:prune
database/migrations/                legacy (2019-2020) + new (2026_11_09_*) migrations
database/seeds/                     AdminSeeder, DemoSeeder
routes/api.php                      all API routes (the source of truth for endpoints)
frontend/src/
  api/            fetch client (client.js) + one function per endpoint (index.js)
  context/        Auth, Lang(i18n), Toast, Wishlist, Compare providers
  components/     shared UI (Navbar, Footer, PropertyCard, Pagination, Ui.jsx, Icons.jsx ...)
  pages/          public + user pages
  admin/          the admin panel (lazy-loaded chunk): AdminApp, AdminContext, pages/, components/
docker/ + docker-compose.yml        containers (db → backend → frontend)
.claude/skills/api-conventions/     API conventions for AI assistants
DEPLOYMENT.md  DOCKER.md  DEVELOPER.md
```

---

## 4. Run it

### Docker (recommended, zero config)
```bash
docker compose up --build
# site  http://localhost:8080   admin  http://localhost:8080/admin   API  http://localhost:8080/backend/api/v1
docker compose logs backend | grep -A4 "Admin panel login"     # generated admin password
```
(An earlier version also started an ngrok tunnel; the current compose file starts only db → backend → frontend. See `DOCKER.md`.)

### Without Docker
```bash
# backend (PHP 7.4, MySQL)
composer install
cp .env.example .env && php artisan key:generate     # set DB_*, FRONTEND_URL, CORS_ALLOWED_ORIGINS
php artisan migrate
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='long-password' php artisan db:seed --class=AdminSeeder
php artisan db:seed --class=DemoSeeder               # starter cities/areas/settings
php artisan serve                                    # or Apache/nginx with the project root as web root

# frontend
cd frontend && cp .env.example .env.local            # VITE_API_URL=http://localhost:8000/api/v1
npm install && npm run dev                           # http://localhost:5173
```
Note: the legacy layout serves from the **project root** (not `public/`); uploaded images are stored as `public/media/...` and linked with `url('public/media/...')`.

### Environment variables that matter
| Var | Purpose |
|---|---|
| `DB_*` | database |
| `FRONTEND_URL` | where SSLCommerz returns the user and where reset-password links point |
| `CORS_ALLOWED_ORIGINS` | comma separated origins (only needed when SPA and API are on different origins) |
| `URL_PREFIX` | `/backend` when the API is published under a sub-path (Docker) so generated URLs include it |
| `TRUSTED_PROXIES` | `*` or IP list when behind nginx/ngrok (needed for correct client IP + https links) |
| `STORE_ID`, `STORE_PASSWORD`, `API_DOMAIN_URL`, `IS_LOCALHOST`, `PAYMENT_DEFAULT_AMOUNT` | SSLCommerz |
| `MAIL_*` | mail (Docker default `MAIL_DRIVER=log`) |
| `GOOGLE_*`, `FACEBOOK_*` | social token exchange |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | used by `AdminSeeder` |
| `VITE_API_URL` | frontend API base (Docker build uses `/backend/api/v1`) |

Never commit `.env` (it is untracked now). Old secrets that were committed in git history must be rotated (see `DEPLOYMENT.md`).

---

## 5. Backend conventions (follow these)

### 5.1 Response envelope: always use it
```jsonc
// success
{ "success": true, "message": "OK", "data": ..., "meta": {...}, "links": {...} }   // meta/links only on lists
// error
{ "success": false, "message": "...", "code": "SNAKE_CASE", "errors": { "field": ["msg"] } }
```
* Build responses only with `ApiResponse` or the `ApiResponder` trait: `success()`, `created()`, `deleted()`, `paginated()`, `error()`. Never `response()->json()`.
* Pass the Resource class: `$this->success($model, 'OK', PropertyResource::class)`; for lists `$this->paginated($query->paginate($this->perPage($request)), PropertyResource::class)`. `paginated(..., $extraMeta)` adds keys to `meta`.
* **Do not name controller actions** `success`, `created`, `error`, `paginated`, `deleted` (clash with the trait).

### 5.2 Errors: throw, don't catch
`App\Exceptions\Handler` turns exceptions into the envelope for `/api/*` or `Accept: application/json`:
| Throw | Result |
|---|---|
| `$request->validate([...])` | 422 `VALIDATION_ERROR` + `errors` |
| `new ApiException($msg, $status, 'CODE')`, `ApiException::notFound/forbidden/conflict/badRequest()` | that status/code |
| `findOrFail()` | 404 `NOT_FOUND` |
| anything else | 500 `SERVER_ERROR` (details only when `APP_DEBUG=true`) |

### 5.3 Pagination
`?page=` and `?per_page=` (default 15, max 100) via `$this->perPage($request, $default, $max)`.

### 5.4 Authentication and permissions
* User routes: `middleware('auth:api')`, read with `$request->user()`. Admin routes: `auth:api-admin`, read with `$request->user('api-admin')`.
* Issue tokens with `$model->createApiToken($name, $days)` (trait `HasApiTokens`). Expired tokens are removed daily by `tokens:prune`.
* Optional auth on public routes: `$request->user('api')` (e.g. visit booking attaches the user if a token is sent).
* **Sub-admins:** `admins.type = '2'`, with yes/no columns `places, coupon, blogs, all_properties, orders, reports, user_role, newsletter, contact_messages, site_setting, database_backup`. Guard route groups with `->middleware('admin.can:<column>')`. `/admin/alerts` is open to every admin on purpose. `AdminResource` returns the computed `permissions` map used by the frontend.
* Rate limits: global `throttle:60,1`; sensitive routes use named buckets, e.g. `throttle:10,1,auth`, `...,forms`.

### 5.5 Models, tables and legacy quirks
* Models live in `app/Model` (namespace `App\Model`: **keep exact case**, Linux autoload is case-sensitive). `App\User`, `App\Admin`, `App\Order` are in `App\`.
* `Property` = table **`user_properties`**. Price columns are **strings** in the legacy schema: cast in resources, and `Property::scopeFilter` uses `CAST(price AS DECIMAL)` for ranges.
* `orders.property_Id` has a capital `I` (legacy). Use the `$order->property_id` accessor; the relation uses `property_Id`.
* `Postcategory` = table `post_category`; `SiteSetting` = `sitesetting`; `Inquiry` = `interested_properties`.
* Property status: `0` pending, `1` published, `2` delivery in progress, `3` delivered, `4` cancelled. **Public endpoints expose only 1 and 2** (`Property::public()`).
* Visit status: `pending | confirmed | cancelled | completed`. Slots are fixed in `Visit::SLOTS`, bookable up to 60 days ahead, slot uniqueness enforced in a DB transaction with `lockForUpdate`.
* Order status: `Pending | Complete | Failed | Canceled` (legacy `Done`/`Processing` also count as paid, see `Order::PAID`).
* Images: store with `ImageUploader::save()` (resizes via Intervention, returns `public/media/...`), expose with `url($path)`. Validate with `mimes:jpeg,jpg,png,webp,gif` (not `image`, which allows SVG in Laravel 6).
* Multipart updates: PHP does not parse multipart `PUT`, so clients send `POST` with `_method=PUT` (the admin CRUD and property update already support this).

### 5.6 Payment flow (SSLCommerz)
1. `POST /payments/checkout {property_id, coupon_code?}` (auth, own property only) creates a **Pending** order with a unique `transaction_id`, asks SSLCommerz for a hosted page and returns `payment_url`.
2. The SPA redirects the browser to `payment_url`.
3. The gateway POSTs the browser to `/payments/success|fail|cancel`; we **verify with SSLCommerz against the amount stored on our order** (never the posted amount), update the order, then redirect to `FRONTEND_URL/payment/{success|failed|cancelled}?tran_id=...`.
4. `/payments/ipn` is the server-to-server notification; it can also correct a wrongly "Failed" order.
Set the IPN URL in the SSLCommerz panel to `<api>/api/v1/payments/ipn`. Gateway callback URLs honour `URL_PREFIX` (they are built with `url()`).

### 5.7 Adding an endpoint (recipe)
1. Migration (+ model in `app/Model`, relations, `$fillable`/`$guarded`).
2. API Resource in `app/Http/Resources` (snake_case keys, ISO-8601 dates, cast numbers).
3. Controller extending `Api\V1\ApiController` (admin: `Admin\...`; simple CRUD: extend `AdminCrudController` and declare `$model`, `$resource`, `rules()`, `attributes()`).
4. Route in `routes/api.php` (state changes are POST/PUT/PATCH/DELETE, never GET; wrap admin routes in the right `admin.can:` group).
5. Validate in the controller; scope queries by owner (`where('user_id', ...)`) instead of policies.
6. Add the call to `frontend/src/api/index.js` and use it from a page.

### 5.8 Scheduler, queue, mail
* `app/Console/Kernel.php`: `tokens:prune` daily, `backup:run --only-db` 02:00, `backup:clean` 02:30. Needs the cron entry from `DEPLOYMENT.md`.
* `invoiceMail` implements `ShouldQueue`; with `QUEUE_CONNECTION=sync` it sends inline. Failures are logged, never block the request.

---

## 6. API reference

Base: `/api/v1`. **Auth** column: `-` public, `U` user token, `A` admin token (`perm` = needs that admin permission). Every response uses the envelope above. Lists are paginated.

### Public
| Method | Path | Notes |
|---|---|---|
| GET | `/ping` | health |
| POST | `/auth/register`, `/auth/login` | returns `{user, token}` |
| POST | `/auth/forgot-password`, `/auth/reset-password` | always answers the same message (no account probing) |
| POST | `/auth/social/{google\|facebook}` | body `{access_token}` → our token |
| GET | `/properties` | filters: `q, city_id, subcity_id, category, type, purpose, bedroom, bathroom, min_price, max_price, badge(trend\|best_rated\|hot_new), sort(latest\|oldest\|price_asc\|price_desc)` |
| GET | `/properties/near` | `lat, lng, radius_km` (MySQL only) |
| GET | `/properties/{id}`, `/properties/{id}/nearby` | published only |
| POST | `/properties/{id}/inquiries` | "I'm interested" |
| GET | `/properties/{id}/visit-slots?date=YYYY-MM-DD` | free/taken slots |
| POST | `/properties/{id}/visits` | book a visit (guest or user) |
| GET | `/cities`, `/cities/{id}`, `/subcities` | `?with_subcities=1`, `?city_id=` |
| GET | `/blog/posts`, `/blog/posts/{id}`, `/blog/categories`, `/reviews`, `/settings` | |
| POST | `/newsletter`, `/contact`, `/coupons/validate` | |
| POST | `/payments/success\|fail\|cancel\|ipn` | **gateway callbacks only** |

### User (`U`)
`POST /auth/logout`, `GET /auth/me`, `PUT /auth/profile`, `PUT /auth/password`,
`GET|POST /my/properties`, `GET|DELETE /my/properties/{id}` (delete only while pending),
`GET /my/orders`, `GET /my/orders/{id}`, `GET /my/visits`, `POST /my/visits/{id}/cancel`,
`POST /payments/checkout`, `GET /wishlist`, `POST|DELETE /wishlist/{propertyId}`.

### Admin (`A`)
| Area (perm) | Endpoints |
|---|---|
| Auth | `POST /admin/auth/login` (public), `POST /admin/auth/logout`, `GET /admin/auth/me`, `GET /admin/alerts` |
| Properties (`all_properties`) | `GET|POST /admin/properties`, `GET|PUT|DELETE /admin/properties/{id}` (POST + `_method=PUT` for files), `POST /admin/properties/{id}/{approve\|cancel\|pending\|delivery-progress\|delivered}` |
| Visits / payments / requests (`orders`) | `GET /admin/visits`, `PATCH|DELETE /admin/visits/{id}`; `GET /admin/orders[/{id}]`, `DELETE /admin/orders/{id}`; `GET /admin/inquiries`, `PATCH|DELETE /admin/inquiries/{id}` |
| Contacts (`contact_messages`) | `GET /admin/contacts[/{id}]`, `PATCH|DELETE /admin/contacts/{id}` (`is_read`, `show_as_review`) |
| Newsletter (`newsletter`) | `GET /admin/newsletters`, `DELETE /admin/newsletters/{id}` |
| Places (`places`) | `apiResource` `/admin/cities`, `/admin/subcities` |
| Coupons (`coupon`) | `apiResource` `/admin/coupons` (`code`, `discount` percent) |
| Blog (`blogs`) | `apiResource` `/admin/blog/categories`, `/admin/blog/posts` |
| Reports (`reports`) | `GET /admin/reports/summary`, `/admin/reports/delivered`, `/admin/reports/delivered/export` (CSV) |
| Settings (`site_setting`) | `GET|PUT /admin/settings` |
| Sub-admins (`user_role`) | `apiResource` `/admin/admins` |
| Backups (`database_backup`) | `GET|POST /admin/backups`, `GET|DELETE /admin/backups/{name}` |

`php artisan route:list --path=api/v1` is the live source of truth (needs a PHP version Laravel 6 supports).

---

## 7. Frontend guide

### 7.1 Data flow
* `src/api/client.js`: `request()` adds the bearer token, parses the envelope, throws `ApiError` (`.message`, `.status`, `.code`, `.errors`, `.field('name')`). A 401 clears the token and fires `auth:expired` / `admin:expired`. Two token stores: `tokenStore` (`hr_token`) and `adminTokenStore` (`hr_admin_token`). `downloadFile()` saves authenticated downloads (CSV, backups).
* `src/api/index.js`: one function per endpoint (`propertyApi`, `myApi`, `contentApi`, ...). Pages never build URLs by hand. Admin calls use `admin/adminApi.js` (`adm.get/post/put/patch/del`).
* `hooks/useFetch(fn, deps)` → `{data, meta, loading, error, reload}` (keeps previous data while reloading).
* Form pattern: local state + `try/catch`; show `err.field('x')` under inputs via `<Field label error>` and a top `alert` when `!err.errors`.

### 7.2 State / contexts
`AuthContext` (user session), `WishlistContext` (saved ids so every card can show its heart), `CompareContext` (≤3 ids in localStorage), `ToastContext` (`toast.success/error/info`), `LangContext` (en/bn dictionary `t('key')`; only nav/home/filter strings are translated so far). `AdminContext` holds the admin, `can(permission)` and the sidebar `alerts`.

localStorage keys: `hr_token`, `hr_admin_token`, `hr_lang`, `hr_compare`, `hr_recent`, `hr_admin_pinned`. Wrap storage access in try/catch (already done in the helpers).

### 7.3 Public/user pages
Routes live in `src/App.jsx`. Protected user pages use `guard(<Page/>)` (redirects to `/login` and back). Each page should call `usePageMeta(title, description)` for SEO. Shared building blocks: `PropertyCard`, `Pagination`, `Ui.jsx` (`Loader`, `EmptyState`, `ErrorBox`, `PageHeader`, `Field`, `Modal`).

### 7.4 Admin panel
* Entry `src/admin/AdminApp.jsx`, mounted at `/admin/*` as a **lazy chunk** (visitors never download it). Navigation items map to permissions in the `NAV` array; add a page by (1) creating `admin/pages/X.jsx`, (2) adding a `<Route>` wrapped in `guard('permission', ...)`, (3) adding a `NAV` entry with an icon and optional badge key.
* **`DataTable`** (`admin/components/DataTable.jsx`) is the standard list: columns `{label, key|render, sort}`, `selectable` + `bulkActions`, `actions(row) → items[]` for the **context menu** (⋮ button and right-click; items `{label, icon, onClick, danger, hidden, divider}`; build the list from the row's status), `meta/onPage/perPage/onPerPage`. Use `usePaging()` for page state. Sorting is **client-side, current page only**.
* **`CrudPage`** builds a full list + create/edit modal + delete from a config (`endpoint`, `columns`, `fields`, `toForm`, `toBody`). Use it for simple resources (see `pages/CrudPages.jsx`).
* Other helpers in `AdminUi.jsx`: `PageHead`, `Tabs` (optional counts), `Toolbar`, `SearchBox`, `FormModal`, `StatCard`; `Charts.jsx` has dependency-free SVG `LineChart` and `Donut`.
* Sidebar is a mini icon rail that expands on hover; `hr_admin_pinned` keeps it open. Badges come from `/admin/alerts` (refreshed every 60 s and after inbox actions).

### 7.5 Styling
Plain CSS: `src/styles.css` (public site; tokens in `:root`) and `src/admin/admin.css` (admin; green palette, scoped under `.a-shell`/`.a-login`). **Class names are global**: prefix new admin-only classes (`a-`, `dt-`, `ctx-`) to avoid collisions (a public `.block` class once broke admin table spacing). Layout is mobile-first responsive; check 390 px and 1440 px.

---

## 8. Quality, testing and verification

* There is **no automated test suite** (it was out of scope on request). Before shipping changes, at minimum: build the frontend (`npm run build`), hit the changed endpoints, and click through the affected pages on desktop + phone width.
* The API was verified with scripted requests against a throwaway SQLite database (booting Laravel 6 on PHP 8.3 needs a small harness that skips the deprecation→exception handler); UI was checked with Playwright screenshots against mocked responses. A real MySQL + SSLCommerz sandbox run has **not** been done: do it on staging (`DEPLOYMENT.md` §5 checklist).
* Recommended next investment: PHPUnit feature tests for auth, property workflow, visit slot locking and the payment callbacks; Playwright e2e for register → post → approve → book → pay.

---

## 9. Gotchas learned the hard way

* `laravel/ui` must stay in `require` (not dev): `Auth::routes()` needs it, so `composer install --no-dev` crashes without it.
* Don't rely on a stale `bootstrap/cache/*.php` after switching dev/prod dependency sets; delete it (the Docker build does).
* Laravel 6 `image` validation accepts SVG; use `mimes:`.
* In PHP-FPM/MySQL the legacy `property_Id` column returns its declared case: use accessors.
* `Handler::render` must accept `Exception` (Laravel 6 signature), not `Throwable`.
* Behind a proxy, set `TRUSTED_PROXIES` or throttling treats everyone as one IP and links are `http://`.
* The web root is the project root: `.htaccess` (Apache) and `docker/backend/nginx.conf` deny `.env`, `vendor/`, `storage/`, `*.sql`, `Instruction.txt`. Keep those rules if you change the server config. `Instruction.txt` contains demo credentials: never deploy it (it is blocked) and never reuse those logins.

---

## 10. Backlog (suggested order)

1. **Upgrade Laravel** (6 → current LTS, PHP 8.2+): security fixes; then drop the PHP 7.4 pin in `docker/backend/Dockerfile`.
2. **Automated tests** (see §8) and a CI workflow (build frontend, run PHPUnit, lint).
3. **Email verification** for new accounts; welcome / visit-confirmed / payment-receipt emails (queue + real SMTP).
4. **Server-side sorting + status counts** for admin tables (`?sort=&dir=` on list endpoints; tab counts from the API).
5. **Google/Facebook sign-in buttons** in the SPA (API endpoint is ready).
6. **Full i18n:** move all UI strings into `LangContext` dictionaries (only nav/home/filters are translated).
7. **Rental booking** (move-in date, deposit, agreement, tenant payments) if the product needs real bookings beyond visits; the legacy `demo-Aggrement.pdf` hints at it.
8. **Per-property reviews/ratings** (today "reviews" are contact messages the admin flags).
9. **Object storage + CDN** for property photos (currently local disk `public/media`); WebP/thumbnails.
10. **SEO:** server-side rendering or prerender for property pages, sitemap endpoint, Open Graph tags.
11. **Restructure web root** to `public/` (needs a data migration of stored `public/media/...` paths) and remove the legacy Blade site once nothing uses it.
12. **Observability:** Sentry, request logging, alerts on payment failures.

---

## 11. Definition of done for a change

- [ ] Follows the envelope/error/pagination conventions; new routes are in the right permission group.
- [ ] Migrations are idempotent for existing databases (see `2026_11_09_000002` / `000004` for the guarded style).
- [ ] No secrets or personal data committed; `.env.example` and docs updated for new settings.
- [ ] Frontend builds; checked at phone and desktop widths; loading, empty and error states handled.
- [ ] `DEVELOPER.md` / `DEPLOYMENT.md` / the API skill updated when behaviour or setup changes.
