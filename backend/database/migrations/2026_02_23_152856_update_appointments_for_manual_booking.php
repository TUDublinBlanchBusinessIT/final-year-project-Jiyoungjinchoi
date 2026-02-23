<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            // Address entered manually by user
            if (!Schema::hasColumn('appointments', 'address')) {
                $table->string('address')->nullable()->after('service_type');
            }

            // Allow manual appointments without provider
            $table->unsignedBigInteger('provider_id')->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('appointments', function (Blueprint $table) {
            if (Schema::hasColumn('appointments', 'address')) {
                $table->dropColumn('address');
            }

            // Revert nullable back (only if you REALLY want to roll back)
            $table->unsignedBigInteger('provider_id')->nullable(false)->change();
        });
    }
};