<?php

namespace App\Http\Controllers;

use App\Models\Pet;
use Illuminate\Http\Request;

class PetHealthLogController extends Controller
{
    public function index(Request $request, Pet $pet)
    {
        if ((int) $pet->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $logs = $pet->healthLogs()
            ->latest('log_date')
            ->take(12)
            ->get()
            ->map(function ($log) {
                return [
                    'id' => $log->id,
                    'log_date' => optional($log->log_date)->toDateString(),
                    'weight' => $log->weight,
                    'activity_minutes' => $log->activity_minutes,
                    'appetite' => $log->appetite,
                    'note' => $log->note,
                ];
            })
            ->values();

        return response()->json($logs, 200);
    }

    public function store(Request $request, Pet $pet)
    {
        if ((int) $pet->user_id !== (int) $request->user()->id) {
            return response()->json([
                'message' => 'Unauthorized.',
            ], 403);
        }

        $validated = $request->validate([
            'log_date' => ['required', 'date'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'activity_minutes' => ['nullable', 'integer', 'min:0'],
            'appetite' => ['nullable', 'string', 'max:100'],
            'note' => ['nullable', 'string', 'max:500'],
        ]);

        $log = $pet->healthLogs()->create($validated);

        return response()->json([
            'message' => 'Health log added successfully.',
            'data' => [
                'id' => $log->id,
                'log_date' => optional($log->log_date)->toDateString(),
                'weight' => $log->weight,
                'activity_minutes' => $log->activity_minutes,
                'appetite' => $log->appetite,
                'note' => $log->note,
            ],
        ], 201);
    }
}