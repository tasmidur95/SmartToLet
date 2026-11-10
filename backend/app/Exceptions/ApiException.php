<?php

namespace App\Exceptions;

use Exception;

/**
 * Throw this anywhere in API code for a controlled, client-visible error.
 * The global handler turns it into the standard error envelope.
 */
class ApiException extends Exception
{
    protected $status;
    protected $errorCode;
    protected $errors;

    public function __construct(string $message = 'Request failed', int $status = 400, string $errorCode = 'ERROR', $errors = null)
    {
        parent::__construct($message);
        $this->status    = $status;
        $this->errorCode = $errorCode;
        $this->errors    = $errors;
    }

    public static function badRequest(string $message = 'Bad request', $errors = null): self
    {
        return new static($message, 400, 'BAD_REQUEST', $errors);
    }

    public static function forbidden(string $message = 'You are not allowed to perform this action'): self
    {
        return new static($message, 403, 'FORBIDDEN');
    }

    public static function notFound(string $message = 'Resource not found'): self
    {
        return new static($message, 404, 'NOT_FOUND');
    }

    public static function conflict(string $message = 'Conflict'): self
    {
        return new static($message, 409, 'CONFLICT');
    }

    public function getStatus(): int
    {
        return $this->status;
    }

    public function getErrorCode(): string
    {
        return $this->errorCode;
    }

    public function getErrors()
    {
        return $this->errors;
    }
}
