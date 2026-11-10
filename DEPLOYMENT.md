# Deployment guide

Two parts: the **Laravel API** (this repo's root, `/api/v1`) and the **React app** (`frontend/`, static files).
Suggested layout: `https://example.com` -> React build, `https://api.example.com` -> Laravel.

## 0. Before the first deploy: security checklist
- [ ] **Rotate every secret that was ever committed.** `.env` (APP_KEY, DB password, mail password, SSLCommerz store password, Pusher keys) and the Google client secret in `config/services.php` were in git history. Untracking them does not remove them from old commits. Create new keys/passwords and treat the old ones as leaked. Optionally rewrite history (`git filter-repo`) before making the repo public.
- [ ] `houserental.sql` and `Instruction.txt` contain demo data and demo logins (`admin@gmail.com / admin`, `user@gmail.com / user`). **Do not import these accounts into production.** Create the admin with the seeder below and delete the demo users.
- [ ] `APP_ENV=production`, `APP_DEBUG=false`, a new `APP_KEY` (`php artisan key:generate`).
- [ ] HTTPS everywhere (the API sends HSTS when it sees HTTPS).
- [ ] The web server must not serve `.env`, `vendor/`, `storage/`, `app/`, `*.sql`, ... The repo's `.htaccess` blocks these on Apache. On nginx use the config below. Verify: `curl -I https://api.example.com/.env` must return 403/404.

## 1. Requirements
- PHP **7.4 - 8.0** with `mbstring, xml, curl, gd, pdo_mysql, fileinfo, zip`, Composer 2
  (the app runs on Laravel 6, which does not support PHP 8.1+; plan an upgrade to a supported Laravel version soon because Laravel 6 no longer receives security fixes)
- MySQL 5.7+/MariaDB 10.3+ (`mysqldump` on the server for backups), Node 18+ to build the frontend
- Redis is optional (recommended for cache/queue under load)

## 2. API
```bash
git clone <repo> /var/www/houserental && cd /var/www/houserental
composer install --no-dev --optimize-autoloader
cp .env.example .env            # then edit (see section 3)
php artisan key:generate
php artisan migrate --force     # new databases; for an existing dump see the note below
ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='a-long-unique-password' php artisan db:seed --class=AdminSeeder
php artisan config:cache && php artisan route:cache
chown -R www-data:www-data storage bootstrap/cache public/media
```
Existing database imported from `houserental.sql`: run `php artisan migrate --force` anyway. The new migrations only add missing columns/indexes (`api_tokens`, `visits`, `orders.amount`, admin permission columns, coordinates, indexes).

### Cron (scheduler: backups, token cleanup)
```
* * * * * www-data cd /var/www/houserental && php artisan schedule:run >> /dev/null 2>&1
```

### Queue worker (confirmation e-mails)
Set `QUEUE_CONNECTION=database` (run `php artisan queue:table && php artisan migrate`) or `redis`, then keep a worker running with Supervisor:
```ini
[program:houserental-worker]
command=php /var/www/houserental/artisan queue:work --sleep=3 --tries=3 --max-time=3600
user=www-data
autostart=true
autorestart=true
stdout_logfile=/var/log/houserental-worker.log
```
(With the default `sync` driver mails are sent inside the request, which works but is slower.)

### nginx (API)
```nginx
server {
    listen 443 ssl http2;
    server_name api.example.com;
    root /var/www/houserental;          # legacy layout: project root is the web root
    index index.php;
    client_max_body_size 16m;

    # never expose internals
    location ~ /\.(?!well-known) { deny all; }
    location ~* ^/(vendor|storage|app|bootstrap|config|database|routes|resources|tests|frontend|node_modules)/ { deny all; }
    location ~* ^/(artisan|server\.php|webpack\.mix\.js|package\.json|composer\.(json|lock))$ { deny all; }
    location ~* \.(env|sql|md|lock|log|bak|xml|ya?ml)$ { deny all; }
    location = /Instruction.txt { deny all; }

    location /public/media/ { expires 30d; access_log off; }   # uploaded photos
    location / { try_files $uri $uri/ /index.php?$query_string; }
    location ~ \.php$ {
        include fastcgi_params;
        fastcgi_pass unix:/run/php/php7.4-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
    }
}
```

## 3. API environment (`.env`)
| Key | Notes |
|---|---|
| `APP_ENV=production`, `APP_DEBUG=false`, `APP_URL=https://api.example.com` | |
| `DB_*` | dedicated DB user with only this database |
| `MAIL_*`, `MAIL_FROM_ADDRESS` | needed for password reset, confirmations, backups notifications |
| `FRONTEND_URL=https://example.com` | where SSLCommerz returns users and where reset links point |
| `CORS_ALLOWED_ORIGINS=https://example.com` | comma separated; never `*` in production |
| `STORE_ID`, `STORE_PASSWORD`, `API_DOMAIN_URL=https://securepay.sslcommerz.com`, `IS_LOCALHOST=false` | live payments (use the sandbox values while testing) |
| `PAYMENT_DEFAULT_AMOUNT` | listing fee when a property has no service charge |
| `GOOGLE_CLIENT_ID/SECRET`, `FACEBOOK_CLIENT_ID/SECRET` | only if social login is used |
| `LOG_CHANNEL=daily`, `CACHE_DRIVER`, `SESSION_DRIVER`, `QUEUE_CONNECTION` | `redis` recommended at scale |

In the SSLCommerz merchant panel set the IPN URL to `https://api.example.com/api/v1/payments/ipn`.

## 4. Frontend
```bash
cd frontend
echo "VITE_API_URL=https://api.example.com/api/v1" > .env.production.local
npm ci && npm run build          # output in frontend/dist
```
Upload `dist/` to the web root of `example.com`. It is a single-page app, so unknown paths must fall back to `index.html`:
```nginx
server {
    listen 443 ssl http2;
    server_name example.com;
    root /var/www/houserental-web;
    index index.html;
    location /assets/ { expires 1y; add_header Cache-Control "public, immutable"; }
    location / { try_files $uri /index.html; }
    add_header X-Content-Type-Options nosniff;
    add_header Referrer-Policy strict-origin-when-cross-origin;
}
```
The admin panel is at `https://example.com/admin`.

## 5. Go-live smoke test
1. `GET https://api.example.com/api/v1/ping` returns `pong`.
2. Register a user, post a property with photos, sign in at `/admin`, approve it, see it on the site.
3. Book a visit, confirm it in admin, check "My visits".
4. Pay the listing fee in the SSLCommerz sandbox: order becomes `Complete`.
5. Admin -> Backups -> "Back up now" works (needs `mysqldump`).
6. `curl -I https://api.example.com/.env` -> 403/404.

## 6. Operations
- **Backups:** the scheduler runs `backup:run --only-db` at 02:00 and `backup:clean` at 02:30 (files in `storage/app/<APP_NAME>/`). Copy them off the server (S3, another host). Also back up `public/media/` (uploaded photos).
- **Logs:** `storage/logs/`. Watch for `SSLCommerz` and `PAYMENT_GATEWAY_ERROR` entries.
- **Deploy update:** `git pull && composer install --no-dev -o && php artisan migrate --force && php artisan config:cache && php artisan route:cache && php artisan queue:restart`, then rebuild/upload the frontend.
- **Rate limits** are set in `routes/api.php` (login/forms: 10 per minute per IP).

## 7. Known limitations
- Laravel 6 / PHP <= 8.0 is end-of-life: schedule an upgrade.
- Email verification is not enforced for new accounts.
- No automated test suite yet (by request); the API was exercised with scripted requests only.
- Property photos are stored on local disk (`public/media`); use object storage + CDN if you run more than one server.
- The map search endpoint (`/properties/near`) needs MySQL/MariaDB.
