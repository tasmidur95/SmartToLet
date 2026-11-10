<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Exceptions\ApiException;
use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\OrderResource;
use App\Order;
use Illuminate\Http\Request;

/** Payment orders: manual payments the admin verifies from the submitted reference. */
class OrderController extends ApiController
{
    public function index(Request $request)
    {
        $query = Order::with(['user', 'property'])->orderBy('id', 'desc');
        foreach (['status', 'purpose', 'property_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }
        if ($request->filled('q')) {
            $like = '%' . $request->query('q') . '%';
            $query->where(function ($w) use ($like) {
                $w->where('reference', 'like', $like)->orWhere('transaction_id', 'like', $like)->orWhere('sender_number', 'like', $like);
            });
        }

        return $this->paginated($query->paginate($this->perPage($request)), OrderResource::class);
    }

    public function show($id)
    {
        return $this->success(Order::with(['user', 'property'])->findOrFail($id), 'OK', OrderResource::class);
    }

    /** The reference matches a real transfer: mark the payment as paid. */
    public function verify($id)
    {
        $order = Order::findOrFail($id);
        if ($order->is_paid) {
            throw ApiException::conflict('This payment is already verified.');
        }
        $order->update(['status' => Order::COMPLETE, 'paid_at' => now(), 'verified_at' => now(), 'reject_reason' => null]);

        return $this->success($order->fresh(['user', 'property']), 'Payment verified', OrderResource::class);
    }

    /** The reference could not be matched: reject it (the payer may submit a new one). */
    public function reject(Request $request, $id)
    {
        $data = $request->validate(['reason' => 'nullable|string|max:500']);
        $order = Order::findOrFail($id);
        if ($order->is_paid) {
            throw ApiException::conflict('A verified payment cannot be rejected.');
        }
        $order->update(['status' => Order::FAILED, 'reject_reason' => $data['reason'] ?? null, 'verified_at' => now()]);

        return $this->success($order->fresh(['user', 'property']), 'Payment rejected', OrderResource::class);
    }

    public function destroy($id)
    {
        Order::findOrFail($id)->delete();

        return $this->deleted();
    }
}
