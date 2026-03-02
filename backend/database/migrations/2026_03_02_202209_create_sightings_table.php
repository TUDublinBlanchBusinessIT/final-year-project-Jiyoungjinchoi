<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('sightings', function (Blueprint $table) {
            $table->id();

            // Links sighting to a lost report in the pets table
            $table->foreignId('pet_id')
                ->constrained('pets')
                ->cascadeOnDelete();

            // Who submitted (optional)
            $table->foreignId('reported_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            // ✅ Required by acceptance criteria
            $table->string('location');

            // Optional extra details
            $table->text('notes')->nullable();

            // ✅ Optional photo
            $table->string('photo_path')->nullable();

            // ✅ "Owner notified" record (simple + valid)
            $table->timestamp('owner_notified_at')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sightings');
    }
};