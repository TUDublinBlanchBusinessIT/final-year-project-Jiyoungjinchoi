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

use App\Models\User;
/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
| These routes are loaded by RouteServiceProvider and assigned the "api"
| middleware group. They will be available under /api/...
*/

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


// ✅ Protected routes
Route::middleware('auth:sanctum')->group(function () {

    // ✅ Pets (Create + Read + Edit + Delete)
    Route::get('/pets', [PetController::class, 'index']);
    Route::get('/pets/{pet}', [PetController::class, 'show']);
    Route::post('/pets', [PetController::class, 'store']);
    Route::put('/pets/{pet}', [PetController::class, 'update']);
    Route::patch('/pets/{pet}', [PetController::class, 'update']);
    Route::delete('/pets/{pet}', [PetController::class, 'destroy']);

    // ✅ Community posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);

    // ✅ Likes & Comments (User Story 1530)
    Route::post('/posts/{post}/like', [LikeController::class, 'toggle']);
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);

    // ✅ Inventory (User Story 1531)
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);

    // ✅ UPDATE (Edit)
    Route::put('/inventory/{inventoryItem}', [InventoryController::class, 'update']);
    Route::patch('/inventory/{inventoryItem}', [InventoryController::class, 'update']);

    // ✅ Restock + Delete
    Route::post('/inventory/{inventoryItem}/restock', [InventoryController::class, 'restock']);
    Route::delete('/inventory/{inventoryItem}', [InventoryController::class, 'destroy']);
});