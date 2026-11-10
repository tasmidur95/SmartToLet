# Laravel 6 needs PHP <= 8.0, so the image pins PHP 7.4 (Alpine keeps old package repos available).
FROM php:7.4-fpm-alpine

RUN apk add --no-cache nginx mysql-client curl openssl bash zip unzip \
        freetype-dev libjpeg-turbo-dev libpng-dev libwebp-dev libzip-dev oniguruma-dev \
    && docker-php-ext-configure gd --with-freetype --with-jpeg --with-webp \
    && docker-php-ext-install -j"$(nproc)" pdo_mysql gd zip bcmath exif \
    && mkdir -p /run/nginx

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# dependencies first so this layer is cached until composer.lock changes
COPY composer.json composer.lock ./
RUN composer install --no-dev --no-scripts --no-autoloader --prefer-dist --no-interaction

COPY . .
RUN composer dump-autoload --no-dev --optimize --no-scripts \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views storage/logs storage/app bootstrap/cache \
    && rm -f bootstrap/cache/*.php \
    && chown -R www-data:www-data storage bootstrap/cache public/media

COPY docker/backend/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/backend/php.ini /usr/local/etc/php/conf.d/zz-app.ini
COPY docker/backend/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80
HEALTHCHECK --interval=10s --timeout=5s --start-period=90s --retries=12 \
    CMD curl -fsS http://127.0.0.1/api/v1/ping || exit 1

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
