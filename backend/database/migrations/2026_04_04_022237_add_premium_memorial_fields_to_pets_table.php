<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            if (!Schema::hasColumn('pets', 'memorial_photo_url')) {
                $table->string('memorial_photo_url')->nullable()->after('memorial_message');
            }

            if (!Schema::hasColumn('pets', 'memorial_theme')) {
                $table->string('memorial_theme')->nullable()->after('memorial_photo_url');
            }

            if (!Schema::hasColumn('pets', 'memorial_visibility')) {
                $table->string('memorial_visibility')->default('private')->after('memorial_theme');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('pets', 'memorial_photo_url')) {
                $columns[] = 'memorial_photo_url';
            }

            if (Schema::hasColumn('pets', 'memorial_theme')) {
                $columns[] = 'memorial_theme';
            }

            if (Schema::hasColumn('pets', 'memorial_visibility')) {
                $columns[] = 'memorial_visibility';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};