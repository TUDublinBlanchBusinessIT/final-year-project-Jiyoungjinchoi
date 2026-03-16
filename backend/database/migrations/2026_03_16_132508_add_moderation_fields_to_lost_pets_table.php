<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lost_pets', function (Blueprint $table) {
            $table->string('status')->default('pending');
            $table->unsignedBigInteger('moderated_by')->nullable();
            $table->timestamp('moderated_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('lost_pets', function (Blueprint $table) {
            $table->dropColumn(['status', 'moderated_by', 'moderated_at']);
        });
    }
};