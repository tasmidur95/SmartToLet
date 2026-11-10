<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class CreateVisitsTable extends Migration
{
    public function up()
    {
        Schema::create('visits', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('user_id')->nullable()->index();
            $table->unsignedBigInteger('property_id')->index();
            $table->string('name');
            $table->string('email');
            $table->string('phone', 30);
            $table->date('visit_date');
            $table->string('visit_time', 5);              // "10:00"
            $table->string('message')->nullable();
            $table->string('status', 20)->default('pending'); // pending, confirmed, cancelled, completed
            $table->string('admin_note')->nullable();
            $table->timestamps();

            $table->index(['property_id', 'visit_date']);
            $table->index('status');
        });
    }

    public function down()
    {
        Schema::dropIfExists('visits');
    }
}
