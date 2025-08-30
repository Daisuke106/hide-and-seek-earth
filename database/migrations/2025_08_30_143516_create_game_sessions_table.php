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
        Schema::create('game_sessions', function (Blueprint $table) {
            $table->id();
            $table->uuid('session_id')->unique();
            $table->json('character_ids'); // 探すキャラクターのIDリスト
            $table->timestamp('start_time');
            $table->timestamp('end_time')->nullable();
            $table->json('found_characters')->default('[]'); // 発見されたキャラクターのIDリスト
            $table->integer('total_score')->default(0);
            $table->boolean('is_completed')->default(false);
            $table->json('game_data')->nullable(); // 追加のゲームデータ
            $table->timestamps();

            $table->index('session_id');
            $table->index('is_completed');
            $table->index('start_time');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('game_sessions');
    }
};
