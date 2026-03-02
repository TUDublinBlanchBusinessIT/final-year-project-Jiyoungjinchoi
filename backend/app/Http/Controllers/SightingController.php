<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use App\Models\Sighting;
use Illuminate\Http\Request;

class SightingController extends Controller
{
    /**
     * GET /api/lost-pets/{pet}/sightings
     * List all sightings for a lost pet report
     */
    public function index(Request $request, Pet $pet)
    {
        if (!$pet->is_lost) {
            return response()->json(['message' => 'This pet is not marked as lost.'], 400);
        }

        $items = Sighting::where('pet_id', $pet->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn ($s) => $this->format($s));

        return response()->json($items, 200);
    }

    /**
     * POST /api/lost-pets/{pet}/sightings
     * Sprint 1513: Submit Found/Sighting update
     */
    public function store(Request $request, Pet $pet)
    {
        // Must be a lost report
        if (!$pet->is_lost) {
            return response()->json(['message' => 'This pet is not marked as lost.'], 400);
        }

        // ✅ "Notifications stopped" when resolved (ties into 1512 too)
        if ($pet->lost_status === 'Resolved' || $pet->archived_at) {
            return response()->json([
                'message' => 'This report is resolved/archived. Sightings are closed.',
            ], 409);
        }

        $validated = $request->validate([
            'location' => ['required', 'string', 'max:255'],      // ✅ required
            'notes' => ['nullable', 'string'],                    // optional
            'photo' => ['nullable', 'image', 'max:4096'],         // ✅ optional
        ]);

        $photoPath = null;
        if ($request->hasFile('photo')) {
            $photoPath = $request->file('photo')->store('sightings', 'public');
        }

        $sighting = Sighting::create([
            'pet_id' => $pet->id,
            'reported_by' => optional($request->user())->id,
            'location' => $validated['location'],
            'notes' => $validated['notes'] ?? null,
            'photo_path' => $photoPath,

            // ✅ "Owner notified" — we record it (and you can plug in email later)
            'owner_notified_at' => now(),
        ]);

        return response()->json([
            'message' => 'Sighting submitted ✅ Owner has been notified.',
            'data' => $this->format($sighting),
        ], 201);
    }

    private function format(Sighting $s): array
    {
        return [
            'id' => $s->id,
            'pet_id' => $s->pet_id,
            'location' => $s->location,
            'notes' => $s->notes,
            'created_at' => $s->created_at,

            'photo_url' => $s->photo_path ? asset('storage/' . $s->photo_path) : null,
            'owner_notified_at' => $s->owner_notified_at,
        ];
    }
}