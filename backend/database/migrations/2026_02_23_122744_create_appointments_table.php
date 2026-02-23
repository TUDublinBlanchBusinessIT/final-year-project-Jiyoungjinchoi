<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('appointments', function (Blueprint $table) {
            $table->id();

            // Who booked the appointment (logged-in user)
            $table->foreignId('user_id')
                ->constrained()
                ->cascadeOnDelete();

            // Which pet the appointment is for
            $table->foreignId('pet_id')
                ->constrained()
                ->cascadeOnDelete();

            // Which provider (vet/groomer)
            $table->foreignId('provider_id')
                ->constrained()
                ->cascadeOnDelete();

            // Vet or Groomer (should match provider type)
            $table->enum('service_type', ['vet', 'groomer']);

            // Appointment date & time
            $table->dateTime('appointment_at');

            // Booking status (for cancel/reschedule)
            $table->enum('status', ['confirmed', 'cancelled', 'rescheduled'])
                ->default('confirmed');

            // Optional notes (reason, comments)
            $table->text('notes')->nullable();

            $table->timestamps();

            // Prevent double booking the same provider at the same date/time
            $table->unique(['provider_id', 'appointment_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appointments');
    }
};