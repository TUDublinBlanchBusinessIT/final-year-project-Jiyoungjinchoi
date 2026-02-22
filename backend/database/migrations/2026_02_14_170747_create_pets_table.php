<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pets', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->onDelete('cascade');

            $table->string('name');
            $table->string('species');
            $table->string('breed')->nullable();

            $table->date('dob')->nullable();
            $table->unsignedInteger('age'); // required

            $table->string('gender')->nullable();
            $table->decimal('weight', 6, 2)->nullable(); // e.g. 12.50 kg

            $table->text('notes')->nullable();

            // store path like "pets/abc.jpg"
            $table->string('photo_path')->nullable();

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pets');
    }
};
