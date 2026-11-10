<?php

namespace App\Support;

/**
 * Public (e.g. ngrok) address of the site when it runs behind a tunnel whose URL is only known
 * after start-up. The Docker setup writes it to the file named by PUBLIC_URL_FILE; outside Docker
 * everything falls back to the normal FRONTEND_URL / APP_URL settings.
 */
class PublicUrl
{
    /** e.g. https://abc123.ngrok-free.app (no trailing slash) or null. */
    public static function base(): ?string
    {
        $file = env('PUBLIC_URL_FILE');
        if (!$file || !is_readable($file)) {
            return null;
        }
        $url = trim((string) @file_get_contents($file));

        return preg_match('#^https?://[^\s]+$#', $url) ? rtrim($url, '/') : null;
    }

    /** Where the React app lives (payment returns, password-reset links). */
    public static function frontend(): ?string
    {
        return env('FRONTEND_URL') ?: self::base();
    }
}
