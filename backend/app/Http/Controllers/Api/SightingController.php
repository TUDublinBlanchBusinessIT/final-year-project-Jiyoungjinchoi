<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sighting;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SightingController extends Controller
{
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => 'required|integer|exists:pets,id',
            'location' => 'required|string|max:255',
            'notes' => 'nullable|string',
            'photo' => 'nullable|image|mimes:jpg,jpeg,png,webp|max:4096',
        ]);

        $pet = Pet::findOrFail($validated['pet_id']);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('sightings', 'public');
        }

        $sighting = Sighting::create([
            'pet_id' => $pet->id,
            'reported_by' => Auth::id(),
            'location' => $validated['location'],
            'notes' => $validated['notes'] ?? null,
            'photo_path' => $photoPath,
            'owner_notified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Sighting submitted successfully.',
            'sighting' => $sighting,
        ], 201);
    }
}