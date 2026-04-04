<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PetController;
use App\Http\Controllers\ReminderController;
use App\Http\Controllers\AppointmentController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\Api\SightingController;
use App\Http\Controllers\Api\PremiumLostFoundController;
use App\Http\Controllers\Api\PremiumPetController;
use App\Http\Controllers\Api\AiVetChatController;
use App\Http\Controllers\Api\StripeController;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

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

    // Reminders
    Route::get('/reminders', [ReminderController::class, 'index']);
    Route::get('/reminders/upcoming', [ReminderController::class, 'upcoming']);

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

        // User Story 200 - save and review AI vet chat sessions
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

    // Sightings for a lost pet
    Route::get('/lost-pets/{pet}/sightings', [SightingController::class, 'index']);
    Route::post('/lost-pets/{pet}/sightings', [SightingController::class, 'store']);
});

// Optional public premium feed
Route::get('/premium/lost-found', [PremiumLostFoundController::class, 'index']);
Route::get('/premium/lost-found/{id}', [PremiumLostFoundController::class, 'show']);