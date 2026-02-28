<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->boolean('is_lost')->default(false)->after('updated_at');
            $table->string('lost_status')->nullable()->after('is_lost'); // e.g. Active / Found
            $table->text('lost_description')->nullable()->after('lost_status');
            $table->string('last_seen_location')->nullable()->after('lost_description');
            $table->string('lost_photo_path')->nullable()->after('last_seen_location');
            $table->timestamp('reported_lost_at')->nullable()->after('lost_photo_path');
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