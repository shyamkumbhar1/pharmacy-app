<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            // Remove all extra columns, keep only: id, name, created_at, updated_at
            if (Schema::hasColumn('users', 'role')) {
                $table->dropColumn('role');
            }
            if (Schema::hasColumn('users', 'trial_started_at')) {
                $table->dropColumn('trial_started_at');
            }
            if (Schema::hasColumn('users', 'trial_ends_at')) {
                $table->dropColumn('trial_ends_at');
            }
            if (Schema::hasColumn('users', 'subscription_status')) {
                $table->dropColumn('subscription_status');
            }
            if (Schema::hasColumn('users', 'subscription_started_at')) {
                $table->dropColumn('subscription_started_at');
            }
            if (Schema::hasColumn('users', 'subscription_ends_at')) {
                $table->dropColumn('subscription_ends_at');
            }
            if (Schema::hasColumn('users', 'is_active')) {
                $table->dropColumn('is_active');
            }
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->enum('role', ['admin', 'pharmacist'])->default('pharmacist')->after('name');
            $table->dateTime('trial_started_at')->nullable()->after('role');
            $table->dateTime('trial_ends_at')->nullable()->after('trial_started_at');
            $table->enum('subscription_status', ['trial', 'active', 'expired', 'cancelled'])->default('trial')->after('trial_ends_at');
            $table->dateTime('subscription_started_at')->nullable()->after('subscription_status');
            $table->dateTime('subscription_ends_at')->nullable()->after('subscription_started_at');
            $table->boolean('is_active')->default(true)->after('subscription_ends_at');
        });
    }
};
