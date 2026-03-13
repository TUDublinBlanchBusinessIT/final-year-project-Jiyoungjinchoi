<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->string('eye_color')->nullable();
            $table->string('fur_type')->nullable();
            $table->text('markings')->nullable();

            $table->text('health_conditions')->nullable();
            $table->text('vaccination_history')->nullable();
            $table->string('microchip_number')->nullable();

            $table->string('exercise_level')->nullable();
            $table->string('activity_level')->nullable();

            $table->text('diet')->nullable();
            $table->text('personality_traits')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn([
                'eye_color',
                'fur_type',
                'markings',
                'health_conditions',
                'vaccination_history',
                'microchip_number',
                'exercise_level',
                'activity_level',
                'diet',
                'personality_traits',
            ]);
        });
    }
};