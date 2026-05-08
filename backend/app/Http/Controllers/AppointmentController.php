<?php

namespace App\Http\Controllers;

use App\Models\Appointment;
use App\Models\Pet;
use App\Models\Provider;
use App\Models\Reminder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;
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
     * - appointment reminder is automatically created
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', Rule::exists('pets', 'id')],
            'service_type' => ['required', Rule::in(['vet', 'groomer'])],
            'address' => ['required', 'string', 'max:255'],
            'appointment_at' => ['required', 'date'],
            'notes' => ['nullable', 'string', 'max:1000'],
            'provider_id' => ['nullable', 'integer', Rule::exists('providers', 'id')],
        ]);

        $user = $request->user();

        $pet = Pet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->firstOrFail();

        $appointmentAt = Carbon::parse($validated['appointment_at']);

        if ($appointmentAt->isPast()) {
            return response()->json([
                'message' => 'Please choose a future date/time.',
            ], 422);
        }

        $providerId = $validated['provider_id'] ?? null;
        $provider = null;

        if ($providerId) {
            $provider = Provider::findOrFail($providerId);

            if ($provider->type !== $validated['service_type']) {
                return response()->json([
                    'message' => 'Provider does not match service type.',
                ], 422);
            }
        }

        $appointment = DB::transaction(function () use (
            $user,
            $pet,
            $providerId,
            $provider,
            $validated,
            $appointmentAt
        ) {
            $appointment = Appointment::create([
                'user_id' => $user->id,
                'pet_id' => $pet->id,
                'provider_id' => $providerId,
                'service_type' => $validated['service_type'],
                'address' => $validated['address'],
                'appointment_at' => $appointmentAt,
                'reminder_at' => $this->calculateAppointmentReminderDate($appointmentAt),
                'status' => 'confirmed',
                'notes' => $validated['notes'] ?? null,
            ]);

            $this->createOrUpdateAppointmentReminder(
                userId: $user->id,
                pet: $pet,
                appointment: $appointment,
                appointmentAt: $appointmentAt,
                serviceType: $validated['service_type'],
                address: $validated['address'],
                provider: $provider
            );

            return $appointment;
        });

        $appointment->load(['pet', 'provider']);

        return response()->json([
            'message' => 'Appointment created and reminder added.',
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

        $user = $request->user();

        $pet = Pet::where('id', $appointment->pet_id)
            ->where('user_id', $user->id)
            ->firstOrFail();

        $newAt = Carbon::parse($validated['appointment_at']);

        if ($newAt->isPast()) {
            return response()->json([
                'message' => 'Please choose a future date/time.',
            ], 422);
        }

        DB::transaction(function () use ($appointment, $validated, $newAt, $user, $pet) {
            $appointment->update([
                'service_type' => $validated['service_type'],
                'address' => $validated['address'],
                'appointment_at' => $newAt,
                'reminder_at' => $this->calculateAppointmentReminderDate($newAt),
                'status' => 'rescheduled',
                'notes' => $validated['notes'] ?? $appointment->notes,
            ]);

            $appointment->refresh();
            $appointment->load('provider');

            $this->createOrUpdateAppointmentReminder(
                userId: $user->id,
                pet: $pet,
                appointment: $appointment,
                appointmentAt: $newAt,
                serviceType: $validated['service_type'],
                address: $validated['address'],
                provider: $appointment->provider
            );
        });

        $appointment->load(['pet', 'provider']);

        return response()->json([
            'message' => 'Appointment updated and reminder updated.',
            'data' => $appointment,
        ]);
    }

    public function destroy(Request $request, Appointment $appointment)
    {
        $this->authorizeOwner($request, $appointment);

        DB::transaction(function () use ($appointment) {
            Reminder::where('appointment_id', $appointment->id)
                ->orWhere('dedupe_key', 'appointment_' . $appointment->id)
                ->delete();

            $appointment->delete();
        });

        return response()->json([
            'message' => 'Appointment deleted and related reminder removed.',
        ]);
    }

    public function show(Request $request, Appointment $appointment)
    {
        $this->authorizeOwner($request, $appointment);

        $appointment->load(['pet', 'provider']);

        return response()->json([
            'data' => $appointment,
        ]);
    }

    private function authorizeOwner(Request $request, Appointment $appointment): void
    {
        if ($appointment->user_id !== $request->user()->id) {
            abort(403, 'Forbidden');
        }
    }

    private function createOrUpdateAppointmentReminder(
        int $userId,
        Pet $pet,
        Appointment $appointment,
        Carbon $appointmentAt,
        string $serviceType,
        string $address,
        ?Provider $provider = null
    ): void {
        $serviceLabel = $this->serviceLabel($serviceType);
        $providerName = $provider?->name;
        $dedupeKey = 'appointment_' . $appointment->id;

        $title = $serviceLabel . ' appointment for ' . $pet->name;

        $message = $providerName
            ? 'You have a ' . strtolower($serviceLabel) . ' appointment for ' . $pet->name . ' with ' . $providerName . ' at ' . $address . ' on ' . $appointmentAt->format('d M Y \a\t H:i') . '.'
            : 'You have a ' . strtolower($serviceLabel) . ' appointment for ' . $pet->name . ' at ' . $address . ' on ' . $appointmentAt->format('d M Y \a\t H:i') . '.';

        Reminder::updateOrCreate(
            [
                'dedupe_key' => $dedupeKey,
            ],
            [
                'user_id' => $userId,
                'pet_id' => $pet->id,
                'appointment_id' => $appointment->id,
                'type' => 'appointment',
                'title' => $title,
                'message' => $message,
                'reminder_date' => $this->calculateAppointmentReminderDate($appointmentAt),
                'status' => 'pending',
                'dedupe_key' => $dedupeKey,
                'notified_at' => null,
            ]
        );
    }

    private function calculateAppointmentReminderDate(Carbon $appointmentAt): Carbon
    {
        $reminderAt = $appointmentAt->copy()->subHours(24);

        if ($reminderAt->isPast()) {
            return now();
        }

        return $reminderAt;
    }

    private function serviceLabel(string $serviceType): string
    {
        return match ($serviceType) {
            'vet' => 'Vet',
            'groomer' => 'Grooming',
            default => ucfirst($serviceType),
        };
    }
}