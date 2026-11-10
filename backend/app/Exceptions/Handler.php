<?php

namespace App\Exceptions;

use App\Http\Responses\ApiResponse;
use Exception;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Database\QueryException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Http\Exceptions\ThrottleRequestsException;
use Illuminate\Session\TokenMismatchException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

class Handler extends ExceptionHandler
{
    /**
     * A list of the exception types that are not reported.
     *
     * @var array
     */
    protected $dontReport = [
        ApiException::class,
    ];

    /**
     * A list of the inputs that are never flashed for validation exceptions.
     *
     * @var array
     */
    protected $dontFlash = [
        'password',
        'password_confirmation',
    ];

    public function report(Exception $exception)
    {
        parent::report($exception);
    }

    public function render($request, Exception $exception)
    {
        if ($this->wantsApiResponse($request)) {
            return $this->renderApiException($request, $exception);
        }

        return parent::render($request, $exception);
    }

    /**
     * Anything under /api, or a client asking for JSON, gets the JSON envelope.
     */
    protected function wantsApiResponse($request): bool
    {
        return $request->is('api/*') || $request->expectsJson();
    }

    protected function renderApiException($request, Exception $e)
    {
        if ($e instanceof ApiException) {
            return ApiResponse::error($e->getMessage(), $e->getStatus(), $e->getErrorCode(), $e->getErrors());
        }

        if ($e instanceof ValidationException) {
            return ApiResponse::error('The given data was invalid.', 422, 'VALIDATION_ERROR', $e->errors());
        }

        if ($e instanceof AuthenticationException) {
            return ApiResponse::error('Unauthenticated. Please log in.', 401, 'UNAUTHENTICATED');
        }

        if ($e instanceof AuthorizationException) {
            return ApiResponse::error($e->getMessage() ?: 'This action is unauthorized.', 403, 'FORBIDDEN');
        }

        if ($e instanceof ModelNotFoundException) {
            return ApiResponse::error('Resource not found.', 404, 'NOT_FOUND');
        }

        if ($e instanceof NotFoundHttpException) {
            return ApiResponse::error('Endpoint not found.', 404, 'NOT_FOUND');
        }

        if ($e instanceof MethodNotAllowedHttpException) {
            return ApiResponse::error('Method not allowed for this endpoint.', 405, 'METHOD_NOT_ALLOWED');
        }

        if ($e instanceof TokenMismatchException) {
            return ApiResponse::error('Token mismatch.', 419, 'TOKEN_MISMATCH');
        }

        if ($e instanceof ThrottleRequestsException) {
            $headers = method_exists($e, 'getHeaders') ? $e->getHeaders() : [];
            return ApiResponse::error('Too many requests. Please slow down.', 429, 'TOO_MANY_REQUESTS')
                ->withHeaders($headers);
        }

        if ($e instanceof HttpExceptionInterface) {
            $status = $e->getStatusCode();
            return ApiResponse::error($e->getMessage() ?: 'HTTP error.', $status, 'HTTP_' . $status);
        }

        // Anything else is an unexpected server error: never leak internals in production.
        $extra = [];
        if (config('app.debug')) {
            $extra['debug'] = [
                'exception' => get_class($e),
                'file'      => $e->getFile(),
                'line'      => $e->getLine(),
                'trace'     => collect($e->getTrace())->take(10)->map(function ($t) {
                    return \Illuminate\Support\Arr::only($t, ['file', 'line', 'class', 'function']);
                })->all(),
            ];
        }

        $message = config('app.debug') ? $e->getMessage() : 'Something went wrong on our side.';
        $code    = $e instanceof QueryException ? 'DATABASE_ERROR' : 'SERVER_ERROR';

        return ApiResponse::error($message, 500, $code, null, $extra);
    }
}
