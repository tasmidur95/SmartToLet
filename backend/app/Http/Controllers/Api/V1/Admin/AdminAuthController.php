<?php

namespace App\Http\Controllers\Api\V1\Admin;

use App\Admin;
use App\Exceptions\ApiException;
use App\Http\Controllers\Api\V1\ApiController;
use App\Http\Resources\AdminResource;
use App\Model\ApiToken;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AdminAuthController extends ApiController
{
    public function login(Request $request)
    {
        $data = $request->validate(['email' => 'required|email', 'password' => 'required|string']);

        $admin = Admin::where('email', $data['email'])->first();
        if (!$admin || !Hash::check($data['password'], $admin->password)) {
            throw new ApiException('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        return $this->success([
            'admin'      => (new AdminResource($admin))->resolve($request),
            'token'      => $admin->createApiToken('admin', 7),
            'token_type' => 'Bearer',
        ], 'Login successful');
    }

    public function logout(Request $request)
    {
        ApiToken::where('token', hash('sha256', $request->bearerToken()))->delete();

        return $this->success(null, 'Logged out');
    }

    public function me(Request $request)
    {
        return $this->success($request->user('api-admin'), 'OK', AdminResource::class);
    }
}
