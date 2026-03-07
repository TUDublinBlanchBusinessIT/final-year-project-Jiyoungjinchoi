<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class PetController extends Controller
{
    public function index()
    {
        return response()->json(Auth::user()->pets, 200);
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

        return response()->json($pet, 200);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'age' => 'required|integer|min:0',
            'gender' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'vaccination_status' => 'nullable|string|max:255',
            'last_vet_visit' => 'nullable|date',
            'medical_notes' => 'nullable|string',
            'food_type' => 'nullable|string|max:255',
            'feeding_schedule' => 'nullable|string|max:255',
            'allergies' => 'nullable|string|max:255',
            'temperament' => 'nullable|string|max:255',
            'behaviour_notes' => 'nullable|string',
        ]);

        $photoPath = null;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('pets', 'public');
        }

        $pet = Pet::create([
            'user_id' => Auth::id(),
            'name' => $validated['name'],
            'species' => $validated['species'],
            'breed' => $validated['breed'] ?? null,
            'dob' => $validated['dob'] ?? null,
            'age' => $validated['age'],
            'gender' => $validated['gender'] ?? null,
            'weight' => $validated['weight'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'photo_path' => $photoPath,

            'vaccination_status' => $validated['vaccination_status'] ?? null,
            'last_vet_visit' => $validated['last_vet_visit'] ?? null,
            'medical_notes' => $validated['medical_notes'] ?? null,
            'food_type' => $validated['food_type'] ?? null,
            'feeding_schedule' => $validated['feeding_schedule'] ?? null,
            'allergies' => $validated['allergies'] ?? null,
            'temperament' => $validated['temperament'] ?? null,
            'behaviour_notes' => $validated['behaviour_notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Pet created successfully',
            'pet' => $pet
        ], 201);
    }

    public function update(Request $request, Pet $pet)
    {
        if ($pet->user_id !== Auth::id()) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'species' => 'required|string|max:255',
            'breed' => 'nullable|string|max:255',
            'dob' => 'nullable|date',
            'age' => 'required|integer|min:0',
            'gender' => 'nullable|string|max:50',
            'weight' => 'nullable|numeric|min:0',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:2048',

            'vaccination_status' => 'nullable|string|max:255',
            'last_vet_visit' => 'nullable|date',
            'medical_notes' => 'nullable|string',
            'food_type' => 'nullable|string|max:255',
            'feeding_schedule' => 'nullable|string|max:255',
            'allergies' => 'nullable|string|max:255',
            'temperament' => 'nullable|string|max:255',
            'behaviour_notes' => 'nullable|string',
        ]);

        if ($request->hasFile('photo')) {
            if ($pet->photo_path && Storage::disk('public')->exists($pet->photo_path)) {
                Storage::disk('public')->delete($pet->photo_path);
            }

            $pet->photo_path = $request->file('photo')->store('pets', 'public');
        }

        $pet->name = $validated['name'];
        $pet->species = $validated['species'];
        $pet->breed = $validated['breed'] ?? null;
        $pet->dob = $validated['dob'] ?? null;
        $pet->age = $validated['age'];
        $pet->gender = $validated['gender'] ?? null;
        $pet->weight = $validated['weight'] ?? null;
        $pet->notes = $validated['notes'] ?? null;

        $pet->vaccination_status = $validated['vaccination_status'] ?? null;
        $pet->last_vet_visit = $validated['last_vet_visit'] ?? null;
        $pet->medical_notes = $validated['medical_notes'] ?? null;
        $pet->food_type = $validated['food_type'] ?? null;
        $pet->feeding_schedule = $validated['feeding_schedule'] ?? null;
        $pet->allergies = $validated['allergies'] ?? null;
        $pet->temperament = $validated['temperament'] ?? null;
        $pet->behaviour_notes = $validated['behaviour_notes'] ?? null;

        $pet->save();

        return response()->json([
            'message' => 'Pet updated successfully',
            'pet' => $pet
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

        $pet->delete();

        return response()->json([
            'message' => 'Pet deleted successfully'
        ], 200);
    }
}