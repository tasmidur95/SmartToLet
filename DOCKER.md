# Run everything with Docker

```bash
docker compose up --build
```
No settings are required.

## What starts, in order
| # | Service | What it does |
|---|---|---|
| 1 | `db` | MySQL 8 (data kept in the `db_data` volume) |
| 2 | `backend` | Laravel API on PHP 7.4. Waits for the DB, creates the app key and the admin account once, runs migrations, seeds starter cities/areas/settings |
| 3 | `frontend` | React site + nginx. Proxies `/backend` to Laravel |

## Addresses
```
http://localhost:8080            website
http://localhost:8080/backend    Laravel API   ->  /backend/api/v1/...
http://localhost:8080/admin      admin panel
```
The website calls the API with a relative URL (`/backend/api/v1`), so it works on any host with no configuration.

## Admin login
The admin password is generated on first start and printed once in the backend log:
```bash
docker compose logs backend | grep -A4 "Admin panel login"
```
Email defaults to `admin@example.com`. Set your own with `ADMIN_EMAIL=... ADMIN_PASSWORD=...` (in the shell or `.env`).

## Optional settings (shell variables or `.env`)
`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `SEED_DEMO=false` (skip sample cities), `DB_PASSWORD`,
`STORE_ID` / `STORE_PASSWORD` (SSLCommerz sandbox),
`GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET`.

## Everyday commands
```bash
docker compose up -d --build     # start in the background
docker compose logs -f backend   # follow the API log
docker compose down              # stop (data kept)
docker compose down -v           # stop and delete database, uploads, generated admin password
```
## Notes and limits
- Meant for demos and testing, not for production (see `DEPLOYMENT.md` for that). The database is not exposed on the host; only port 8080 is published.
- Mail is written to the backend log (`MAIL_DRIVER=log`), so password-reset mails appear in `docker compose logs backend`.
- Uploaded photos live in the `media` volume.
- Laravel 6 needs PHP <= 8.0, so the backend image uses PHP 7.4.
