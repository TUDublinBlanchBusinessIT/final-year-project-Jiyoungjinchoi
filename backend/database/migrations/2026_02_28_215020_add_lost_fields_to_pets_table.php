<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->boolean('is_lost')->default(false);
            $table->string('lost_status')->nullable(); // e.g. Active/Found
            $table->text('lost_description')->nullable();
            $table->string('last_seen_location')->nullable();
            $table->string('lost_photo_path')->nullable();
            $table->timestamp('reported_lost_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn([
                'is_lost',
                'lost_status',
                'lost_description',
                'last_seen_location',
                'lost_photo_path',
                'reported_lost_at',
            ]);
        });
    }
};