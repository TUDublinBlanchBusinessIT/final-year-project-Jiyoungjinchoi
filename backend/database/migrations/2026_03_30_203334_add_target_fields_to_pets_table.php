<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->decimal('target_weight', 6, 2)->nullable()->after('weight');
            $table->unsignedInteger('target_activity_minutes')->nullable()->after('target_weight');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['target_weight', 'target_activity_minutes']);
        });
    }
};