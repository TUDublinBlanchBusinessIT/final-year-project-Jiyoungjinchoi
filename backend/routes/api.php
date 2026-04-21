<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PostController;
use App\Http\Controllers\CommentController;
use App\Http\Controllers\LikeController;
use App\Http\Controllers\LostPetController;

use App\Http\Controllers\Api\SightingController;
use App\Http\Controllers\Api\PremiumLostFoundController;
use App\Http\Controllers\Api\PremiumPetController;
use App\Http\Controllers\Api\AiVetChatController;
use App\Http\Controllers\Api\StripeController;
use App\Http\Controllers\Api\AdminController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Public lost pet routes
Route::get('/lost-pets', [LostPetController::class, 'index']);
Route::get('/lost-pets/{pet}', [LostPetController::class, 'show']);

// Optional public premium feed
Route::get('/premium/lost-found', [PremiumLostFoundController::class, 'index']);
Route::get('/premium/lost-found/{id}', [PremiumLostFoundController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', function (Request $request) {
        return $request->user();
    });

    Route::post('/logout', [AuthController::class, 'logout']);

    // Stripe / Subscription
    Route::post('/stripe/checkout', [StripeController::class, 'checkout']);
    Route::post('/stripe/billing-portal', [StripeController::class, 'billingPortal']);
    Route::post('/cancel-premium', [StripeController::class, 'cancelPremium']);
    Route::get('/subscription-status', [StripeController::class, 'subscriptionStatus']);

    // Pets
    Route::get('/pets', [PetController::class, 'index']);
    Route::post('/pets', [PetController::class, 'store']);
    Route::get('/pets/{pet}', [PetController::class, 'show']);
    Route::patch('/pets/{pet}', [PetController::class, 'update']);
    Route::delete('/pets/{pet}', [PetController::class, 'destroy']);
    Route::post('/pets/{pet}/memorial', [PetController::class, 'markMemorial']);
    Route::delete('/pets/{pet}/memorial', [PetController::class, 'deleteMemorial']);

    // Lost Pets
    Route::post('/lost-pets', [LostPetController::class, 'store']);
    Route::patch('/lost-pets/{pet}/resolve', [LostPetController::class, 'resolve']);

    // Reminders
    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::post('/reminders/generate', [ReminderController::class, 'generate']);
    Route::get('/reminders/upcoming', [ReminderController::class, 'upcoming']);
    Route::patch('/reminders/{reminder}/complete', [ReminderController::class, 'complete']);
    Route::patch('/reminders/{reminder}/snooze', [ReminderController::class, 'snooze']);

    // Appointments
    Route::get('/appointments', [AppointmentController::class, 'index']);
    Route::get('/appointments/options', [AppointmentController::class, 'options']);
    Route::post('/appointments', [AppointmentController::class, 'store']);
    Route::get('/appointments/{appointment}', [AppointmentController::class, 'show']);
    Route::patch('/appointments/{appointment}', [AppointmentController::class, 'update']);
    Route::delete('/appointments/{appointment}', [AppointmentController::class, 'destroy']);

    // Inventory
    Route::get('/inventory', [InventoryController::class, 'index']);
    Route::post('/inventory', [InventoryController::class, 'store']);
    Route::patch('/inventory/{inventoryItem}', [InventoryController::class, 'update']);
    Route::delete('/inventory/{inventoryItem}', [InventoryController::class, 'destroy']);
    Route::post('/inventory/{inventoryItem}/restock', [InventoryController::class, 'restock']);
    Route::post('/inventory/{inventoryItem}/consume', [InventoryController::class, 'consume']);

    // Community posts
    Route::get('/posts', [PostController::class, 'index']);
    Route::post('/posts', [PostController::class, 'store']);
    Route::post('/posts/{post}/like', [LikeController::class, 'toggle']);
    Route::post('/posts/{post}/report', [PostController::class, 'report']);
    Route::delete('/posts/{post}', [PostController::class, 'destroy']);

    // Comments
    Route::get('/posts/{post}/comments', [CommentController::class, 'index']);
    Route::post('/posts/{post}/comments', [CommentController::class, 'store']);
    Route::delete('/comments/{comment}', [CommentController::class, 'destroy']);
    Route::delete('/posts/{post}/comments/{comment}', [CommentController::class, 'destroyForPost']);

    // Premium features
    Route::prefix('premium')->group(function () {
        // Premium Pet Intelligence
        Route::get('/pets/{pet}/health-logs', [PremiumPetController::class, 'healthLogs']);
        Route::post('/pets/{pet}/health-logs', [PremiumPetController::class, 'storeHealthLog']);
        Route::delete('/pets/{pet}/health-logs/{log}', [PremiumPetController::class, 'destroyHealthLog']);

        Route::get('/pets/{pet}/reminders', [PremiumPetController::class, 'reminders']);
        Route::get('/pets/{pet}/dashboard', [PremiumPetController::class, 'dashboard']);
        Route::get('/pets/{pet}/recommendations', [PremiumPetController::class, 'recommendations']);
        Route::get('/pets/{pet}/alerts', [PremiumPetController::class, 'alerts']);

        // Premium memorial customisation
        Route::post('/pets/{pet}/memorial-customise', [PremiumPetController::class, 'customiseMemorial']);

        // AI Vet Chat
        Route::post('/ai-vet-chat', [AiVetChatController::class, 'chat']);

        // AI vet chat sessions
        Route::get('/ai-vet-chat/sessions', [AiVetChatController::class, 'sessions']);
        Route::post('/ai-vet-chat/sessions', [AiVetChatController::class, 'storeSession']);
        Route::put('/ai-vet-chat/sessions/{session}/transcript', [AiVetChatController::class, 'updateTranscript']);
        Route::post('/ai-vet-chat/sessions/{session}/end', [AiVetChatController::class, 'endSession']);
        Route::post('/ai-vet-chat/sessions/{session}/rating', [AiVetChatController::class, 'storeRating']);
    });

    // Premium Lost & Found
    Route::prefix('premium')->group(function () {
        Route::get('/lost-found', [PremiumLostFoundController::class, 'index']);
        Route::post('/lost-found', [PremiumLostFoundController::class, 'store']);
        Route::get('/lost-found/{id}', [PremiumLostFoundController::class, 'show']);
        Route::patch('/lost-found/{id}/resolve', [PremiumLostFoundController::class, 'resolve']);
    });

    // Sightings
    Route::get('/lost-pets/{pet}/sightings', [SightingController::class, 'index']);
    Route::post('/lost-pets/{pet}/sightings', [SightingController::class, 'store']);

    // Owner dashboard/profile sightings
    Route::get('/owner/sightings', [SightingController::class, 'ownerSightings']);

    // Admin routes
    Route::prefix('admin')->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard']);
        Route::get('/lost-pets', [AdminController::class, 'lostPets']);
        Route::patch('/lost-pets/{id}/approve', [AdminController::class, 'approveLostPet']);
        Route::patch('/lost-pets/{id}/hide', [AdminController::class, 'hideLostPet']);

        Route::get('/users', [AdminController::class, 'users']);
        Route::patch('/users/{id}/ban', [AdminController::class, 'banUser']);
        Route::patch('/users/{id}/unban', [AdminController::class, 'unbanUser']);
        Route::patch('/users/{id}/upgrade', [AdminController::class, 'upgradeUser']);
        Route::patch('/users/{id}/downgrade', [AdminController::class, 'downgradeUser']);

        Route::get('/reported-posts', [AdminController::class, 'reportedPosts']);
        Route::patch('/posts/{id}/approve', [AdminController::class, 'approvePost']);
        Route::patch('/posts/{id}/hide', [AdminController::class, 'hidePost']);
    });
});