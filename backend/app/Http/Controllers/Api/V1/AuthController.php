<?php

namespace App\Http\Controllers\Api\V1;

use App\Exceptions\ApiException;
use App\Http\Resources\UserResource;
use App\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Support\Str;

class AuthController extends ApiController
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|max:255|unique:users,email',
            'phone'    => 'required|string|max:30',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name'        => $data['name'],
            'email'       => $data['email'],
            'phone'       => $data['phone'],
            'password'    => Hash::make($data['password']),
            'provider'    => 'email',
            'provider_id' => '',
        ]);

        return $this->created($this->session($user, $request), 'Registration successful');
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email'    => 'required|email',
            'password' => 'required|string',
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            throw new ApiException('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
        }

        return $this->success($this->session($user, $request), 'Login successful');
    }

    /**
     * Exchange a Google/Facebook access token (obtained by the React app) for our own token.
     * POST /auth/social/{provider}  { access_token }
     */
    public function social(Request $request, $provider)
    {
        if (!in_array($provider, ['google', 'facebook'], true)) {
            throw ApiException::notFound('Unknown provider.');
        }
        $request->validate(['access_token' => 'required|string']);

        try {
            $info = \Laravel\Socialite\Facades\Socialite::driver($provider)->stateless()->userFromToken($request->input('access_token'));
        } catch (\Throwable $e) {
            throw new ApiException('The social login token is invalid or expired.', 401, 'INVALID_SOCIAL_TOKEN');
        }
        if (!$info->getEmail()) {
            throw new ApiException('Your ' . $provider . ' account did not share an email address.', 422, 'EMAIL_REQUIRED');
        }

        // The provider has verified this email, so an existing account with the same email is the same person.
        $user = User::where('provider', $provider)->where('provider_id', $info->getId())->first()
            ?: User::where('email', $info->getEmail())->first();

        if (!$user) {
            $user = User::create([
                'name'        => $info->getName() ?: $info->getEmail(),
                'email'       => $info->getEmail(),
                'phone'       => null,
                'password'    => Hash::make(Str::random(40)),
                'provider'    => $provider,
                'provider_id' => $info->getId(),
            ]);
            $user->forceFill(['email_verified_at' => now()])->save();
        }

        return $this->success($this->session($user, $request), 'Login successful');
    }

    public function logout(Request $request)
    {
        $this->currentToken($request)->delete();

        return $this->success(null, 'Logged out');
    }

    public function me(Request $request)
    {
        return $this->success($request->user(), 'OK', UserResource::class);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'name'  => 'sometimes|required|string|max:255',
            'phone' => 'sometimes|required|string|max:30',
            'email' => 'sometimes|required|email|max:255|unique:users,email,' . $user->id,
        ]);

        $user->update($data);

        return $this->success($user->fresh(), 'Profile updated', UserResource::class);
    }

    public function changePassword(Request $request)
    {
        $user = $request->user();
        $data = $request->validate([
            'current_password' => 'required|string',
            'password'         => 'required|string|min:8|confirmed|different:current_password',
        ]);

        if (!Hash::check($data['current_password'], $user->password)) {
            throw new ApiException('Current password is incorrect.', 422, 'VALIDATION_ERROR', [
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($data['password'])]);
        // sign out every other device
        $user->apiTokens()->where('id', '!=', $this->currentToken($request)->id)->delete();

        return $this->success(null, 'Password changed');
    }

    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Always answer the same way so the endpoint cannot be used to discover accounts.
        Password::broker('users')->sendResetLink($request->only('email'));

        return $this->success(null, 'If that email exists, a reset link has been sent.');
    }

    public function resetPassword(Request $request)
    {
        $data = $request->validate([
            'token'    => 'required|string',
            'email'    => 'required|email',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $status = Password::broker('users')->reset($data, function ($user, $password) {
            $user->forceFill(['password' => Hash::make($password), 'remember_token' => Str::random(60)])->save();
            $user->apiTokens()->delete();
        });

        if ($status !== Password::PASSWORD_RESET) {
            throw new ApiException('This password reset token is invalid or has expired.', 422, 'INVALID_RESET_TOKEN');
        }

        return $this->success(null, 'Password has been reset');
    }

    protected function session(User $user, Request $request): array
    {
        return [
            'user'       => (new UserResource($user))->resolve($request),
            'token'      => $user->createApiToken($request->input('device_name', 'web')),
            'token_type' => 'Bearer',
        ];
    }

    protected function currentToken(Request $request)
    {
        return \App\Model\ApiToken::where('token', hash('sha256', $request->bearerToken()))->firstOrFail();
    }
}
