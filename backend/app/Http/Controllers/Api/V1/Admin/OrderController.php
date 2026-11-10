<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\OrderResource;
use App\Order;
use Illuminate\Http\Request;

/** Payment orders (SSLCommerz). */
class OrderController extends ApiController
{
    public function index(Request $request)
    {
        $query = Order::with(['user', 'property'])->orderBy('id', 'desc');
        if ($request->filled('status')) {
            $query->where('status', $request->query('status'));
        }
        if ($request->filled('property_id')) {
            $query->where('property_id', $request->query('property_id'));
        }

        return $this->paginated($query->paginate($this->perPage($request)), OrderResource::class);
    }

    public function show($id)
    {
        return $this->success(Order::with(['user', 'property'])->findOrFail($id), 'OK', OrderResource::class);
    }

    public function destroy($id)
    {
        Order::findOrFail($id)->delete();

        return $this->deleted();
    }
}
