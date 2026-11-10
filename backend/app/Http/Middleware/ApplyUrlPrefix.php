<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\URL;

/**
 * When the API is published under a sub-path of the public site (Docker: <site>/backend) every URL
 * Laravel generates (photos, payment callbacks) must include that prefix. The host and scheme come
 * from the request itself, so it works on localhost and on any dynamic ngrok address.
 * Enabled with URL_PREFIX=/backend. Runs after TrustProxies so X-Forwarded-* are honoured.
 */
class ApplyUrlPrefix
{
    public function handle($request, Closure $next)
    {
        $prefix = trim((string) env('URL_PREFIX'), '/');
        if ($prefix !== '') {
            URL::forceRootUrl($request->getSchemeAndHttpHost() . '/' . $prefix);
        }

        return $next($request);
    }
}
