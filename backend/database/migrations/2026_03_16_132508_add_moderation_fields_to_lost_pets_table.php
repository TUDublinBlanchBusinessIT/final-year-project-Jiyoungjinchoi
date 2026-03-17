<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('lost_pets', function (Blueprint $table) {
            if (!Schema::hasColumn('lost_pets', 'status')) {
                $table->string('status')->default('pending');
            }

            if (!Schema::hasColumn('lost_pets', 'moderated_by')) {
                $table->unsignedBigInteger('moderated_by')->nullable();
            }

            if (!Schema::hasColumn('lost_pets', 'moderated_at')) {
                $table->timestamp('moderated_at')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('lost_pets', function (Blueprint $table) {
            $columnsToDrop = [];

            if (Schema::hasColumn('lost_pets', 'status')) {
                $columnsToDrop[] = 'status';
            }

            if (Schema::hasColumn('lost_pets', 'moderated_by')) {
                $columnsToDrop[] = 'moderated_by';
            }

            if (Schema::hasColumn('lost_pets', 'moderated_at')) {
                $columnsToDrop[] = 'moderated_at';
            }

            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};