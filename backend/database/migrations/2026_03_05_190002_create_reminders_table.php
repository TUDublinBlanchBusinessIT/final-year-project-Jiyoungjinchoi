<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reminders', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('pet_id')->constrained()->cascadeOnDelete();

            // birthday | vaccine | grooming
            $table->string('type', 30);

            $table->string('title', 120);
            $table->text('message')->nullable();

            // when the reminder should show
            $table->date('reminder_date');

            // pending | done | dismissed
            $table->string('status', 20)->default('pending');

            // prevent duplicates
            $table->string('dedupe_key', 191)->index();

            $table->timestamps();

            $table->unique(['user_id', 'pet_id', 'dedupe_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reminders');
    }
};