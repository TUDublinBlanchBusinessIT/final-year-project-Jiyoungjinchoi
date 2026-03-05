<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->date('date_of_birth')->nullable()->after('name');

            $table->date('last_vaccination_date')->nullable()->after('date_of_birth');
            $table->unsignedInteger('vaccine_interval_days')->default(365)->after('last_vaccination_date');

            $table->date('last_grooming_date')->nullable()->after('vaccine_interval_days');
            $table->unsignedInteger('grooming_interval_days')->default(30)->after('last_grooming_date');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn([
                'date_of_birth',
                'last_vaccination_date',
                'vaccine_interval_days',
                'last_grooming_date',
                'grooming_interval_days',
            ]);
        });
    }
};