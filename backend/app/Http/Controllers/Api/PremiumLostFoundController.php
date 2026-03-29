<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\FoundReport;
use App\Models\LostPet;
use App\Models\Sighting;
use Illuminate\Http\Request;

class PremiumLostFoundController extends Controller
{
    public function index(Request $request)
    {
        $lostPets = LostPet::query()
            ->where('is_lost', true)
            ->latest()
            ->get()
            ->map(function ($pet) {
                $lostPhotoUrl = $this->makeImageUrl($pet->lost_photo_path ?? null);
                $profilePhotoUrl = $this->makeImageUrl($pet->photo_path ?? null);

                return [
                    'id' => $pet->id,
                    'pet_id' => $pet->id,
                    'type' => 'lost',
                    'priority' => (bool) ($pet->is_priority ?? false),

                    'name' => $pet->name ?? 'Unknown Pet',
                    'pet_name' => $pet->name ?? 'Unknown Pet',
                    'species' => $pet->species ?? 'Unknown',
                    'breed' => $pet->breed ?? 'Unknown',

                    'area' => $pet->last_seen_location ?? 'Unknown area',
                    'location' => $pet->last_seen_location ?? 'Unknown area',
                    'last_seen_location' => $pet->last_seen_location ?? 'Unknown area',
                    'description' => $pet->lost_description ?? '',
                    'notes' => $pet->lost_description ?? '',

                    'lat' => $pet->last_seen_lat !== null ? (float) $pet->last_seen_lat : null,
                    'lng' => $pet->last_seen_lng !== null ? (float) $pet->last_seen_lng : null,

                    'lostDate' => optional($pet->reported_lost_at)?->format('Y-m-d'),
                    'reported_at' => optional($pet->reported_lost_at)?->format('Y-m-d H:i:s'),
                    'created_at' => optional($pet->created_at)?->format('Y-m-d H:i:s'),

                    'photo_path' => $pet->photo_path ?? null,
                    'photo_url' => $profilePhotoUrl,

                    'lost_photo_path' => $pet->lost_photo_path ?? null,
                    'lost_photo_url' => $lostPhotoUrl,

                    'display_photo_url' => $lostPhotoUrl ?: $profilePhotoUrl,

                    'status' => strtolower((string) ($pet->lost_status ?? '')) === 'resolved'
                        ? 'Resolved'
                        : 'Missing Pet',
                ];
            });

        $foundReports = FoundReport::query()
            ->latest()
            ->get()
            ->map(function ($report) {
                $foundImageUrl = $this->makeImageUrl($report->photo_path ?? null);

                return [
                    'id' => $report->id,
                    'pet_id' => null,
                    'type' => 'found',
                    'priority' => false,

                    'name' => $report->breed ? 'Found ' . $report->breed : 'Found Pet',
                    'pet_name' => $report->breed ? 'Found ' . $report->breed : 'Found Pet',
                    'species' => $report->species ?? 'Unknown',
                    'breed' => $report->breed ?? 'Unknown',

                    'area' => $report->location_found ?? 'Unknown area',
                    'location' => $report->location_found ?? 'Unknown area',
                    'last_seen_location' => $report->location_found ?? 'Unknown area',
                    'description' => $report->description ?? '',
                    'notes' => $report->notes ?? '',

                    'lat' => null,
                    'lng' => null,

                    'lostDate' => optional($report->found_at)?->format('Y-m-d'),
                    'reported_at' => optional($report->found_at)?->format('Y-m-d H:i:s'),
                    'created_at' => optional($report->created_at)?->format('Y-m-d H:i:s'),

                    'photo_path' => $report->photo_path ?? null,
                    'photo_url' => $foundImageUrl,
                    'lost_photo_path' => null,
                    'lost_photo_url' => null,
                    'display_photo_url' => $foundImageUrl,

                    'status' => 'Found Report',
                    'owner_name' => $report->reporter_name ?? 'Unknown reporter',
                ];
            });

        $sightings = Sighting::with(['pet', 'reporter'])
            ->latest()
            ->get()
            ->map(function ($sighting) {
                $sightingImageUrl = $this->makeImageUrl($sighting->photo_path ?? null);

                $fallbackLat = optional($sighting->pet)->last_seen_lat;
                $fallbackLng = optional($sighting->pet)->last_seen_lng;

                return [
                    'id' => $sighting->id,
                    'pet_id' => $sighting->pet_id,
                    'type' => 'sighting',
                    'priority' => false,

                    'name' => optional($sighting->pet)->name ?? 'Pet Sighting',
                    'pet_name' => optional($sighting->pet)->name ?? 'Pet Sighting',
                    'species' => optional($sighting->pet)->species ?? 'Unknown',
                    'breed' => optional($sighting->pet)->breed ?? 'Unknown',

                    'area' => $sighting->location ?? 'Unknown area',
                    'location' => $sighting->location ?? 'Unknown area',
                    'last_seen_location' => $sighting->location ?? 'Unknown area',
                    'description' => $sighting->notes ?? '',
                    'notes' => $sighting->notes ?? '',

                    'lat' => $sighting->lat !== null
                        ? (float) $sighting->lat
                        : ($fallbackLat !== null ? (float) $fallbackLat : null),

                    'lng' => $sighting->lng !== null
                        ? (float) $sighting->lng
                        : ($fallbackLng !== null ? (float) $fallbackLng : null),

                    'lostDate' => optional($sighting->created_at)?->format('Y-m-d'),
                    'reported_at' => optional($sighting->created_at)?->format('Y-m-d H:i:s'),
                    'created_at' => optional($sighting->created_at)?->format('Y-m-d H:i:s'),

                    'photo_path' => $sighting->photo_path ?? null,
                    'photo_url' => $sightingImageUrl,
                    'lost_photo_path' => null,
                    'lost_photo_url' => null,
                    'display_photo_url' => $sightingImageUrl,

                    'status' => 'Sighting',
                    'owner_name' => optional($sighting->reporter)->name ?? 'Unknown owner',
                ];
            });

        $reports = $lostPets
            ->concat($foundReports)
            ->concat($sightings)
            ->values();

        return response()->json([
            'reports' => $reports,
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'last_seen_location' => ['required', 'string', 'max:255'],
            'description' => ['required', 'string', 'max:1000'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:4096'],
        ]);

        $user = $request->user();

        $pet = LostPet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $photoPath = $pet->lost_photo_path;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('lost_pets', 'public');
        }

        $pet->update([
            'is_lost' => true,
            'lost_status' => 'missing',
            'last_seen_location' => $validated['last_seen_location'],
            'lost_description' => $validated['description'],
            'lost_photo_path' => $photoPath,
            'reported_lost_at' => now(),
            'is_priority' => false,
        ]);

        return response()->json([
            'message' => 'Lost pet report created successfully.',
            'data' => [
                'id' => $pet->id,
                'name' => $pet->name,
                'species' => $pet->species,
                'breed' => $pet->breed,
                'last_seen_location' => $pet->last_seen_location,
                'description' => $pet->lost_description,
                'photo_url' => $this->makeImageUrl($pet->photo_path),
                'lost_photo_url' => $this->makeImageUrl($pet->lost_photo_path),
                'display_photo_url' => $this->makeImageUrl($pet->lost_photo_path) ?: $this->makeImageUrl($pet->photo_path),
                'status' => 'Missing Pet',
                'reported_at' => optional($pet->reported_lost_at)?->format('Y-m-d H:i:s'),
            ],
        ], 201);
    }

