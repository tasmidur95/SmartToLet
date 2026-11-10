<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes  (prefix /api, versioned under /api/v1)
|--------------------------------------------------------------------------
| Every response uses the envelope in App\Http\Responses\ApiResponse.
| Auth: `Authorization: Bearer <token>`  (guards: api = users, api-admin = admins)
*/

// CORS preflight for the React app (the Cors middleware answers it)
Route::options('{any}', function () {
    return response('', 204);
})->where('any', '.*');

// Unknown /api/* URLs get the JSON 404 envelope for every HTTP method
Route::fallback(function () {
    throw \App\Exceptions\ApiException::notFound('Endpoint not found.');
});

Route::prefix('v1')->namespace('Api\V1')->group(function () {

    Route::get('ping', function () {
        return \App\Http\Responses\ApiResponse::success(['time' => now()->toIso8601String()], 'pong');
    });

    // ---------- Auth ----------
    Route::prefix('auth')->group(function () {
        Route::middleware('throttle:10,1,auth')->group(function () {
            Route::post('register', 'AuthController@register');
            Route::post('login', 'AuthController@login');
            Route::post('social/{provider}', 'AuthController@social');
            Route::post('forgot-password', 'AuthController@forgotPassword');
            Route::post('reset-password', 'AuthController@resetPassword');
        });

        Route::middleware('auth:api')->group(function () {
            Route::post('logout', 'AuthController@logout');
            Route::get('me', 'AuthController@me');
            Route::put('profile', 'AuthController@updateProfile');
            Route::put('password', 'AuthController@changePassword');
        });
    });

    // ---------- Public ----------
    Route::get('cities', 'LocationController@cities');
    Route::get('cities/{id}', 'LocationController@city');
    Route::get('subcities', 'LocationController@subcities');

    Route::get('properties', 'PropertyController@index');          // search + filters + pagination
    Route::get('properties/near', 'PropertyController@near');      // ?lat=&lng=&radius_km=
    Route::get('properties/{id}', 'PropertyController@show');
    Route::get('properties/{id}/nearby', 'PropertyController@nearby');

    Route::post('properties/{id}/inquiries', 'InquiryController@store')->middleware('throttle:10,1,forms');
    Route::get('properties/{id}/visit-slots', 'VisitController@slots');
    Route::post('properties/{id}/visits', 'VisitController@store')->middleware('throttle:10,1,forms');
    Route::get('reviews', 'ContentController@reviews');

    Route::get('payment-methods', 'PaymentController@methods');

    Route::get('blog/posts', 'ContentController@posts');
    Route::get('blog/posts/{id}', 'ContentController@post');
    Route::get('blog/categories', 'ContentController@postCategories');
    Route::get('settings', 'ContentController@settings');

    Route::middleware('throttle:10,1,forms')->group(function () {
        Route::post('newsletter', 'ContentController@subscribe');
        Route::post('contact', 'ContentController@contact');
        Route::post('coupons/validate', 'ContentController@validateCoupon');
    });

    // ---------- Logged-in user ----------
    Route::middleware('auth:api')->group(function () {
        Route::get('my/properties', 'MyPropertyController@index');
        Route::post('my/properties', 'MyPropertyController@store');
        Route::get('my/properties/{id}', 'MyPropertyController@show');
        Route::delete('my/properties/{id}', 'MyPropertyController@destroy');

        Route::get('my/visits', 'VisitController@mine');
        Route::post('my/visits/{id}/cancel', 'VisitController@cancel');

        Route::get('payments/quote', 'PaymentController@quote');
        Route::post('payments', 'PaymentController@store');
        Route::get('my/orders', 'MyOrderController@index');
        Route::get('my/orders/{id}', 'MyOrderController@show');

        Route::get('wishlist', 'WishlistController@index');
        Route::post('wishlist/{propertyId}', 'WishlistController@add');
        Route::delete('wishlist/{propertyId}', 'WishlistController@remove');
    });

    // ---------- Admin ----------
    Route::prefix('admin')->namespace('Admin')->group(function () {
        Route::post('auth/login', 'AdminAuthController@login')->middleware('throttle:10,1,admin-login');

        Route::middleware('auth:api-admin')->group(function () {
            Route::post('auth/logout', 'AdminAuthController@logout');
            Route::get('auth/me', 'AdminAuthController@me');

            Route::get('alerts', 'ReportController@alerts');
            Route::get('reports/summary', 'ReportController@summary')->middleware('admin.can:reports');
            Route::get('reports/delivered', 'ReportController@deliveredReport')->middleware('admin.can:reports');
            Route::get('reports/delivered/export', 'ReportController@exportDelivered')->middleware('admin.can:reports');

            Route::middleware('admin.can:places')->group(function () {
                Route::apiResource('cities', 'CityController');
                Route::apiResource('subcities', 'SubcityController');
            });
            Route::apiResource('coupons', 'CouponController')->middleware('admin.can:coupon');
            Route::apiResource('payment-methods', 'PaymentMethodController')->middleware('admin.can:orders');

            Route::middleware('admin.can:blogs')->group(function () {
                Route::apiResource('blog/categories', 'PostCategoryController');
                Route::apiResource('blog/posts', 'PostController');
            });

            Route::middleware('admin.can:all_properties')->group(function () {
                Route::get('properties', 'PropertyController@index');
                Route::post('properties', 'PropertyController@store');
                Route::get('properties/{id}', 'PropertyController@show');
                // multipart PUT is not parsed by PHP, so clients send POST with _method=PUT
                Route::match(['put', 'patch', 'post'], 'properties/{id}', 'PropertyController@update');
                Route::delete('properties/{id}', 'PropertyController@destroy');
                Route::post('properties/{id}/{action}', 'PropertyController@transition')
                    ->where('action', 'approve|cancel|pending|delivery-progress|delivered');
            });

            Route::middleware('admin.can:orders')->group(function () {
                Route::get('orders', 'OrderController@index');
                Route::get('orders/{id}', 'OrderController@show');
                Route::delete('orders/{id}', 'OrderController@destroy');
                Route::post('orders/{id}/verify', 'OrderController@verify');
                Route::post('orders/{id}/reject', 'OrderController@reject');
                Route::get('visits', 'VisitController@index');
                Route::patch('visits/{id}', 'VisitController@update');
                Route::delete('visits/{id}', 'VisitController@destroy');
                Route::get('inquiries', 'InquiryController@index');
                Route::patch('inquiries/{id}', 'InquiryController@update');
                Route::delete('inquiries/{id}', 'InquiryController@destroy');
            });

            Route::middleware('admin.can:contact_messages')->group(function () {
                Route::get('contacts', 'InboxController@contacts');
                Route::get('contacts/{id}', 'InboxController@contact');
                Route::patch('contacts/{id}', 'InboxController@updateContact');
                Route::delete('contacts/{id}', 'InboxController@deleteContact');
            });
            Route::middleware('admin.can:newsletter')->group(function () {
                Route::get('newsletters', 'InboxController@newsletters');
                Route::delete('newsletters/{id}', 'InboxController@deleteNewsletter');
            });
            Route::middleware('admin.can:site_setting')->group(function () {
                Route::get('settings', 'InboxController@settings');
                Route::put('settings', 'InboxController@updateSettings');
            });

            Route::apiResource('admins', 'ChildAdminController')->middleware('admin.can:user_role');

            Route::middleware('admin.can:database_backup')->group(function () {
                Route::get('backups', 'BackupController@index');
                Route::post('backups', 'BackupController@run');
                Route::get('backups/{name}', 'BackupController@download');
                Route::delete('backups/{name}', 'BackupController@destroy');
            });
        });
    });
});
