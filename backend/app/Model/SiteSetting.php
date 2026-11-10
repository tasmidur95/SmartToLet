<?php

namespace App\Model;

use Illuminate\Database\Eloquent\Model;

class SiteSetting extends Model
{
    const CACHE_KEY = 'site_settings';

    protected $table = 'sitesetting';

    protected $guarded = ['id'];

    protected static function boot()
    {
        parent::boot();

        static::saved(function () {
            \Illuminate\Support\Facades\Cache::forget(self::CACHE_KEY);
        });
    }
}
