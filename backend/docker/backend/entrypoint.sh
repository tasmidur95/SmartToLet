#!/bin/bash
# Backend start-up: wait for the database, create the app key + admin once, migrate, serve.
set -e
cd /var/www/html

mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache public/media

# ---- one-time secrets, kept in the storage volume so restarts reuse them ----
if [ -z "$APP_KEY" ]; then
  [ -f storage/app/.app_key ] || echo "base64:$(openssl rand -base64 32)" > storage/app/.app_key
  export APP_KEY="$(cat storage/app/.app_key)"
fi
if [ -z "$ADMIN_PASSWORD" ]; then
  [ -f storage/app/.admin_password ] || openssl rand -base64 15 | tr -dc 'A-Za-z0-9' | head -c 16 > storage/app/.admin_password
  export ADMIN_PASSWORD="$(cat storage/app/.admin_password)"
fi
export ADMIN_EMAIL="${ADMIN_EMAIL:-admin@example.com}"

# ---- wait for MySQL ----
echo "[backend] waiting for database ${DB_HOST}:${DB_PORT} ..."
for i in $(seq 1 60); do
  if php -r 'try { new PDO("mysql:host=".getenv("DB_HOST").";port=".getenv("DB_PORT").";dbname=".getenv("DB_DATABASE"), getenv("DB_USERNAME"), getenv("DB_PASSWORD")); exit(0);} catch (Throwable $e) { exit(1);}' ; then
    break
  fi
  sleep 2
done

php artisan migrate --force
php artisan db:seed --class=AdminSeeder --force
[ "${SEED_DEMO:-true}" = "true" ] && php artisan db:seed --class=DemoSeeder --force
chown -R www-data:www-data storage bootstrap/cache

cat <<BANNER

  ==========================================================
   Admin panel login
     email   : ${ADMIN_EMAIL}
     password: ${ADMIN_PASSWORD}
   (kept in the 'backend_storage' volume; use  docker compose down -v  to reset)
  ==========================================================

BANNER

php-fpm -D
exec nginx -g 'daemon off;'
