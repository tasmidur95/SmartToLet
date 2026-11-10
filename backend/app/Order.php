<?php

namespace App;

use App\Model\Property;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    const PENDING = 'Pending';
    const COMPLETE = 'Complete';
    const FAILED = 'Failed';
    const CANCELED = 'Canceled';

    /** Statuses that count as paid (includes values written by the old Blade flow). */
    const PAID = ['Complete', 'Done', 'Processing'];

    protected $fillable = [
        'user_id', 'property_id', 'amount', 'status', 'transaction_id', 'currency',
        'coupon_code', 'discount_amount', 'paid_at',
    ];

    protected $dates = ['paid_at'];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function property()
    {
        return $this->belongsTo(Property::class, 'property_Id');
    }

    /**
     * The legacy column is spelled `property_Id`; MySQL treats both spellings as one column but
     * returns the declared case, so read whichever key is present.
     */
    public function getPropertyIdAttribute()
    {
        return $this->attributes['property_id'] ?? $this->attributes['property_Id'] ?? null;
    }

    public function getIsPaidAttribute()
    {
        return in_array($this->status, self::PAID, true);
    }
}
