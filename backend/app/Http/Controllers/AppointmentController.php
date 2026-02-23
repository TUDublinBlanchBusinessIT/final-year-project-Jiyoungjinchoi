<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Pet;
use App\Models\Provider;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Validation\Rule;

class AppointmentController extends Controller
{
    public function index(Request $request)
    {
        $appointments = Appointment::with(['pet', 'provider'])
            ->where('user_id', $request->user()->id)
            ->orderBy('appointment_at', 'asc')
            ->get();

        return response()->json([
            'data' => $appointments,
        ]);
    }

    // For React dropdowns
    public function options(Request $request)
    {
        $pets = Pet::where('user_id', $request->user()->id)
            ->orderBy('name')
            ->get(['id', 'name']);

        return response()->json([
            'data' => [
                'pets' => $pets,
                'service_types' => ['vet', 'groomer'],
            ],
        ]);
    }

    /**
     * Manual booking:
     * - provider_id is optional
     * - address is required for manual booking
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', Rule::exists('pets', 'id')],
            'service_type' => ['required', Rule::in(['vet', 'groomer'])],
            'address' => ['required', 'string', 'max:255'],
            'appointment_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],

            // optional now
            'provider_id' => ['nullable', 'integer', Rule::exists('providers', 'id')],
        ]);

        $user = $request->user();

        $pet = Pet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $appointmentAt = Carbon::parse($validated['appointment_at']);

        if ($appointmentAt->isPast()) {
            return response()->json(['message' => 'Please choose a future date/time.'], 422);
        }

        // If provider_id exists, verify type matches
        $providerId = $validated['provider_id'] ?? null;

        if ($providerId) {
            $provider = Provider::findOrFail($providerId);
            if ($provider->type !== $validated['service_type']) {
                return response()->json(['message' => 'Provider does not match service type.'], 422);
            }
        }

        // For manual booking: just create (no provider conflict validation)
        $appointment = Appointment::create([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
            'provider_id' => $providerId,
            'service_type' => $validated['service_type'],
            'address' => $validated['address'],
            'appointment_at' => $appointmentAt,
            'reminder_at' => $appointmentAt->copy()->subHours(24),
            'status' => 'confirmed',
            'notes' => $validated['notes'] ?? null,
        ]);

        $appointment->load(['pet', 'provider']);

        return response()->json([
            'message' => 'Appointment created.',
            'data' => $appointment,
        ], 201);
    }

    public function update(Request $request, Appointment $appointment)
    {
        $this->authorizeOwner($request, $appointment);

        $validated = $request->validate([
            'service_type' => ['required', Rule::in(['vet', 'groomer'])],
            'address' => ['required', 'string', 'max:255'],
            'appointment_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
        ]);

        $newAt = Carbon::parse($validated['appointment_at']);
        if ($newAt->isPast()) {
            return response()->json(['message' => 'Please choose a future date/time.'], 422);
        }

        $appointment->update([
            'service_type' => $validated['service_type'],
            'address' => $validated['address'],
            'appointment_at' => $newAt,
            'reminder_at' => $newAt->copy()->subHours(24),
            'status' => 'rescheduled',
            'notes' => $validated['notes'] ?? $appointment->notes,
        ]);

        $appointment->load(['pet', 'provider']);

        return response()->json([
            'message' => 'Appointment updated.',
            'data' => $appointment,
        ]);
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        $this->authorizeOwner($request, $appointment);

        // inventory-style delete: real delete
        $appointment->delete();

        return response()->json([
            'message' => 'Appointment deleted.',
        ]);
    }

    public function show(Request $request, Appointment $appointment)
    {
        $this->authorizeOwner($request, $appointment);

        $appointment->load(['pet', 'provider']);

        return response()->json(['data' => $appointment]);
    }

    private function authorizeOwner(Request $request, Appointment $appointment): void
    {
        if ($appointment->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }
    }
}