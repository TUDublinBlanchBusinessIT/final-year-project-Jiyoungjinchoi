<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('providers', function (Blueprint $table) {
            $table->id(); // Primary Key

            $table->string('name'); // e.g. "Happy Paws Vet Clinic"
            $table->enum('type', ['vet', 'groomer']); // Service type

            $table->string('address')->nullable(); // optional
            $table->string('county')->nullable(); // Ireland counties (Dublin, Cork, etc.)

            // Optional: location coords for future location-based search
            $table->decimal('lat', 10, 7)->nullable();
            $table->decimal('lng', 10, 7)->nullable();

            $table->string('phone')->nullable();
            $table->string('email')->nullable();

            $table->timestamps(); // created_at, updated_at
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('providers');
    }
};