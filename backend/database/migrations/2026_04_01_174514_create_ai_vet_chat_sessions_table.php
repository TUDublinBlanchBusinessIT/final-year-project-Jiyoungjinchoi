<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('ai_vet_chat_sessions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pet_id')->constrained()->cascadeOnDelete();

            $table->longText('intake_summary')->nullable();
            $table->text('concern')->nullable();
            $table->string('duration', 1000)->nullable();
            $table->string('appetite', 1000)->nullable();
            $table->string('behaviour', 1000)->nullable();

            $table->longText('symptoms')->nullable();   // JSON string
            $table->longText('guidance')->nullable();   // JSON string
            $table->longText('transcript')->nullable(); // JSON string

            $table->unsignedTinyInteger('rating')->nullable();
            $table->text('feedback')->nullable();

            $table->timestamp('started_at')->nullable();
            $table->timestamp('ended_at')->nullable();

            $table->timestamps();

            $table->index(['user_id', 'pet_id']);
            $table->index('started_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('ai_vet_chat_sessions');
    }
};