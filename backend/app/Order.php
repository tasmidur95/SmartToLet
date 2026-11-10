<?php

namespace App;

use App\Model\Property;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    /** Awaiting the admin to check the reference the payer submitted. */
    const VERIFYING = 'Verifying';
    const COMPLETE = 'Complete';
    /** Rejected by admin (wrong / unknown reference). */
    const FAILED = 'Failed';
    const CANCELED = 'Canceled';
    const PENDING = 'Pending';

    const PURPOSES = ['listing'];

    /** Statuses that count as paid (includes values written by the old Blade flow). */
    const PAID = ['Complete', 'Done', 'Processing'];

    protected $fillable = [
        'user_id', 'property_id', 'amount', 'status', 'transaction_id', 'currency',
        'coupon_code', 'discount_amount', 'paid_at',
        'purpose', 'method_id', 'method_name', 'reference', 'sender_number', 'note', 'reject_reason', 'verified_at',
    ];

    protected $dates = ['paid_at', 'verified_at'];

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

    /** Has this property got a verified payment for the given purpose? */
    public static function paidFor($propertyId, string $purpose): bool
    {
        return static::where('property_id', $propertyId)->where('purpose', $purpose)->whereIn('status', self::PAID)->exists();
    }
}
