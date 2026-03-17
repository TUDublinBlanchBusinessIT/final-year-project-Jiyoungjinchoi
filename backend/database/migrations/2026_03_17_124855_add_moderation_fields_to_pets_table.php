<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            if (!Schema::hasColumn('pets', 'status')) {
                $table->string('status')->nullable()->after('lost_status');
            }

            if (!Schema::hasColumn('pets', 'moderated_by')) {
                $table->unsignedBigInteger('moderated_by')->nullable()->after('status');
            }

            if (!Schema::hasColumn('pets', 'moderated_at')) {
                $table->timestamp('moderated_at')->nullable()->after('moderated_by');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pets', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('pets', 'status')) {
                $columns[] = 'status';
            }

            if (Schema::hasColumn('pets', 'moderated_by')) {
                $columns[] = 'moderated_by';
            }

            if (Schema::hasColumn('pets', 'moderated_at')) {
                $columns[] = 'moderated_at';
            }

            if (!empty($columns)) {
                $table->dropColumn($columns);
            }
        });
    }
};