    public function show($id)
    {
        $pet = LostPet::find($id);

        if (!$pet) {
            return response()->json([
                'message' => 'Report not found.'
            ], 404);
        }

        $lostPhotoUrl = $this->makeImageUrl($pet->lost_photo_path ?? null);
        $profilePhotoUrl = $this->makeImageUrl($pet->photo_path ?? null);

        return response()->json([
            'data' => [
                'id' => $pet->id,
                'type' => 'lost',
                'priority' => (bool) ($pet->is_priority ?? false),

                'name' => $pet->name ?? 'Unknown Pet',
                'pet_name' => $pet->name ?? 'Unknown Pet',
                'species' => $pet->species ?? 'Unknown',
                'breed' => $pet->breed ?? 'Unknown',

                'owner_name' => $pet->owner_name ?? 'N/A',

                'area' => $pet->last_seen_location ?? 'Unknown area',
                'location' => $pet->last_seen_location ?? 'Unknown area',
                'last_seen_location' => $pet->last_seen_location ?? 'Unknown area',
                'description' => $pet->lost_description ?? 'No description provided.',
                'notes' => $pet->lost_description ?? 'No description provided.',

                'lat' => $pet->last_seen_lat !== null ? (float) $pet->last_seen_lat : null,
                'lng' => $pet->last_seen_lng !== null ? (float) $pet->last_seen_lng : null,

                'lostDate' => optional($pet->reported_lost_at)?->format('Y-m-d'),
                'reported_at' => optional($pet->reported_lost_at)?->format('Y-m-d H:i:s'),
                'created_at' => optional($pet->created_at)?->format('Y-m-d H:i:s'),

                'photo_path' => $pet->photo_path ?? null,
                'photo_url' => $profilePhotoUrl,

                'lost_photo_path' => $pet->lost_photo_path ?? null,
                'lost_photo_url' => $lostPhotoUrl,

                'display_photo_url' => $lostPhotoUrl ?: $profilePhotoUrl,

                'status' => strtolower((string) ($pet->lost_status ?? '')) === 'resolved'
                    ? 'Resolved'
                    : 'Missing Pet',
            ]
        ]);
    }

    public function resolve($id)
    {
        $pet = LostPet::find($id);

        if (!$pet) {
            return response()->json([
                'message' => 'Report not found.'
            ], 404);
        }

        $pet->is_lost = false;
        $pet->lost_status = 'resolved';
        $pet->resolved_at = now();
        $pet->save();

        return response()->json([
            'message' => 'Report marked as resolved.',
            'data' => [
                'id' => $pet->id,
                'status' => 'Resolved',
                'is_lost' => false,
            ]
        ]);
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