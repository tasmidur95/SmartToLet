<?php

namespace App;

use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    const TYPES = ['card', 'bank', 'mfs'];

    protected $guarded = ['id'];
    protected $casts = ['is_active' => 'boolean'];
}
