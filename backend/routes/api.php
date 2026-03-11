<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Hash;
use App\Models\Pet;

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
    Route::post('/inventory/{inventoryItem}/consume', [InventoryController::class, 'consume']);
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

    // ✅ Upgrade to Premium
    Route::post('/upgrade-premium', function (Request $request) {
        $user = $request->user();
        $user->account_type = 'Premium';
        $user->subscription_started_at = now();
        $user->save();

        return response()->json([
            'message' => 'Membership upgraded successfully.',
            'user' => $user
        ]);
    });

    // ✅ Cancel Premium
    Route::post('/cancel-premium', function (Request $request) {
        $user = $request->user();
        $user->account_type = 'Basic';
        $user->subscription_started_at = null;
        $user->save();

        return response()->json([
            'message' => 'Subscription cancelled successfully.',
            'user' => $user
        ]);
    });

    // ✅ Change Password
    Route::post('/profile/change-password', function (Request $request) {
        $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'message' => 'Current password is incorrect.'
            ], 422);
        }

        $user->password = Hash::make($request->password);
        $user->save();

        return response()->json([
            'message' => 'Password updated successfully.'
        ]);
    });

    // ✅ Save Notification Preferences
    Route::post('/profile/notifications', function (Request $request) {
        $validated = $request->validate([
            'notification_email' => ['required', 'boolean'],
            'notification_sms' => ['required', 'boolean'],
        ]);

        $user = $request->user();
        $user->notification_email = $validated['notification_email'];
        $user->notification_sms = $validated['notification_sms'];
        $user->save();

        return response()->json([
            'message' => 'Notification preferences saved.',
            'user' => $user
        ]);
    });

    // ✅ Logout
    Route::post('/logout', function (Request $request) {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Logged out successfully.'
        ]);
    });

    // ✅ Delete Account
    Route::delete('/profile', function (Request $request) {
        $user = $request->user();

        $request->user()->currentAccessToken()?->delete();
        $user->delete();

        return response()->json([
            'message' => 'Account deleted successfully.'
        ]);
    });

    // ✅ Mark Pet as Memorial
    Route::patch('/pets/{pet}/memorial', function (Request $request, Pet $pet) {
        $user = $request->user();

        if ((int) $pet->user_id !== (int) $user->id) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        $validated = $request->validate([
            'memorial_message' => ['nullable', 'string'],
        ]);

        $pet->status = 'Memorial';
        $pet->memorial_message = $validated['memorial_message']
            ?? 'Remember me with tears and laughter. Remember me though it hurts to do so, because the pain you have is equal to the love we shared. There is no goodbye if you carry me in your heart. Remember all the joy we shared, because there was so much of it for both of us. - Herbie Longfellow Alderdice';
        $pet->memorialized_at = now();
        $pet->save();

        return response()->json([
            'message' => 'Pet moved to memorial successfully.',
            'pet' => $pet
        ]);
    });

    // ✅ Delete Memorial
    Route::delete('/pets/{pet}/memorial', function (Request $request, Pet $pet) {
        $user = $request->user();

        if ((int) $pet->user_id !== (int) $user->id) {
            return response()->json([
                'message' => 'Unauthorized.'
            ], 403);
        }

        if ($pet->status !== 'Memorial') {
            return response()->json([
                'message' => 'This pet is not in memorial status.'
            ], 422);
        }

        $pet->delete();

        return response()->json([
            'message' => 'Memorial deleted successfully.'
        ]);
    });
});