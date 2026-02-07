<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\RegisterController;

Route::get('/', function () {
    return view('welcome'); // or return 'Backend running';
});

Route::get('/register', function () {
    return view('auth.register');
})->name('register.form');

Route::post('/register', [RegisterController::class, 'store'])->name('register');

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});
