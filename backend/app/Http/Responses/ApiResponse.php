<?php

namespace App\Http\Responses;

use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * Single place that defines the JSON envelope returned by every API endpoint.
 *
 * Success: { success: true,  message, data, [meta], [links] }
 * Error:   { success: false, message, code, [errors] }
 */
class ApiResponse
{
    public static function success($data = null, string $message = 'OK', int $status = 200, ?string $resource = null): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => static::transform($data, $resource),
        ], $status);
    }

    public static function created($data = null, string $message = 'Created', ?string $resource = null): JsonResponse
    {
        return static::success($data, $message, 201, $resource);
    }

    public static function noContent(string $message = 'Deleted'): JsonResponse
    {
        return static::success(null, $message);
    }

    /**
     * Paginated list: items in `data`, paging details in `meta` and `links`.
     */
    public static function paginated(LengthAwarePaginator $paginator, ?string $resource = null, string $message = 'OK', array $extraMeta = []): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data'    => static::transform($paginator->getCollection(), $resource),
            'meta'    => [
                'current_page' => $paginator->currentPage(),
                'per_page'     => $paginator->perPage(),
                'total'        => $paginator->total(),
                'last_page'    => $paginator->lastPage(),
                'from'         => $paginator->firstItem(),
                'to'           => $paginator->lastItem(),
            ] + $extraMeta,
            'links'   => [
                'first' => $paginator->url(1),
                'last'  => $paginator->url($paginator->lastPage()),
                'prev'  => $paginator->previousPageUrl(),
                'next'  => $paginator->nextPageUrl(),
            ],
        ]);
    }

    public static function error(string $message, int $status = 400, string $code = 'ERROR', $errors = null, array $extra = []): JsonResponse
    {
        $body = [
            'success' => false,
            'message' => $message,
            'code'    => $code,
        ];

        if ($errors !== null) {
            $body['errors'] = $errors;
        }

        return response()->json($body + $extra, $status);
    }

    /**
     * Turn models / collections into arrays using an optional API Resource class.
     */
    protected static function transform($data, ?string $resource)
    {
        if ($resource === null || $data === null) {
            return $data;
        }

        if (is_subclass_of($resource, JsonResource::class)) {
            if ($data instanceof \Illuminate\Support\Collection || is_array($data)) {
                return $resource::collection($data)->resolve(request());
            }

            return (new $resource($data))->resolve(request());
        }

        return $data;
    }
}
