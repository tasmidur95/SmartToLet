<?php

namespace App\Http\Middleware;

use Closure;

/**
 * Minimal CORS for the React SPA. Set CORS_ALLOWED_ORIGINS in .env (comma separated, or *).
 */
class Cors
{
    public function handle($request, Closure $next)
    {
        $allowed = array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:5173,http://localhost:3000'))));
        $origin  = $request->headers->get('Origin');
        $allow   = in_array('*', $allowed) ? '*' : (in_array($origin, $allowed) ? $origin : null);

        $response = $request->isMethod('OPTIONS') ? response('', 204) : $next($request);

        if ($allow) {
            $response->headers->set('Access-Control-Allow-Origin', $allow);
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Accept, Authorization, X-Requested-With');
            $response->headers->set('Access-Control-Expose-Headers', 'X-RateLimit-Limit, X-RateLimit-Remaining, Retry-After');
            $response->headers->set('Vary', 'Origin');
        }

        return $response;
    }
}
