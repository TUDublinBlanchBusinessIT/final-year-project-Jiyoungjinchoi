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

        if ($request->hasFile('photo')) {
            if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
                Storage::disk('public')->delete($pet->photo_path);
            }

            $pet->photo_path = $request->file('photo')->store('pets', 'public');
        }

        $dietValue = $validated['diet'] ?? ($validated['food_type'] ?? null);
        $personalityValue = $validated['personality_traits'] ?? ($validated['temperament'] ?? null);
        $notesValue = $validated['notes'] ?? ($validated['behaviour_notes'] ?? null);

        $pet->name = $validated['name'];
        $pet->species = $validated['species'];
        $pet->breed = $validated['breed'] ?? null;
        $pet->dob = $validated['dob'] ?? ($validated['date_of_birth'] ?? null);
        $pet->age = $validated['age'];
        $pet->gender = $validated['gender'] ?? null;
        $pet->weight = $validated['weight'] ?? null;
        $pet->notes = $notesValue;

        $pet->last_vaccination_date = $validated['last_vaccination_date'] ?? null;
        $pet->vaccine_interval_days = $validated['vaccine_interval_days'] ?? null;
        $pet->last_grooming_date = $validated['last_grooming_date'] ?? null;
        $pet->grooming_interval_days = $validated['grooming_interval_days'] ?? null;

        $pet->eye_color = $validated['eye_color'] ?? null;
        $pet->fur_type = $validated['fur_type'] ?? null;
        $pet->markings = $validated['markings'] ?? null;
        $pet->health_conditions = $validated['health_conditions'] ?? null;
        $pet->allergies = $validated['allergies'] ?? null;
        $pet->vaccination_history = $validated['vaccination_history'] ?? null;
        $pet->microchip_number = $validated['microchip_number'] ?? null;
        $pet->exercise_level = $validated['exercise_level'] ?? null;
        $pet->activity_level = $validated['activity_level'] ?? null;
        $pet->diet = $dietValue;
        $pet->personality_traits = $personalityValue;

        $pet->vaccination_status = $validated['vaccination_status'] ?? null;
        $pet->last_vet_visit = $validated['last_vet_visit'] ?? null;
        $pet->medical_notes = $validated['medical_notes'] ?? null;
        $pet->food_type = $dietValue;
        $pet->feeding_schedule = $validated['feeding_schedule'] ?? null;
        $pet->temperament = $personalityValue;
        $pet->behaviour_notes = $notesValue;

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

        Reminder::where('pet_id', $pet->id)->delete();

        $pet->delete();

        return response()->json([
            'message' => 'Pet deleted successfully'
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
            'photo_url' => $pet->photo_path ? asset('storage/' . $pet->photo_path) : null,

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
        ];

        if ($includeReminders) {
            $data['reminders'] = $pet->relationLoaded('reminders') ? $pet->reminders : [];
        }

        return $data;
    }
}