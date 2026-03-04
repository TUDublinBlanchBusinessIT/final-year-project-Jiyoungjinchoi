<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->decimal('last_seen_lat', 10, 7)->nullable()->after('last_seen_location');
            $table->decimal('last_seen_lng', 10, 7)->nullable()->after('last_seen_lat');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['last_seen_lat', 'last_seen_lng']);
        });
    }
};