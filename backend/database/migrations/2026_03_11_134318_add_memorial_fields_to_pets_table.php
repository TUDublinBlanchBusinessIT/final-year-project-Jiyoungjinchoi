<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->string('status')->default('Active')->after('user_id');
            $table->string('memorial_message')->nullable()->after('status');
            $table->timestamp('memorialized_at')->nullable()->after('memorial_message');
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $table->dropColumn(['status', 'memorial_message', 'memorialized_at']);
        });
    }
};