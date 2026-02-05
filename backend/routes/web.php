<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;

Route::get('/register', function () {
    return view('auth.register');
});

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::post('/register', [RegisterController::class, 'store'])->name('register');
