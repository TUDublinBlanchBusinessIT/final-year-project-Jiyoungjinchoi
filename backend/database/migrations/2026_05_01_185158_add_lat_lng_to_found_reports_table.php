<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('found_reports', function (Blueprint $table) {
            if (!Schema::hasColumn('found_reports', 'lat')) {
                $table->decimal('lat', 10, 7)->nullable()->after('location_found');
            }

            if (!Schema::hasColumn('found_reports', 'lng')) {
                $table->decimal('lng', 10, 7)->nullable()->after('lat');
            }
        });
    }

    public function down(): void
    {
        Schema::table('found_reports', function (Blueprint $table) {
            if (Schema::hasColumn('found_reports', 'lng')) {
                $table->dropColumn('lng');
            }

            if (Schema::hasColumn('found_reports', 'lat')) {
                $table->dropColumn('lat');
            }
        });
    }
};