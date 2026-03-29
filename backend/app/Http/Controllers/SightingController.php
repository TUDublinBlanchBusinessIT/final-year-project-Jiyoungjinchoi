<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sighting;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class SightingController extends Controller
{
    public function index($pet)
    {
        $sightings = Sighting::where('pet_id', $pet)
            ->latest()
            ->get()
            ->map(function ($sighting) {
                return [
                    'id' => $sighting->id,
                    'pet_id' => $sighting->pet_id,
                    'location' => $sighting->location,
                    'lat' => $sighting->lat !== null ? (float) $sighting->lat : null,
                    'lng' => $sighting->lng !== null ? (float) $sighting->lng : null,
                    'notes' => $sighting->notes,
                    'photo_path' => $sighting->photo_path,
                    'photo_url' => $this->makeImageUrl($sighting->photo_path),
                    'reported_by' => $sighting->reported_by,
                    'owner_notified_at' => optional($sighting->owner_notified_at)?->format('Y-m-d H:i:s'),
                    'created_at' => optional($sighting->created_at)?->format('Y-m-d H:i:s'),
                ];
            })
            ->values();

        return response()->json([
            'data' => $sightings,
        ]);
    }

    public function store(Request $request, $pet)
    {
        $validated = $request->validate([
            'sighting_location' => ['required', 'string', 'max:255'],
            'lat' => ['nullable', 'numeric'],
            'lng' => ['nullable', 'numeric'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $petModel = Pet::findOrFail($pet);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('sightings', 'public');
        }

        $sighting = Sighting::create([
            'pet_id' => $petModel->id,
            'reported_by' => Auth::id(),
            'location' => $validated['sighting_location'],
            'lat' => $validated['lat'] ?? null,
            'lng' => $validated['lng'] ?? null,
            'notes' => $validated['notes'] ?? null,
            'photo_path' => $photoPath,
            'owner_notified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Sighting submitted successfully.',
            'data' => [
                'id' => $sighting->id,
                'pet_id' => $sighting->pet_id,
                'location' => $sighting->location,
                'lat' => $sighting->lat !== null ? (float) $sighting->lat : null,
                'lng' => $sighting->lng !== null ? (float) $sighting->lng : null,
                'notes' => $sighting->notes,
                'photo_path' => $sighting->photo_path,
                'photo_url' => $this->makeImageUrl($sighting->photo_path),
                'reported_by' => $sighting->reported_by,
                'owner_notified_at' => optional($sighting->owner_notified_at)?->format('Y-m-d H:i:s'),
                'created_at' => optional($sighting->created_at)?->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    private function makeImageUrl($path)
    {
        if (!$path) {
            return null;
        }

        if (str_starts_with($path, 'http://') || str_starts_with($path, 'https://')) {
            return $path;
        }

        if (str_starts_with($path, '/storage/')) {
            return asset(ltrim($path, '/'));
        }

        return asset('storage/' . ltrim($path, '/'));
    }
}