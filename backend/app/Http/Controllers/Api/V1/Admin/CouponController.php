<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Resources\CouponResource;
use App\Model\Admin\Coupon;
use Illuminate\Http\Request;

class CouponController extends AdminCrudController
{
    protected $model = Coupon::class;
    protected $resource = CouponResource::class;
    protected $searchable = ['coupon'];

    protected function rules(Request $request, $id = null): array
    {
        return [
            'code'     => 'required|string|max:100|unique:coupons,coupon' . ($id ? ",$id" : ''),
            'discount' => 'required|numeric|min:0|max:100',
        ];
    }

    protected function attributes(array $v): array
    {
        return ['coupon' => $v['code'], 'discount' => $v['discount']];
    }
}
