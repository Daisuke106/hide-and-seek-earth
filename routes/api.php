<?php
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::get('/characters', function (Request $request) {
    // MVPでは、固定のキャラクターデータを返す
    return response()->json([
        ['id' => 1, 'name' => '東京駅キャラ', 'lat' => 35.6812, 'lng' => 139.7671],
        ['id' => 2, 'name' => '皇居キャラ', 'lat' => 35.6851, 'lng' => 139.7527],
    ]);
});