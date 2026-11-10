<?php

namespace App\Traits;

use App\Http\Responses\ApiResponse;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\Request;

/**
 * Shortcut methods for controllers: $this->success(), $this->paginated() ...
 */
trait ApiResponder
{
    protected function success($data = null, string $message = 'OK', ?string $resource = null)
    {
        return ApiResponse::success($data, $message, 200, $resource);
    }

    protected function created($data = null, string $message = 'Created', ?string $resource = null)
    {
        return ApiResponse::created($data, $message, $resource);
    }

    protected function deleted(string $message = 'Deleted')
    {
        return ApiResponse::noContent($message);
    }

    protected function paginated(LengthAwarePaginator $paginator, ?string $resource = null, string $message = 'OK', array $extraMeta = [])
    {
        return ApiResponse::paginated($paginator, $resource, $message, $extraMeta);
    }

    protected function error(string $message, int $status = 400, string $code = 'ERROR', $errors = null)
    {
        return ApiResponse::error($message, $status, $code, $errors);
    }

    /**
     * `?per_page=` clamped to 1..$max. Use with ->paginate($this->perPage($request)).
     */
    protected function perPage(Request $request, int $default = 15, int $max = 100): int
    {
        $perPage = (int) $request->query('per_page', $default);

        return max(1, min($perPage ?: $default, $max));
    }
}
