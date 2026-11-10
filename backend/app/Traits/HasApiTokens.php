<?php

namespace App\Traits;

use App\Model\ApiToken;

/**
 * Gives User / Admin models personal API tokens (stored hashed in api_tokens).
 */
trait HasApiTokens
{
    public function apiTokens()
    {
        return $this->morphMany(ApiToken::class, 'tokenable');
    }

    /**
     * @return string the plain-text token. It is shown once and cannot be recovered.
     */
    public function createApiToken(string $name = 'api', int $days = 30): string
    {
        $plain = bin2hex(random_bytes(32));

        $this->apiTokens()->create([
            'name'       => $name,
            'token'      => hash('sha256', $plain),
            'expires_at' => $days > 0 ? now()->addDays($days) : null,
        ]);

        return $plain;
    }
}
