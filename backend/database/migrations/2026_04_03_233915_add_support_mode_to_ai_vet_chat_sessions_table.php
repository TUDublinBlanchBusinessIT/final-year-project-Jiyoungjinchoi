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
        Schema::table('ai_vet_chat_sessions', function (Blueprint $table) {
            $table->string('support_mode')->nullable()->after('intake_summary');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ai_vet_chat_sessions', function (Blueprint $table) {
            $table->dropColumn('support_mode');
        });
    }
};