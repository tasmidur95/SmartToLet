<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Resources\OrderResource;
use App\Http\Resources\PaymentMethodResource;
use App\Model\Admin\Coupon;
use App\Model\Property;
use App\Order;
use App\PaymentMethod;
use Illuminate\Http\Request;

/**
 * Manual payments. The payer sends money to one of the accounts listed in payment_methods
 * (card / bank account / mobile banking) and submits the transaction reference. An admin checks
 * the reference and verifies the payment.
 *
 *  purpose=listing   owner pays the listing fee; the property can be published once it is verified
 */
class PaymentController extends ApiController
{
    public function methods()
    {
        return $this->success(PaymentMethod::where('is_active', true)->orderBy('type')->orderBy('name')->get(), 'OK', PaymentMethodResource::class);
    }

    /** What the payer would be asked to pay (shown before submitting). */
    public function quote(Request $request)
    {
        $data = $request->validate([
            'property_id' => 'required|integer|exists:user_properties,id',
            'purpose'     => 'required|in:' . implode(',', Order::PURPOSES),
        ]);
        $property = Property::findOrFail($data['property_id']);

        return $this->success(['amount' => $this->baseAmount($data['purpose'], $property), 'fixed' => true]);
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'property_id'   => 'required|integer|exists:user_properties,id',
            'purpose'       => 'required|in:' . implode(',', Order::PURPOSES),
            'method_id'     => 'required|integer|exists:payment_methods,id',
            'reference'     => 'required|string|min:4|max:100',
            'sender_number' => 'nullable|string|max:60',
            'amount'        => 'nullable|numeric|min:10',
            'coupon_code'   => 'nullable|string|max:100',
            'note'          => 'nullable|string|max:500',
        ]);
        $purpose  = $data['purpose'];
        $property = Property::findOrFail($data['property_id']);
        $method   = PaymentMethod::where('is_active', true)->find($data['method_id']);
        if (!$method) {
            throw ApiException::badRequest('This payment method is not available.');
        }

        $this->guard($user, $property, $purpose);

        if (Order::where('reference', $data['reference'])->where('method_id', $method->id)->whereNotIn('status', [Order::FAILED, Order::CANCELED])->exists()) {
            throw new ApiException('This transaction reference has already been submitted.', 422, 'DUPLICATE_REFERENCE');
        }

        $amount   = $this->baseAmount($purpose, $property);
        $discount = 0.0;
        $coupon   = null;
        if (!empty($data['coupon_code'])) {
            $coupon = Coupon::where('coupon', $data['coupon_code'])->first();
            if (!$coupon) {
                throw new ApiException('Invalid coupon code.', 422, 'INVALID_COUPON');
            }
            $discount = round($amount * ((float) $coupon->discount) / 100, 2);
        }
        $payable = round($amount - $discount, 2);
        if ($payable < 10) {
            throw ApiException::badRequest('The amount to pay cannot be less than 10 BDT.');
        }

        $order = Order::create([
            'user_id'         => $user->id,
            'property_id'     => $property->id,
            'purpose'         => $purpose,
            'amount'          => $payable,
            'discount_amount' => $discount ?: null,
            'coupon_code'     => $coupon ? $coupon->coupon : null,
            'status'          => Order::VERIFYING,
            'transaction_id'  => uniqid('HR'),
            'currency'        => 'BDT',
            'method_id'       => $method->id,
            'method_name'     => $method->name,
            'reference'       => $data['reference'],
            'sender_number'   => $data['sender_number'] ?? null,
            'note'            => $data['note'] ?? null,
        ]);

        return $this->created($order->load('property'), 'Payment submitted. It will be confirmed once we verify the reference.', OrderResource::class);
    }

    protected function guard($user, Property $property, string $purpose): void
    {
        $owns = (int) $property->user_id === (int) $user->id;

        if (!$owns) {
            throw ApiException::forbidden('You can only pay for your own properties.');
        }
        if ((int) $property->status === Property::CANCELLED) {
            throw ApiException::conflict('This property was cancelled.');
        }
        if (Order::paidFor($property->id, $purpose)) {
            throw ApiException::conflict('This has already been paid for.');
        }
        if (Order::where('property_id', $property->id)->where('purpose', $purpose)->where('status', Order::VERIFYING)->exists()) {
            throw ApiException::conflict('A payment for this is already waiting for verification.');
        }
    }

    protected function baseAmount(string $purpose, Property $property): float
    {
        return (float) ($property->service_charge ?: config('payment.listing_amount'));
    }
}
