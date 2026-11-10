<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Columns the API needs that older installs may be missing. Guarded with hasColumn so it is
 * safe on databases imported from houserental.sql.
 */
class Phase1ApiColumns extends Migration
{
    public function up()
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'amount')) {
                $table->double('amount')->nullable();
            }
            if (!Schema::hasColumn('orders', 'coupon_code')) {
                $table->string('coupon_code')->nullable();
            }
            if (!Schema::hasColumn('orders', 'discount_amount')) {
                $table->double('discount_amount')->nullable();
            }
            if (!Schema::hasColumn('orders', 'paid_at')) {
                $table->timestamp('paid_at')->nullable();
            }
        });

        Schema::table('admins', function (Blueprint $table) {
            foreach (['places', 'coupon', 'blogs', 'all_properties', 'orders', 'reports', 'user_role',
                      'newsletter', 'contact_messages', 'site_setting', 'database_backup', 'type'] as $col) {
                if (!Schema::hasColumn('admins', $col)) {
                    $table->string($col, 11)->nullable();
                }
            }
        });

        Schema::table('user_properties', function (Blueprint $table) {
            if (!Schema::hasColumn('user_properties', 'latitude')) {
                $table->decimal('latitude', 10, 7)->nullable();
            }
            if (!Schema::hasColumn('user_properties', 'longitude')) {
                $table->decimal('longitude', 10, 7)->nullable();
            }
        });
    }

    public function down()
    {
        Schema::table('user_properties', function (Blueprint $table) {
            $table->dropColumn(['latitude', 'longitude']);
        });
    }
}
