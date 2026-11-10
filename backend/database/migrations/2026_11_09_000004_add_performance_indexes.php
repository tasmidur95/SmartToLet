<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Indexes for the columns the API filters and joins on. Each one is created inside try/catch so the
 * migration is safe to run on databases that already have an index of that name.
 */
class AddPerformanceIndexes extends Migration
{
    private $indexes = [
        'user_properties'      => [['status'], ['city_id'], ['subcity_id'], ['user_id'], ['property_code'], ['category'], ['purpose'], ['status', 'id']],
        'wishlists'            => [['user_id'], ['property_id']],
        'orders'               => [['transaction_id'], ['user_id'], ['status']],
        'interested_properties' => [['status'], ['property_code']],
        'contacts'             => [['status'], ['review']],
        'posts'                => [['category_id']],
        'subcities'            => [['city_id']],
        'newsletters'          => [['email']],
    ];

    public function up()
    {
        foreach ($this->indexes as $table => $sets) {
            if (!Schema::hasTable($table)) {
                continue;
            }
            foreach ($sets as $columns) {
                if (count(array_filter($columns, function ($c) use ($table) { return Schema::hasColumn($table, $c); })) !== count($columns)) {
                    continue;
                }
                try {
                    Schema::table($table, function (Blueprint $t) use ($columns) {
                        $t->index($columns);
                    });
                } catch (\Throwable $e) {
                    // index already exists
                }
            }
        }
    }

    public function down()
    {
        foreach ($this->indexes as $table => $sets) {
            foreach ($sets as $columns) {
                try {
                    Schema::table($table, function (Blueprint $t) use ($table, $columns) {
                        $t->dropIndex($table . '_' . implode('_', $columns) . '_index');
                    });
                } catch (\Throwable $e) {
                    // already gone
                }
            }
        }
    }
}
