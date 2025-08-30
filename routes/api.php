<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CharacterController;
use App\Http\Controllers\Api\GameSessionController;

// ヘルスチェック
Route::get('/health', [GameSessionController::class, 'health']);

// キャラクター関連のルート
Route::prefix('characters')->group(function () {
    Route::get('/', [CharacterController::class, 'index']);
    Route::get('/random', [CharacterController::class, 'random']);
    Route::get('/stats', [CharacterController::class, 'stats']);
    Route::get('/{id}', [CharacterController::class, 'show']);
    
    // 管理者用（後で認証を追加予定）
    Route::post('/', [CharacterController::class, 'store']);
    Route::put('/{id}', [CharacterController::class, 'update']);
    Route::delete('/{id}', [CharacterController::class, 'destroy']);
});

// ゲームセッション関連のルート
Route::prefix('game-sessions')->group(function () {
    Route::get('/', [GameSessionController::class, 'index']);
    Route::post('/', [GameSessionController::class, 'store']);
    Route::get('/stats', [GameSessionController::class, 'stats']);
    Route::get('/leaderboard', [GameSessionController::class, 'leaderboard']);
    
    Route::prefix('{sessionId}')->group(function () {
        Route::get('/', [GameSessionController::class, 'show']);
        Route::put('/', [GameSessionController::class, 'update']);
        Route::delete('/', [GameSessionController::class, 'destroy']);
        Route::post('/found', [GameSessionController::class, 'markFound']);
        Route::post('/complete', [GameSessionController::class, 'complete']);
    });
});

// レガシー対応（既存のフロントエンドコードとの互換性のため）
Route::get('/characters', [CharacterController::class, 'index']);