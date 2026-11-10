<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Resources\OrderResource;
use App\Order;
use Illuminate\Http\Request;

class MyOrderController extends ApiController
{
    public function index(Request $request)
    {
        $query = Order::with('property')->where('user_id', $request->user()->id)->orderBy('id', 'desc');

        return $this->paginated($query->paginate($this->perPage($request)), OrderResource::class);
    }

    public function show(Request $request, $id)
    {
        $order = Order::with('property')->where('user_id', $request->user()->id)->findOrFail($id);

        return $this->success($order, 'OK', OrderResource::class);
    }
}
