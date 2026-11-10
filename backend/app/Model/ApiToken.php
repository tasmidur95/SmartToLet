<?php

namespace App\Model;

use Illuminate\Database\Eloquent\Model;

class ApiToken extends Model
{
    protected $fillable = ['name', 'token', 'last_used_at', 'expires_at'];

    protected $hidden = ['token'];

    protected $dates = ['last_used_at', 'expires_at'];

    public function tokenable()
    {
        return $this->morphTo();
    }
}
