<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')->constrained()->cascadeOnDelete();

            $table->string('name');
            $table->string('category')->default('Food'); // Food, Supplement, Medication, Accessory
            $table->string('unit')->default('g');         // g, kg, ml, tablets, pcs

            $table->decimal('current_quantity', 10, 2)->default(0);
            $table->decimal('daily_usage', 10, 2)->default(0);

            $table->unsignedInteger('remind_before_days')->default(7);
            $table->timestamp('last_restocked_at')->nullable();

            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_items');
    }
};