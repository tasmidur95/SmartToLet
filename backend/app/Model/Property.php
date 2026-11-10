<?php

namespace App\Model;

use App\Model\Admin\City;
use App\Model\Admin\Subcity;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;

/**
 * A rental listing (table `user_properties`).
 * status: 0 pending, 1 published, 2 delivery in progress, 3 delivered, 4 cancelled
 */
class Property extends Model
{
    const PENDING = 0;
    const PUBLISHED = 1;
    const IN_PROGRESS = 2;
    const DELIVERED = 3;
    const CANCELLED = 4;

    const STATUS_LABELS = [
        0 => 'pending',
        1 => 'published',
        2 => 'delivery_progress',
        3 => 'delivered',
        4 => 'cancelled',
    ];

    /** Statuses visible to the public. */
    const PUBLIC_STATUSES = [1, 2];

    protected $table = 'user_properties';

    protected $guarded = ['id'];

    public function city()
    {
        return $this->belongsTo(City::class);
    }

    public function subcityModel()
    {
        return $this->belongsTo(Subcity::class, 'subcity_id');
    }

    public function owner()
    {
        return $this->belongsTo(\App\User::class, 'user_id');
    }

    public function scopePublic(Builder $query)
    {
        return $query->whereIn('status', self::PUBLIC_STATUSES);
    }

    public function getStatusLabelAttribute()
    {
        return self::STATUS_LABELS[(int) $this->status] ?? 'unknown';
    }

    /**
     * Search / filter used by the public listing and the admin listing.
     * Supported keys: q, city_id, subcity_id, category, type, purpose, bedroom, bathroom,
     * min_price, max_price, badge (trend|best_rated|hot_new), sort (latest|oldest|price_asc|price_desc).
     */
    public function scopeFilter(Builder $query, array $f)
    {
        if (!empty($f['q'])) {
            $like = '%' . $f['q'] . '%';
            $query->where(function ($w) use ($like) {
                $w->where('name', 'like', $like)
                  ->orWhere('address', 'like', $like)
                  ->orWhere('details', 'like', $like)
                  ->orWhere('property_code', 'like', $like);
            });
        }

        foreach (['city_id', 'subcity_id', 'category', 'type', 'purpose'] as $col) {
            if (isset($f[$col]) && $f[$col] !== '') {
                $query->where($col, $f[$col]);
            }
        }
        foreach (['bedroom', 'bathroom'] as $col) {
            if (isset($f[$col]) && $f[$col] !== '') {
                $query->where($col, '>=', (int) $f[$col]);
            }
        }

        // price columns are strings in the legacy schema, so cast for numeric comparison
        if (isset($f['min_price']) && $f['min_price'] !== '') {
            $query->whereRaw('CAST(price AS DECIMAL(12,2)) >= ?', [(float) $f['min_price']]);
        }
        if (isset($f['max_price']) && $f['max_price'] !== '') {
            $query->whereRaw('CAST(price AS DECIMAL(12,2)) <= ?', [(float) $f['max_price']]);
        }

        if (!empty($f['badge']) && in_array($f['badge'], ['trend', 'best_rated', 'hot_new'], true)) {
            $query->where($f['badge'], 1);
        }

        switch ($f['sort'] ?? 'latest') {
            case 'oldest':
                $query->orderBy('id');
                break;
            case 'price_asc':
                $query->orderByRaw('CAST(price AS DECIMAL(12,2)) asc');
                break;
            case 'price_desc':
                $query->orderByRaw('CAST(price AS DECIMAL(12,2)) desc');
                break;
            default:
                $query->orderBy('id', 'desc');
        }

        return $query;
    }
}
