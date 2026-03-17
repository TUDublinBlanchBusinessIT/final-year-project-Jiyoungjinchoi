<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;

class LostPetController extends Controller
{
    /**
     * GET /api/lost-pets
     * Public list of active lost reports
     */
    public function index(Request $request)
    {
        $q = Pet::query()
            ->with('user:id,name')
            ->where('is_lost', true)
            ->whereNull('archived_at')
            ->where(function ($q2) {
                $q2->whereNull('lost_status')
                   ->orWhere('lost_status', '!=', 'Resolved');
            });

        if ($request->filled('species')) {
            $q->where('species', $request->string('species')->toString());
        }

        if ($request->filled('breed')) {
            $breed = $request->string('breed')->toString();
            $q->where('breed', 'like', "%{$breed}%");
        }

        if ($request->filled('location')) {
            $loc = $request->string('location')->toString();
            $q->where('last_seen_location', 'like', "%{$loc}%");
        }

        $lat = $request->input('lat');
        $lng = $request->input('lng');
        $radiusKm = $request->input('radius_km');
        $sort = $request->input('sort', 'date');

        $hasCoords = is_numeric($lat) && is_numeric($lng);

        if ($hasCoords) {
            $lat = (float) $lat;
            $lng = (float) $lng;

            $q->select('*')->selectRaw(
                "(6371 * acos(
                    cos(radians(?)) * cos(radians(last_seen_lat))
                    * cos(radians(last_seen_lng) - radians(?))
                    + sin(radians(?)) * sin(radians(last_seen_lat))
                )) as distance_km",
                [$lat, $lng, $lat]
            )
            ->whereNotNull('last_seen_lat')
            ->whereNotNull('last_seen_lng');

            if (is_numeric($radiusKm)) {
                $radiusKm = (float) $radiusKm;
                $q->having('distance_km', '<=', $radiusKm);
            }

            if ($sort === 'proximity') {
                $q->orderBy('distance_km', 'asc');
            } else {
                $q->orderByDesc('reported_lost_at');
            }
        } else {
            $q->orderByDesc('reported_lost_at');
        }

        $lostPets = $q->get()->map(fn ($pet) => $this->formatLostPet($pet));

        return response()->json($lostPets, 200);
    }

    /**
     * GET /api/lost-pets/{pet}
     * Public single lost report
     */
    public function show(Pet $pet)
    {
        if (!$pet->is_lost && !$pet->reported_lost_at) {
            return response()->json(['message' => 'Lost report not found.'], 404);
        }

        $pet->load('user:id,name');

        return response()->json($this->formatLostPet($pet), 200);
    }

    /**
     * POST /api/lost-pets
     * Mark an existing pet as lost
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'description' => ['required', 'string'],
            'last_seen_location' => ['required', 'string', 'max:255'],
            'photo' => ['nullable', 'image', 'max:4096'],
            'last_seen_lat' => ['nullable', 'numeric'],
            'last_seen_lng' => ['nullable', 'numeric'],
        ]);

        $user = $request->user();

        $pet = Pet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$pet) {
            return response()->json([
                'message' => 'Pet not found or you do not have permission to report it.',
            ], 403);
        }

        if ($pet->is_lost && $pet->lost_status !== 'Resolved' && !$pet->archived_at) {
            return response()->json([
                'message' => 'This pet already has an active lost report.',
                'data' => $this->formatLostPet($pet->load('user:id,name')),
            ], 422);
        }

        // Fallback to pet profile photo if no new photo uploaded
        $photoPath = $pet->lost_photo_path ?: $pet->photo_path;

        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('lostpets', 'public');
        }

        $pet->update([
            'is_lost' => true,
            'lost_status' => 'Active',
            'lost_description' => $validated['description'],
            'last_seen_location' => $validated['last_seen_location'],
            'last_seen_lat' => $validated['last_seen_lat'] ?? null,
            'last_seen_lng' => $validated['last_seen_lng'] ?? null,
            'lost_photo_path' => $photoPath,
            'reported_lost_at' => now(),
            'resolved_at' => null,
            'archived_at' => null,
        ]);

        $pet->load('user:id,name');

        return response()->json($this->formatLostPet($pet), 201);
    }

    /**
     * PATCH /api/lost-pets/{pet}/resolve
     */
    public function resolve(Request $request, Pet $pet)
    {
        $user = $request->user();

        if ((int) $pet->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$pet->is_lost) {
            return response()->json(['message' => 'This pet is not marked as lost.'], 400);
        }

        if ($pet->lost_status === 'Resolved' || $pet->archived_at) {
            return response()->json([
                'message' => 'This report is already resolved.',
                'data' => $this->formatLostPet($pet->load('user:id,name')),
            ], 200);
        }

        $pet->lost_status = 'Resolved';
        $pet->resolved_at = now();
        $pet->archived_at = now();
        $pet->save();

        $pet->load('user:id,name');

        return response()->json([
            'message' => 'Lost pet report marked as Resolved.',
            'data' => $this->formatLostPet($pet),
        ], 200);
    }

    private function formatLostPet(Pet $pet): array
    {
        $photoUrl = null;

        if ($pet->lost_photo_path) {
            $photoUrl = asset('storage/' . $pet->lost_photo_path);
        } elseif ($pet->photo_path) {
            $photoUrl = asset('storage/' . $pet->photo_path);
        }

        return [
            'id' => $pet->id,
            'pet_name' => $pet->name,
            'status' => $pet->lost_status ?: 'Active',
            'description' => $pet->lost_description,
            'last_seen_location' => $pet->last_seen_location,
            'reported_lost_at' => $pet->reported_lost_at,
            'species' => $pet->species,
            'breed' => $pet->breed,
            'age' => $pet->age,
            'gender' => $pet->gender,
            'owner_name' => optional($pet->user)->name,
            'last_seen_lat' => $pet->last_seen_lat,
            'last_seen_lng' => $pet->last_seen_lng,
            'distance_km' => isset($pet->distance_km) ? round((float) $pet->distance_km, 2) : null,
            'resolved_at' => $pet->resolved_at,
            'archived_at' => $pet->archived_at,
            'photo_url' => $photoUrl,
        ];
    }
}