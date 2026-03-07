<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->string('vaccination_status')->nullable()->after('photo_path');
            $table->date('last_vet_visit')->nullable()->after('vaccination_status');
            $table->text('medical_notes')->nullable()->after('last_vet_visit');

            $table->string('food_type')->nullable()->after('medical_notes');
            $table->string('feeding_schedule')->nullable()->after('food_type');
            $table->string('allergies')->nullable()->after('feeding_schedule');

            $table->string('temperament')->nullable()->after('allergies');
            $table->text('behaviour_notes')->nullable()->after('temperament');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn([
                'vaccination_status',
                'last_vet_visit',
                'medical_notes',
                'food_type',
                'feeding_schedule',
                'allergies',
                'temperament',
                'behaviour_notes',
            ]);
        });
    }
};