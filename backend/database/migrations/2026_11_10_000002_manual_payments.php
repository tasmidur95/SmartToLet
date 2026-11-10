<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/** Manual payments (card / bank account / mobile banking) confirmed by admin from a transaction reference. */
class ManualPayments extends Migration
{
    public function up()
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->string('type', 10);                 // card | bank | mfs
            $table->string('name');                     // e.g. bKash, City Bank
            $table->string('account_name')->nullable();
            $table->string('account_number');           // card no / account no / wallet number
            $table->text('instructions')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::table('orders', function (Blueprint $table) {
            $table->string('purpose', 20)->default('listing');   // listing | rent | delivery
            $table->unsignedBigInteger('method_id')->nullable();
            $table->string('method_name')->nullable();
            $table->string('reference')->nullable()->index();
            $table->string('sender_number')->nullable();
            $table->text('note')->nullable();
            $table->text('reject_reason')->nullable();
            $table->timestamp('verified_at')->nullable();
        });
    }

    public function down()
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn(['purpose', 'method_id', 'method_name', 'reference', 'sender_number', 'note', 'reject_reason', 'verified_at']);
        });
        Schema::dropIfExists('payment_methods');
    }
}
