<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'account_type')) {
                $table->string('account_type')->default('Basic');
            }

            if (!Schema::hasColumn('users', 'subscription_started_at')) {
                $table->timestamp('subscription_started_at')->nullable();
            }

            if (!Schema::hasColumn('users', 'subscription_status')) {
                $table->string('subscription_status')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn([
                'account_type',
                'subscription_started_at',
                'subscription_status',
            ]);
        });
    }
};