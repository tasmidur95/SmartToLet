<?php

namespace App\Model\Admin;

use Illuminate\Database\Eloquent\Model;

class City extends Model
{
    protected $fillable = [
        'city_name',
    ];

    public function subcities()
    {
        return $this->hasMany(Subcity::class);
    }
}
