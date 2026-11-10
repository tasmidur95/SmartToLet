<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Http\Resources\PaymentMethodResource;
use App\PaymentMethod;
use Illuminate\Http\Request;

class PaymentMethodController extends AdminCrudController
{
    protected $model = PaymentMethod::class;
    protected $resource = PaymentMethodResource::class;
    protected $searchable = ['name', 'account_number'];

    protected function rules(Request $request, $id = null): array
    {
        return [
            'type'           => 'required|in:' . implode(',', PaymentMethod::TYPES),
            'name'           => 'required|string|max:100',
            'account_name'   => 'nullable|string|max:150',
            'account_number' => 'required|string|max:100',
            'instructions'   => 'nullable|string|max:1000',
            'is_active'      => 'nullable|boolean',
        ];
    }
}
