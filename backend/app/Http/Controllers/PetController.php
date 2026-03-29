<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class PetController extends Controller
{
    public function index()
    {
        $pets = Auth::user()->pets->map(function ($pet) {
            return $this->formatPet($pet);
        });

        return response()->json($pets, 200);
    }

    public function show(Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $pet->load([
            'reminders' => function ($query) {
                $query->orderBy('reminder_date');
            }
        ]);

        return response()->json($this->formatPet($pet, true), 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            // Basic
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'age' => 'required|integer|min:0',
            'gender' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            // Reminder fields
            'last_vaccination_date' => 'nullable|date',
            'vaccine_interval_days' => 'nullable|integer|min:1',
            'last_grooming_date' => 'nullable|date',
            'grooming_interval_days' => 'nullable|integer|min:1',

            // Extra profile fields
            'eye_color' => 'nullable|string|max:255',
            'fur_type' => 'nullable|string|max:255',
            'markings' => 'nullable|string',
            'health_conditions' => 'nullable|string',
            'allergies' => 'nullable|string',
            'vaccination_history' => 'nullable|string',
            'microchip_number' => 'nullable|string|max:255',
            'exercise_level' => 'nullable|string|max:255',
            'activity_level' => 'nullable|string|max:255',
            'diet' => 'nullable|string',
            'personality_traits' => 'nullable|string',

            // Compatibility fields
            'vaccination_status' => 'nullable|string|max:255',
            'last_vet_visit' => 'nullable|date',
            'medical_notes' => 'nullable|string',
            'food_type' => 'nullable|string|max:255',
            'feeding_schedule' => 'nullable|string|max:255',
            'temperament' => 'nullable|string|max:255',
            'behaviour_notes' => 'nullable|string',
        ]);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('pets', 'public');
        }

        $dietValue = $validated['diet'] ?? ($validated['food_type'] ?? null);
        $personalityValue = $validated['personality_traits'] ?? ($validated['temperament'] ?? null);
        $notesValue = $validated['notes'] ?? ($validated['behaviour_notes'] ?? null);

        $pet = Pet::create([
            'user_id' => Auth::id(),

            // Basic
            'name' => $validated['name'],
            'species' => $validated['species'],
            'breed' => $validated['breed'] ?? null,
            'dob' => $validated['dob'] ?? ($validated['date_of_birth'] ?? null),
            'age' => $validated['age'],
            'gender' => $validated['gender'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'notes' => $notesValue,
            'photo_path' => $photoPath,

            // Reminder fields
            'last_vaccination_date' => $validated['last_vaccination_date'] ?? null,
            'vaccine_interval_days' => $validated['vaccine_interval_days'] ?? null,
            'last_grooming_date' => $validated['last_grooming_date'] ?? null,
            'grooming_interval_days' => $validated['grooming_interval_days'] ?? null,

            // Extra profile fields
            'eye_color' => $validated['eye_color'] ?? null,
            'fur_type' => $validated['fur_type'] ?? null,
            'markings' => $validated['markings'] ?? null,
            'health_conditions' => $validated['health_conditions'] ?? null,
            'allergies' => $validated['allergies'] ?? null,
            'vaccination_history' => $validated['vaccination_history'] ?? null,
            'microchip_number' => $validated['microchip_number'] ?? null,
            'exercise_level' => $validated['exercise_level'] ?? null,
            'activity_level' => $validated['activity_level'] ?? null,
            'diet' => $dietValue,
            'personality_traits' => $personalityValue,

            // Compatibility fields
            'vaccination_status' => $validated['vaccination_status'] ?? null,
            'last_vet_visit' => $validated['last_vet_visit'] ?? null,
            'medical_notes' => $validated['medical_notes'] ?? null,
            'food_type' => $dietValue,
            'feeding_schedule' => $validated['feeding_schedule'] ?? null,
            'temperament' => $personalityValue,
            'behaviour_notes' => $notesValue,
        ]);

        $this->syncAutoReminders($pet);

        return response()->json([
            'message' => 'Pet created successfully',
            'pet' => $this->formatPet($pet->load('reminders'), true),
        ], 201);
    }

    public function update(Request $request, Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            // Basic
            'name' => 'sometimes|required|string|max:255',
            'species' => 'sometimes|required|string|max:255',
            'breed' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'date_of_birth' => 'nullable|date',
            'age' => 'sometimes|required|integer|min:0',
            'gender' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            // Reminder fields
            'last_vaccination_date' => 'nullable|date',
            'vaccine_interval_days' => 'nullable|integer|min:1',
            'last_grooming_date' => 'nullable|date',
            'grooming_interval_days' => 'nullable|integer|min:1',

            // Extra profile fields
            'eye_color' => 'nullable|string|max:255',
            'fur_type' => 'nullable|string|max:255',
            'markings' => 'nullable|string',
            'health_conditions' => 'nullable|string',
            'allergies' => 'nullable|string',
            'vaccination_history' => 'nullable|string',
            'microchip_number' => 'nullable|string|max:255',
            'exercise_level' => 'nullable|string|max:255',
            'activity_level' => 'nullable|string|max:255',
            'diet' => 'nullable|string',
            'personality_traits' => 'nullable|string',

            // Compatibility fields
            'vaccination_status' => 'nullable|string|max:255',
            'last_vet_visit' => 'nullable|date',
            'medical_notes' => 'nullable|string',
            'food_type' => 'nullable|string|max:255',
            'feeding_schedule' => 'nullable|string|max:255',
            'temperament' => 'nullable|string|max:255',
            'behaviour_notes' => 'nullable|string',

            // Lost & Found fields
            'is_lost' => 'sometimes|boolean',
            'is_priority' => 'sometimes|boolean',
            'lost_status' => 'nullable|string|max:100',
            'lost_description' => 'nullable|string',
            'last_seen_location' => 'nullable|string|max:255',
            'last_seen_lat' => 'nullable|numeric',
            'last_seen_lng' => 'nullable|numeric',
            'lost_photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',
            'reported_lost_at' => 'nullable|date',
            'resolved_at' => 'nullable|date',
            'archived_at' => 'nullable|date',
        ]);

        if ($request->hasFile('photo')) {
            if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
                Storage::disk('public')->delete($pet->photo_path);
            }

            $pet->photo_path = $request->file('photo')->store('pets', 'public');
        }

        if ($request->hasFile('lost_photo')) {
            if ($pet->lost_photo_path && Storage::disk('public')->exists($pet->lost_photo_path)) {
                Storage::disk('public')->delete($pet->lost_photo_path);
            }

            $pet->lost_photo_path = $request->file('lost_photo')->store('lost-pets', 'public');
        }

        $dietValue = array_key_exists('diet', $validated)
            ? $validated['diet']
            : ($validated['food_type'] ?? $pet->diet);

        $personalityValue = array_key_exists('personality_traits', $validated)
            ? $validated['personality_traits']
            : ($validated['temperament'] ?? $pet->personality_traits);

        $notesValue = array_key_exists('notes', $validated)
            ? $validated['notes']
            : ($validated['behaviour_notes'] ?? $pet->notes);

        if (array_key_exists('name', $validated)) {
            $pet->name = $validated['name'];
        }

        if (array_key_exists('species', $validated)) {
            $pet->species = $validated['species'];
        }

        if (array_key_exists('breed', $validated)) {
            $pet->breed = $validated['breed'];
        }

        if (array_key_exists('dob', $validated) || array_key_exists('date_of_birth', $validated)) {
            $pet->dob = $validated['dob'] ?? ($validated['date_of_birth'] ?? null);
        }

        if (array_key_exists('age', $validated)) {
            $pet->age = $validated['age'];
        }

        if (array_key_exists('gender', $validated)) {
            $pet->gender = $validated['gender'];
        }

        if (array_key_exists('weight', $validated)) {
            $pet->weight = $validated['weight'];
        }

        if (array_key_exists('notes', $validated) || array_key_exists('behaviour_notes', $validated)) {
            $pet->notes = $notesValue;
            $pet->behaviour_notes = $notesValue;
        }

        if (array_key_exists('last_vaccination_date', $validated)) {
            $pet->last_vaccination_date = $validated['last_vaccination_date'];
        }

        if (array_key_exists('vaccine_interval_days', $validated)) {
            $pet->vaccine_interval_days = $validated['vaccine_interval_days'];
        }

        if (array_key_exists('last_grooming_date', $validated)) {
            $pet->last_grooming_date = $validated['last_grooming_date'];
        }

        if (array_key_exists('grooming_interval_days', $validated)) {
            $pet->grooming_interval_days = $validated['grooming_interval_days'];
        }

        if (array_key_exists('eye_color', $validated)) {
            $pet->eye_color = $validated['eye_color'];
        }

        if (array_key_exists('fur_type', $validated)) {
            $pet->fur_type = $validated['fur_type'];
        }

        if (array_key_exists('markings', $validated)) {
            $pet->markings = $validated['markings'];
        }

        if (array_key_exists('health_conditions', $validated)) {
            $pet->health_conditions = $validated['health_conditions'];
        }

        if (array_key_exists('allergies', $validated)) {
            $pet->allergies = $validated['allergies'];
        }

        if (array_key_exists('vaccination_history', $validated)) {
            $pet->vaccination_history = $validated['vaccination_history'];
        }

        if (array_key_exists('microchip_number', $validated)) {
            $pet->microchip_number = $validated['microchip_number'];
        }

        if (array_key_exists('exercise_level', $validated)) {
            $pet->exercise_level = $validated['exercise_level'];
        }

        if (array_key_exists('activity_level', $validated)) {
            $pet->activity_level = $validated['activity_level'];
        }

        if (array_key_exists('diet', $validated) || array_key_exists('food_type', $validated)) {
            $pet->diet = $dietValue;
            $pet->food_type = $dietValue;
        }

        if (array_key_exists('personality_traits', $validated) || array_key_exists('temperament', $validated)) {
            $pet->personality_traits = $personalityValue;
            $pet->temperament = $personalityValue;
        }

        if (array_key_exists('vaccination_status', $validated)) {
            $pet->vaccination_status = $validated['vaccination_status'];
        }

        if (array_key_exists('last_vet_visit', $validated)) {
            $pet->last_vet_visit = $validated['last_vet_visit'];
        }

        if (array_key_exists('medical_notes', $validated)) {
            $pet->medical_notes = $validated['medical_notes'];
        }

        if (array_key_exists('feeding_schedule', $validated)) {
            $pet->feeding_schedule = $validated['feeding_schedule'];
        }

        if (array_key_exists('is_lost', $validated)) {
            $pet->is_lost = $validated['is_lost'];
        }

        if (array_key_exists('is_priority', $validated)) {
            $pet->is_priority = $validated['is_priority'];
        }

        if (array_key_exists('lost_status', $validated)) {
            $pet->lost_status = $validated['lost_status'];
        }

        if (array_key_exists('lost_description', $validated)) {
            $pet->lost_description = $validated['lost_description'];
        }

        if (array_key_exists('last_seen_location', $validated)) {
            $pet->last_seen_location = $validated['last_seen_location'];
        }

        if (array_key_exists('last_seen_lat', $validated)) {
            $pet->last_seen_lat = $validated['last_seen_lat'];
        }

        if (array_key_exists('last_seen_lng', $validated)) {
            $pet->last_seen_lng = $validated['last_seen_lng'];
        }

        if (array_key_exists('reported_lost_at', $validated)) {
            $pet->reported_lost_at = $validated['reported_lost_at'];
        }

        if (array_key_exists('resolved_at', $validated)) {
            $pet->resolved_at = $validated['resolved_at'];
        }

        if (array_key_exists('archived_at', $validated)) {
            $pet->archived_at = $validated['archived_at'];
        }

        $pet->save();

        $this->syncAutoReminders($pet);

        return response()->json([
            'message' => 'Pet updated successfully',
            'pet' => $this->formatPet($pet->load('reminders'), true),
        ], 200);
    }

    public function destroy(Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
            Storage::disk('public')->delete($pet->photo_path);
        }

        if ($pet->lost_photo_path && Storage::disk('public')->exists($pet->lost_photo_path)) {
            Storage::disk('public')->delete($pet->lost_photo_path);
        }

        Reminder::where('pet_id', $pet->id)->delete();

        $pet->delete();

        return response()->json([
            'message' => 'Pet deleted successfully'
        ], 200);
    }

    public function markMemorial(Request $request, Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'memorial_message' => 'nullable|string',
        ]);

        $pet->status = 'Memorial';
        $pet->memorial_message = $validated['memorial_message'] ?? null;
        $pet->save();

        return response()->json([
            'message' => 'Pet moved to Community Memorial successfully.',
            'pet' => $this->formatPet($pet),
        ], 200);
    }

    public function deleteMemorial(Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        if (($pet->status ?? null) !== 'Memorial') {
            return response()->json([
                'message' => 'This pet is not in the memorial section.'
            ], 422);
        }

        if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
            Storage::disk('public')->delete($pet->photo_path);
        }

        if ($pet->lost_photo_path && Storage::disk('public')->exists($pet->lost_photo_path)) {
            Storage::disk('public')->delete($pet->lost_photo_path);
        }

        Reminder::where('pet_id', $pet->id)->delete();
        $pet->delete();

        return response()->json([
            'message' => 'Memorial deleted successfully.'
        ], 200);
    }

    private function syncAutoReminders(Pet $pet): void
    {
        $this->syncVaccinationReminder($pet);
        $this->syncGroomingReminder($pet);
    }

    private function syncVaccinationReminder(Pet $pet): void
    {
        $dedupeKey = 'pet:' . $pet->id . ':vaccination';

        if (!$pet->last_vaccination_date || !$pet->vaccine_interval_days) {
            Reminder::where('dedupe_key', $dedupeKey)->delete();
            return;
        }

        $reminderDate = Carbon::parse($pet->last_vaccination_date)
            ->addDays((int) $pet->vaccine_interval_days)
            ->toDateString();

        Reminder::updateOrCreate(
            ['dedupe_key' => $dedupeKey],
            [
                'user_id' => $pet->user_id,
                'pet_id' => $pet->id,
                'type' => 'Vaccination',
                'title' => $pet->name . ' vaccination due',
                'message' => 'Vaccination reminder for ' . $pet->name . '.',
                'reminder_date' => $reminderDate,
                'status' => 'Pending',
                'notified_at' => null,
            ]
        );
    }

    private function syncGroomingReminder(Pet $pet): void
    {
        $dedupeKey = 'pet:' . $pet->id . ':grooming';

        if (!$pet->last_grooming_date || !$pet->grooming_interval_days) {
            Reminder::where('dedupe_key', $dedupeKey)->delete();
            return;
        }

        $reminderDate = Carbon::parse($pet->last_grooming_date)
            ->addDays((int) $pet->grooming_interval_days)
            ->toDateString();

        Reminder::updateOrCreate(
            ['dedupe_key' => $dedupeKey],
            [
                'user_id' => $pet->user_id,
                'pet_id' => $pet->id,
                'type' => 'Grooming',
                'title' => $pet->name . ' grooming due',
                'message' => 'Grooming reminder for ' . $pet->name . '.',
                'reminder_date' => $reminderDate,
                'status' => 'Pending',
                'notified_at' => null,
            ]
        );
    }

    private function formatPet(Pet $pet, bool $includeReminders = false): array
    {
        $photoUrl = $pet->photo_path ? asset('storage/' . $pet->photo_path) : null;
        $lostPhotoUrl = $pet->lost_photo_path ? asset('storage/' . $pet->lost_photo_path) : null;
        $displayPhotoUrl = $lostPhotoUrl ?: $photoUrl;

        $data = [
            'id' => $pet->id,
            'user_id' => $pet->user_id,
            'name' => $pet->name,
            'species' => $pet->species,
            'breed' => $pet->breed,
            'dob' => $pet->dob,
            'date_of_birth' => $pet->dob,
            'age' => $pet->age,
            'gender' => $pet->gender,
            'weight' => $pet->weight,
            'notes' => $pet->notes,

            'photo_path' => $pet->photo_path,
            'photo_url' => $photoUrl,
            'lost_photo_path' => $pet->lost_photo_path,
            'lost_photo_url' => $lostPhotoUrl,
            'display_photo_url' => $displayPhotoUrl,

            'last_vaccination_date' => $pet->last_vaccination_date,
            'vaccine_interval_days' => $pet->vaccine_interval_days,
            'last_grooming_date' => $pet->last_grooming_date,
            'grooming_interval_days' => $pet->grooming_interval_days,

            'eye_color' => $pet->eye_color,
            'fur_type' => $pet->fur_type,
            'markings' => $pet->markings,
            'health_conditions' => $pet->health_conditions,
            'allergies' => $pet->allergies,
            'vaccination_history' => $pet->vaccination_history,
            'microchip_number' => $pet->microchip_number,
            'exercise_level' => $pet->exercise_level,
            'activity_level' => $pet->activity_level,
            'diet' => $pet->diet ?: $pet->food_type,
            'personality_traits' => $pet->personality_traits ?: $pet->temperament,

            'vaccination_status' => $pet->vaccination_status,
            'last_vet_visit' => $pet->last_vet_visit,
            'medical_notes' => $pet->medical_notes,
            'food_type' => $pet->food_type,
            'feeding_schedule' => $pet->feeding_schedule,
            'temperament' => $pet->temperament,
            'behaviour_notes' => $pet->behaviour_notes,

            'status' => $pet->status,
            'memorial_message' => $pet->memorial_message,

            'is_lost' => $pet->is_lost,
            'is_priority' => $pet->is_priority,
            'lost_status' => $pet->lost_status,
            'lost_description' => $pet->lost_description,
            'last_seen_location' => $pet->last_seen_location,
            'last_seen_lat' => $pet->last_seen_lat,
            'last_seen_lng' => $pet->last_seen_lng,
            'reported_lost_at' => $pet->reported_lost_at,
            'resolved_at' => $pet->resolved_at,
            'archived_at' => $pet->archived_at,
        ];

        if ($includeReminders) {
            $data['reminders'] = $pet->relationLoaded('reminders') ? $pet->reminders : [];
        }

        return $data;
    }
}