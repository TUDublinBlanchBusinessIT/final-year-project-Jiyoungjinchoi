<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('found_reports', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            $table->string('reporter_name')->nullable();
            $table->string('species')->nullable();
            $table->string('breed')->nullable();
            $table->string('colour')->nullable();
            $table->text('description');
            $table->string('location_found');
            $table->timestamp('found_at')->nullable();
            $table->string('photo_path')->nullable();
            $table->text('notes')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('found_reports');
    }
};