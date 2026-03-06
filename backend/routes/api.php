<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\Auth\RegisterController;
use App\Http\Controllers\AuthController;

use App\Http\Controllers\PetController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\ReminderController;

// ✅ Lost & Found
use App\Http\Controllers\LostPetController;
use App\Http\Controllers\SightingController;

use App\Models\User;

// ✅ Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok'], 200);
});

// ✅ Register
Route::post('/register', [RegisterController::class, 'apiStore'])
    ->middleware('throttle:10,1');

// ✅ Login
Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:10,1');

// ✅ Resend verification email
Route::post('/email/verification-notification', function (Request $request) {

    $validated = $request->validate([
        'email' => ['required', 'email'],
    ]);

    $user = User::where('email', $validated['email'])->first();

    if (!$user) {
        return response()->json(['message' => 'User not found.'], 404);
    }

    if ($user->hasVerifiedEmail()) {
        return response()->json(['message' => 'Email already verified.'], 400);
    }

    $user->sendEmailVerificationNotification();

    return response()->json(['message' => 'Verification email sent.'], 200);

})->middleware('throttle:3,1');


/*
|--------------------------------------------------------------------------
| Protected Routes (Require Authentication via Sanctum)
|--------------------------------------------------------------------------
*/
Route::middleware('auth:sanctum')->group(function () {

    // 🐾 Pets (CRUD)
    Route::get('/pets', [PetController::class, 'index']);
    Route::get('/pets/{pet}', [PetController::class, 'show']);
    Route::post('/pets', [PetController::class, 'store']);
    Route::put('/pets/{pet}', [PetController::class, 'update']);
    Route::patch('/pets/{pet}', [PetController::class, 'update']);
    Route::delete('/pets/{pet}', [PetController::class, 'destroy']);

    // 🐾 Community
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // ❤️ Likes & Comments
    Route::post('/posts/{post}/like', [LikeController::class, 'toggle']);
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
    Route::delete('/posts/{post}/comments/{comment}', [CommentController::class, 'destroyForPost']);

    // 📦 Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::put('/inventory/{inventoryItem}', [InventoryController::class, 'update']);
    Route::patch('/inventory/{inventoryItem}', [InventoryController::class, 'update']);
    Route::post('/inventory/{inventoryItem}/restock', [InventoryController::class, 'restock']);
    Route::delete('/inventory/{inventoryItem}', [InventoryController::class, 'destroy']);

    // 🏥 Appointments
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/options', [AppointmentController::class, 'options']);
    Route::get('/appointments/providers', [AppointmentController::class, 'providers']);
    Route::get('/appointments/providers/{provider}/slots', [AppointmentController::class, 'slots']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::put('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);

    // ✅ Lost & Found — Sprint 1511
    Route::get('/lost-pets', [LostPetController::class, 'index']);
    Route::post('/lost-pets', [LostPetController::class, 'store']);

    // ✅ Lost & Found — Sprint 1512 (Resolve)
    Route::patch('/lost-pets/{pet}/resolve', [LostPetController::class, 'resolve']);

    // ✅ Lost & Found — Sprint 1513 (Submit Found/Sighting)
    Route::get('/lost-pets/{pet}/sightings', [SightingController::class, 'index']);
    Route::post('/lost-pets/{pet}/sightings', [SightingController::class, 'store']);

        // ✅ Reminders
    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::post('/reminders/generate', [ReminderController::class, 'generate']);
    Route::get('/reminders/upcoming', [ReminderController::class, 'upcoming']);
Route::patch('/reminders/{reminder}/complete', [ReminderController::class, 'complete']);
Route::patch('/reminders/{reminder}/snooze', [ReminderController::class, 'snooze']);

});