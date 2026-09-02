<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OrderImportController;
use App\Http\Controllers\Api\ProductController;
use Illuminate\Support\Facades\Route;

Route::post('/login', [AuthController::class, 'login']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::apiResource('categories', CategoryController::class);
    Route::apiResource('products', ProductController::class);

    Route::get('orders/{order}/export-excel', [OrderController::class, 'exportExcel']);
    Route::patch('orders/{order}/status', [OrderController::class, 'updateStatus']);
    Route::apiResource('orders', OrderController::class);

    Route::post('orders-import/parse', [OrderImportController::class, 'parse']);
    Route::post('orders-import/confirm', [OrderImportController::class, 'confirm']);

    Route::get('dashboard/summary', [DashboardController::class, 'summary']);
    Route::get('dashboard/revenue-by-time', [DashboardController::class, 'revenueByTime']);
    Route::get('dashboard/orders-by-status', [DashboardController::class, 'ordersByStatus']);
    Route::get('dashboard/stock-overview', [DashboardController::class, 'stockOverview']);
    Route::get('dashboard/top-products', [DashboardController::class, 'topProducts']);
});
