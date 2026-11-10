<?php

namespace App\Providers;

use Illuminate\Foundation\Support\Providers\AuthServiceProvider as ServiceProvider;
use App\Model\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Gate;

class AuthServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        // 'App\Model' => 'App\Policies\ModelPolicy',
    ];

    /**
     * Register any authentication / authorization services.
     *
     * @return void
     */
    public function boot()
    {
        $this->registerPolicies();

        // Bearer-token guards: `Authorization: Bearer <token>`.
        // `api` authenticates App\User tokens, `api-admin` authenticates App\Admin tokens.
        Auth::viaRequest('api-token', function (Request $request) {
            return $this->userFromToken($request, \App\User::class);
        });
        Auth::viaRequest('api-admin-token', function (Request $request) {
            return $this->userFromToken($request, \App\Admin::class);
        });
    }

    protected function userFromToken(Request $request, string $model)
    {
        $plain = $request->bearerToken();
        if (!$plain) {
            return null;
        }

        $token = ApiToken::where('token', hash('sha256', $plain))
            ->where('tokenable_type', $model)
            ->first();

        if (!$token || ($token->expires_at && $token->expires_at->isPast())) {
            return null;
        }

        $token->forceFill(['last_used_at' => now()])->save();

        return $token->tokenable;
    }
}
