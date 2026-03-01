<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->timestamp('resolved_at')->nullable()->after('reported_lost_at');
            $table->timestamp('archived_at')->nullable()->after('resolved_at');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['resolved_at', 'archived_at']);
        });
    }
};