<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Resources\OrderResource;
use App\Library\SslCommerz\SslCommerzNotification;
use App\Model\Admin\Coupon;
use App\Model\Property;
use App\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

/**
 * SSLCommerz online payment for a property listing.
 *
 *  1. POST /payments/checkout  (auth)  -> creates a Pending order, returns { payment_url }
 *  2. React redirects the browser to payment_url.
 *  3. The gateway sends the browser (POST) to /payments/success|fail|cancel; we verify with
 *     SSLCommerz using the amount stored on OUR order, update it, then redirect to the React app.
 *  4. /payments/ipn is the server-to-server notification and does the same verification.
 */
class PaymentController extends ApiController
{
    public function checkout(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'property_id' => 'required|integer|exists:user_properties,id',
            'coupon_code' => 'nullable|string|max:100',
        ]);

        $property = Property::where('user_id', $user->id)->find($data['property_id']);
        if (!$property) {
            throw ApiException::forbidden('You can only pay for your own properties.');
        }
        if ((int) $property->status === Property::CANCELLED) {
            throw ApiException::conflict('This property was cancelled.');
        }
        if (Order::where('property_id', $property->id)->whereIn('status', Order::PAID)->exists()) {
            throw ApiException::conflict('This property has already been paid for.');
        }

        $amount   = (float) ($property->service_charge ?: config('sslcommerz.default_amount'));
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
            'amount'          => $payable,
            'discount_amount' => $discount ?: null,
            'coupon_code'     => $coupon ? $coupon->coupon : null,
            'status'          => Order::PENDING,
            'transaction_id'  => uniqid('HR'),
            'currency'        => 'BDT',
        ]);

        $url = $this->createGatewaySession($order, $user, $property);
        if (!$url) {
            $order->update(['status' => Order::FAILED]);
            throw new ApiException('The payment gateway is unavailable. Please try again later.', 502, 'PAYMENT_GATEWAY_ERROR');
        }

        return $this->created([
            'order'       => (new OrderResource($order))->resolve($request),
            'payment_url' => $url,
        ], 'Redirect the customer to payment_url to complete the payment');
    }

    public function callbackSuccess(Request $request)
    {
        $order = $this->orderFor($request);
        if ($order && $order->status === Order::PENDING) {
            $this->settle($order, $request->all());
        }

        return $this->backToApp($order && $order->is_paid ? 'success' : 'failed', $request);
    }

    public function callbackFail(Request $request)
    {
        $order = $this->orderFor($request);
        if ($order && $order->status === Order::PENDING) {
            $order->update(['status' => Order::FAILED]);
        }

        return $this->backToApp('failed', $request);
    }

    public function callbackCancel(Request $request)
    {
        $order = $this->orderFor($request);
        if ($order && $order->status === Order::PENDING) {
            $order->update(['status' => Order::CANCELED]);
        }

        return $this->backToApp('cancelled', $request);
    }

    public function callbackIpn(Request $request)
    {
        $order = $this->orderFor($request);
        if (!$order) {
            return $this->error('Invalid transaction.', 404, 'NOT_FOUND');
        }
        // The gateway's own server call is authoritative, so it may also correct an earlier "Failed".
        if (in_array($order->status, [Order::PENDING, Order::FAILED], true)) {
            $this->settle($order, $request->all());
        }

        return $this->success(['status' => $order->fresh()->status], 'IPN processed');
    }

    /** Verify with SSLCommerz against the amount/currency saved on our own order. */
    protected function settle(Order $order, array $payload): bool
    {
        try {
            $valid = (new SslCommerzNotification())->orderValidate($payload, $order->transaction_id, $order->amount, $order->currency);
        } catch (\Throwable $e) {
            Log::error('SSLCommerz validation error: ' . $e->getMessage());
            $valid = false;
        }

        $order->update($valid === true
            ? ['status' => Order::COMPLETE, 'paid_at' => now()]
            : ['status' => Order::FAILED]);

        return $valid === true;
    }

    protected function orderFor(Request $request): ?Order
    {
        $tranId = $request->input('tran_id');

        return $tranId ? Order::where('transaction_id', $tranId)->first() : null;
    }

    protected function backToApp(string $result, Request $request)
    {
        $base = rtrim(config('sslcommerz.frontend_url'), '/');

        return redirect()->away($base . '/payment/' . $result . '?tran_id=' . urlencode((string) $request->input('tran_id')));
    }

    /** Ask SSLCommerz for a hosted payment page; returns its URL or null. */
    protected function createGatewaySession(Order $order, $user, Property $property): ?string
    {
        // Point the gateway callbacks at the API instead of the old Blade routes.
        config([
            'sslcommerz.success_url' => '/api/v1/payments/success',
            'sslcommerz.failed_url'  => '/api/v1/payments/fail',
            'sslcommerz.cancel_url'  => '/api/v1/payments/cancel',
            'sslcommerz.ipn_url'     => '/api/v1/payments/ipn',
        ]);

        $post = [
            'total_amount'    => $order->amount,
            'currency'        => $order->currency,
            'tran_id'         => $order->transaction_id,
            'cus_name'        => $user->name,
            'cus_email'       => $user->email,
            'cus_add1'        => $property->address,
            'cus_add2'        => '',
            'cus_city'        => '',
            'cus_state'       => '',
            'cus_postcode'    => '',
            'cus_country'     => 'Bangladesh',
            'cus_phone'       => $user->phone ?: '01700000000',
            'cus_fax'         => '',
            'shipping_method' => 'NO',
            'ship_name'       => $user->name,
            'ship_add1'       => $property->address,
            'ship_add2'       => '',
            'ship_city'       => '',
            'ship_state'      => '',
            'ship_postcode'   => '',
            'ship_country'    => 'Bangladesh',
            'product_name'    => 'Property listing ' . $property->property_code,
            'product_category' => 'Service',
            'product_profile' => 'non-physical-goods',
        ];

        try {
            $raw  = (new SslCommerzNotification())->makePayment($post, 'checkout', 'json');
            $json = is_string($raw) ? json_decode($raw, true) : null;
        } catch (\Throwable $e) {
            Log::error('SSLCommerz init error: ' . $e->getMessage());
            return null;
        }

        return is_array($json) && strtolower($json['status'] ?? '') === 'success' ? $json['data'] : null;
    }
}
