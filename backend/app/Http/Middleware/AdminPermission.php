<?php

namespace App\Http\Middleware;

use App\Exceptions\ApiException;
use Closure;

/**
 * Child admins (admins.type = 2) only get the sections ticked on their account.
 * Usage: ->middleware('admin.can:orders')   (column name on the admins table)
 */
class AdminPermission
{
    public function handle($request, Closure $next, $permission)
    {
        $admin = $request->user('api-admin');

        if ($admin && (string) $admin->type === '2' && (string) $admin->{$permission} !== '1') {
            throw ApiException::forbidden('Your admin account has no access to this section.');
        }

        return $next($request);
    }
}
