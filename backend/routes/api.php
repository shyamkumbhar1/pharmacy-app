<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Register endpoint
Route::post('/register', [AuthController::class, 'register']);
Route::get('/users', [AuthController::class, 'index']);

