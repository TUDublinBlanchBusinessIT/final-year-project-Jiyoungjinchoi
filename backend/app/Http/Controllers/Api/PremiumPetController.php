<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\PetHealthLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PremiumPetController extends Controller
{
    public function healthLogs(Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        return response()->json(
            $pet->healthLogs()->orderBy('log_date')->get()
        );
    }

    public function storeHealthLog(Request $request, Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'log_date' => ['required', 'date'],
            'weight' => ['nullable', 'numeric', 'min:0'],
            'activity_minutes' => ['nullable', 'integer', 'min:0'],
            'appetite' => ['nullable', 'string', 'max:255'],
            'note' => ['nullable', 'string', 'max:2000'],
        ]);

        $healthLog = PetHealthLog::create([
            'pet_id' => $pet->id,
            'log_date' => $validated['log_date'],
            'weight' => $validated['weight'] ?? null,
            'activity_minutes' => $validated['activity_minutes'] ?? null,
            'appetite' => $validated['appetite'] ?? null,
            'note' => $validated['note'] ?? null,
        ]);

        return response()->json([
            'message' => 'Health log created successfully.',
            'data' => $healthLog,
        ], 201);
    }

    public function destroyHealthLog(Pet $pet, PetHealthLog $log): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        if ((int) $log->pet_id !== (int) $pet->id) {
            return response()->json([
                'message' => 'Health log does not belong to this pet.',
            ], 422);
        }

        $log->delete();

        return response()->json([
            'message' => 'Health log deleted successfully.',
        ]);
    }

    public function reminders(Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        return response()->json(
            $pet->reminders()->latest()->get()
        );
    }

    public function dashboard(Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        $healthLogs = $pet->healthLogs()->orderBy('log_date')->get();
        $reminders = $pet->reminders()->latest()->get();

        return response()->json([
            'pet' => $pet,
            'health_logs' => $healthLogs,
            'reminders' => $reminders,
            'recommendations' => $this->buildRecommendations($pet),
            'alerts' => $this->buildAlerts($pet, $healthLogs, $reminders),
        ]);
    }

    public function recommendations(Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        return response()->json($this->buildRecommendations($pet));
    }

    public function alerts(Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        $healthLogs = $pet->healthLogs()->orderBy('log_date')->get();
        $reminders = $pet->reminders()->latest()->get();

        return response()->json($this->buildAlerts($pet, $healthLogs, $reminders));
    }

    public function customiseMemorial(Request $request, Pet $pet): JsonResponse
    {
        $unauthorized = $this->authorizePetOwner($pet);

        if ($unauthorized) {
            return $unauthorized;
        }

        $validated = $request->validate([
            'memorial_message' => ['nullable', 'string', 'max:3000'],
            'memorial_photo_url' => ['nullable', 'url', 'max:2048'],
            'memorial_theme' => ['nullable', 'string', 'max:100'],
            'memorial_visibility' => ['nullable', 'in:private,public'],
        ]);

        $pet->memorial_message = $validated['memorial_message'] ?? $pet->memorial_message;
        $pet->memorial_photo_url = $validated['memorial_photo_url'] ?? $pet->memorial_photo_url;
        $pet->memorial_theme = $validated['memorial_theme'] ?? $pet->memorial_theme;
        $pet->memorial_visibility = $validated['memorial_visibility'] ?? $pet->memorial_visibility;

        $pet->save();

        return response()->json([
            'message' => 'Memorial customisation saved successfully.',
            'data' => [
                'id' => $pet->id,
                'name' => $pet->name,
                'memorial_message' => $pet->memorial_message,
                'memorial_photo_url' => $pet->memorial_photo_url,
                'memorial_theme' => $pet->memorial_theme,
                'memorial_visibility' => $pet->memorial_visibility,
            ],
        ]);
    }

    protected function authorizePetOwner(Pet $pet): ?JsonResponse
    {
        $user = auth()->user();

        if (!$user || (int) $pet->user_id !== (int) $user->id) {
            return response()->json(['message' => 'Unauthorized'], 403);
        }

        return null;
    }

    protected function buildRecommendations(Pet $pet): array
    {
        $species = $this->normaliseText($pet->species ?? '');
        $breed = $this->normaliseText($pet->breed ?? '');
        $age = (float) ($pet->age ?? 0);
        $weight = (float) ($pet->weight ?? 0);
        $activityLevel = $this->normaliseText($pet->activity_level ?? '');

        $breedCare = $this->resolveBreedCare($species, $breed);

        $petName = $pet->name ?: 'Your pet';
        $displaySpecies = $species ? ucfirst($species) : 'Pet';
        $displayBreed = $pet->breed ?: $displaySpecies;

        $exerciseMessage = "{$petName} is listed as a {$displayBreed}. {$breedCare['exercise']}";
        $feedingMessage = $breedCare['feeding'];
        $healthMessage = $breedCare['health'];
        $careMessage = $breedCare['care'];

        // Age-based personalisation
        $seniorAge = $species === 'cat' ? 11 : 8;

        if ($age >= $seniorAge) {
            $careMessage .= ' As a senior pet, consider more frequent check-ups, softer routines, and lower-impact exercise.';
            $healthMessage .= ' Senior pets should be monitored more closely for mobility, appetite, dental health, and behaviour changes.';
        } elseif ($age > 0 && $age <= 1) {
            $careMessage .= ' As a young pet, focus on routine building, socialisation, and short play sessions.';
            $feedingMessage .= ' Younger pets may need smaller, regular meals and steady growth monitoring.';
        }

        // Weight-based personalisation
        if ($weight > 0) {
            if ($species === 'dog' && $weight >= 35) {
                $feedingMessage .= ' Current weight is high, so portion control and joint-friendly activity are especially important.';
                $healthMessage .= ' Keep an extra eye on joint comfort and body condition.';
            }

            if ($species === 'cat' && $weight >= 6) {
                $feedingMessage .= ' Current weight is high for many cats, so encourage daily play and monitor food intake.';
                $healthMessage .= ' Keep an extra eye on weight, hydration, and litter habits.';
            }
        }

        // Activity-level personalisation
        if ($activityLevel === 'low') {
            $exerciseMessage .= ' Since the activity level is low, increase movement gradually with short daily sessions.';
        } elseif ($activityLevel === 'high') {
            $careMessage .= ' Since the activity level is high, support recovery with hydration, rest, and structured routines.';
        }

        return [
            [
                'type' => 'exercise',
                'title' => 'Breed-Specific Exercise Recommendation',
                'message' => $exerciseMessage,
                'breed_group' => $breedCare['group'] ?? 'default',
            ],
            [
                'type' => 'feeding',
                'title' => 'Breed-Specific Feeding Advice',
                'message' => $feedingMessage,
                'breed_group' => $breedCare['group'] ?? 'default',
            ],
            [
                'type' => 'health',
                'title' => 'Breed Health Tip',
                'message' => $healthMessage,
                'breed_group' => $breedCare['group'] ?? 'default',
            ],
            [
                'type' => 'care',
                'title' => 'Care Recommendation',
                'message' => $careMessage,
                'breed_group' => $breedCare['group'] ?? 'default',
            ],
        ];
    }

    protected function resolveBreedCare(string $species, string $breed): array
    {
        $defaultCare = $this->defaultBreedCare($species);

        $config = config('pet_breed_care', []);

        if (!isset($config[$species])) {
            return $defaultCare;
        }

        $speciesConfig = $config[$species];
        $groups = $speciesConfig['groups'] ?? [];
        $breedGroups = $speciesConfig['breed_groups'] ?? [];

        $groupKey = $breedGroups[$breed] ?? null;

        // Handles names like "Labrador Retriever Mix" or "Golden Retriever Cross"
        if (!$groupKey && $breed !== '') {
            foreach ($breedGroups as $knownBreed => $knownGroup) {
                if ($knownBreed !== '' && str_contains($breed, $knownBreed)) {
                    $groupKey = $knownGroup;
                    break;
                }
            }
        }

        $groupKey = $groupKey ?: 'default';

        $care = $groups[$groupKey] ?? $groups['default'] ?? $defaultCare;

        return array_merge($defaultCare, $care, [
            'group' => $groupKey,
        ]);
    }

    protected function defaultBreedCare(string $species): array
    {
        if ($species === 'dog') {
            return [
                'group' => 'default',
                'activity' => 'varies',
                'grooming' => 'varies',
                'exercise' => 'Use age, size, breed, and activity level to plan suitable daily exercise.',
                'feeding' => 'Use measured portions and monitor weight trends regularly.',
                'health' => 'Monitor dental care, hydration, joints, appetite, and body condition.',
                'care' => 'Keep vaccination, grooming, check-up, and health records updated.',
            ];
        }

        if ($species === 'cat') {
            return [
                'group' => 'default',
                'activity' => 'varies',
                'grooming' => 'varies',
                'exercise' => 'Use daily play, climbing spaces, and interactive toys to support healthy activity.',
                'feeding' => 'Use measured portions and monitor weight trends regularly.',
                'health' => 'Monitor hydration, litter habits, dental health, appetite, and body condition.',
                'care' => 'Keep vaccination, grooming, check-up, and health records updated.',
            ];
        }

        return [
            'group' => 'default',
            'activity' => 'varies',
            'grooming' => 'varies',
            'exercise' => 'Use your pet’s age, size, and activity level to plan suitable daily movement.',
            'feeding' => 'Use measured portions and monitor weight trends regularly.',
            'health' => 'Monitor dental care, hydration, appetite, behaviour, and body condition.',
            'care' => 'Keep a consistent routine for grooming, exercise, check-ups, and rest.',
        ];
    }

    protected function normaliseText(?string $value): string
    {
        $value = strtolower(trim((string) $value));
        $value = str_replace(['-', '_'], ' ', $value);
        $value = preg_replace('/\s+/', ' ', $value);

        return trim($value ?? '');
    }

    protected function buildAlerts($pet, $healthLogs, $reminders): array
    {
        $alerts = [];

        $weights = $healthLogs
            ->pluck('weight')
            ->filter()
            ->map(fn ($w) => (float) $w)
            ->values();

        $activities = $healthLogs
            ->pluck('activity_minutes')
            ->filter()
            ->map(fn ($a) => (float) $a)
            ->values();

        if ($weights->count() >= 2 && $weights->last() > $weights->first()) {
            $alerts[] = [
                'type' => 'weight',
                'severity' => 'medium',
                'title' => 'Weight increase detected',
                'message' => "{$pet->name}'s weight has increased over recent logs.",
            ];
        }

        if ($activities->count() >= 2 && $activities->last() < $activities->first()) {
            $alerts[] = [
                'type' => 'activity',
                'severity' => 'low',
                'title' => 'Activity has dropped',
                'message' => "{$pet->name} has been less active recently.",
            ];
        }

        $pendingReminders = $reminders->filter(function ($r) {
            return strtolower($r->status ?? '') !== 'completed';
        });

        if ($pendingReminders->count() >= 3) {
            $alerts[] = [
                'type' => 'reminders',
                'severity' => 'medium',
                'title' => 'Care tasks need attention',
                'message' => 'Several reminders are still pending.',
            ];
        }

        if (empty($alerts)) {
            $alerts[] = [
                'type' => 'healthy',
                'severity' => 'good',
                'title' => 'No urgent alerts',
                'message' => 'Everything looks stable for now.',
            ];
        }

        return $alerts;
    }
}