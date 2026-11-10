<?php

namespace App\Model;

use Illuminate\Database\Eloquent\Model;

/** A request to visit a property on a given date and time slot. */
class Visit extends Model
{
    const PENDING = 'pending';
    const CONFIRMED = 'confirmed';
    const CANCELLED = 'cancelled';
    const COMPLETED = 'completed';

    const STATUSES = [self::PENDING, self::CONFIRMED, self::CANCELLED, self::COMPLETED];

    /** Hourly slots offered on the site. */
    const SLOTS = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00', '18:00'];

    protected $guarded = ['id', 'status', 'admin_note'];

    protected $dates = ['visit_date'];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function user()
    {
        return $this->belongsTo(\App\User::class);
    }
}
