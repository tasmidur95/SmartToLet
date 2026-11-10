<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Admin;
use App\Http\Resources\AdminResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

/** Child admins (type 2) with per-section permissions. Requires the `user_role` permission. */
class ChildAdminController extends AdminCrudController
{
    protected $model = Admin::class;
    protected $resource = AdminResource::class;
    protected $searchable = ['name', 'email'];

    protected function baseQuery()
    {
        return Admin::where('type', '2');
    }

    protected function rules(Request $request, $id = null): array
    {
        $rules = [
            'name'     => 'required|string|max:255',
            'phone'    => 'nullable|string|max:30',
            'email'    => 'required|email|max:255|unique:admins,email' . ($id ? ",$id" : ''),
            'password' => ($id ? 'nullable' : 'required') . '|string|min:8',
        ];
        foreach (AdminResource::PERMISSIONS as $p) {
            $rules[$p] = 'nullable|boolean';
        }

        return $rules;
    }

    protected function attributes(array $v): array
    {
        $out = ['type' => '2'];
        foreach ($v as $key => $value) {
            if ($key === 'password') {
                if ($value) {
                    $out['password'] = Hash::make($value);
                }
            } elseif (in_array($key, AdminResource::PERMISSIONS, true)) {
                $out[$key] = $value ? '1' : null;
            } else {
                $out[$key] = $value;
            }
        }

        return $out;
    }
}
