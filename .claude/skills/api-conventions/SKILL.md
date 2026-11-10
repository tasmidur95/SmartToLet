---
name: api-conventions
description: Conventions for the HouseRental REST API (/api/v1, Laravel 6). Use when adding or changing any API endpoint, controller, resource, error handling, pagination or auth in this repo.
---

# HouseRental API conventions

The API lives under `/api/v1` (`routes/api.php`, controllers in `app/Http/Controllers/Api/V1`). The React frontend consumes it. Never add JSON endpoints to `routes/web.php`.

## Response envelope (always use it)
- Success: `{ "success": true, "message": "...", "data": ..., "meta"?: {...}, "links"?: {...} }`
- Error: `{ "success": false, "message": "...", "code": "SNAKE_CASE", "errors"?: {field: [msgs]} }`
- Build responses only through `App\Http\Responses\ApiResponse` or the `App\Traits\ApiResponder` helpers in controllers: `success()`, `created()`, `deleted()`, `paginated()`, `error()`. Do not call `response()->json()` directly.
- Pass an API Resource class as the last argument (`$this->success($model, 'OK', PropertyResource::class)`) rather than returning models.

## Errors
- Do not catch exceptions to build error JSON. Throw and let `App\Exceptions\Handler` render it:
  - validation: `$request->validate([...])` (422 `VALIDATION_ERROR`)
  - business errors: `throw new ApiException($msg, $status, 'CODE')` or `ApiException::notFound()/forbidden()/conflict()/badRequest()`
  - missing model: `findOrFail()` (404 `NOT_FOUND`)
- Unexpected errors become 500 `SERVER_ERROR`; details are shown only when `APP_DEBUG=true`.

## Pagination
- Every list endpoint paginates: `$this->paginated($query->paginate($this->perPage($request)), SomeResource::class)`.
- `?page=` and `?per_page=` (default 15, max 100). `meta` carries current_page/per_page/total/last_page/from/to, `links` carries first/last/prev/next.

## Auth
- Bearer tokens in `api_tokens` (hashed). Users: `auth:api`; admins: `auth:api-admin` (separate token tables rows via morph type, so a user token never works on admin routes).
- Issue tokens with `$model->createApiToken($name, $days)` (trait `HasApiTokens`). Admin routes live under `/api/v1/admin`.
- Read the current user with `$request->user()` (user routes) or `$request->user('api-admin')`.

## Adding an endpoint
1. Migration/model if needed (models in `app/Model`, namespace `App\Model`: keep the case exact, Linux autoload is case sensitive).
2. API Resource in `app/Http/Resources` (snake_case keys, ISO-8601 dates, cast numeric strings: legacy columns like `price` are strings).
3. Controller extending `Api\V1\ApiController` (admin simple CRUD: extend `Admin\AdminCrudController`).
4. Register the route in `routes/api.php` (state changes are POST/PUT/PATCH/DELETE, never GET; throttle public write endpoints with a named prefix, e.g. `throttle:10,1,forms`).
5. Validate in the controller, authorize ownership by scoping queries (`where('user_id', ...)`).

## Domain notes
- Property status: 0 pending, 1 published, 2 delivery_progress, 3 delivered, 4 cancelled. Public endpoints only expose 1 and 2 (`Property::public()`).
- Property images are stored as `public/media/...` relative paths (legacy Blade format); expose them with `url($path)`. Use `App\Support\ImageUploader`.
- Multipart updates: clients send `POST` with `_method=PUT`.
- Orders are SSLCommerz payments for a listing (`App\Order`, statuses Pending/Complete/Failed/Canceled; the legacy column is `property_Id`, use `->property_id` accessor). Checkout returns `payment_url`; gateway callbacks `/payments/*` verify against the amount stored on our order and redirect to `FRONTEND_URL`.
- Child admins: `admins.type = 2` with per-section flags; guard routes with `->middleware('admin.can:<column>')`.
- Do not name controller actions `success`, `created`, `error`, `paginated`, `deleted` (they clash with `ApiResponder`).
- Do not write test cases unless the user asks for them.
