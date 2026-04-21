<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use App\Models\PetHealthLog;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

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
        $species = strtolower(trim((string) ($pet->species ?? '')));
        $breed = strtolower(trim((string) ($pet->breed ?? '')));
        $age = (float) ($pet->age ?? 0);
        $weight = (float) ($pet->weight ?? 0);
        $activityLevel = strtolower(trim((string) ($pet->activity_level ?? '')));

        $exerciseTitle = 'Exercise Recommendation';
        $feedingTitle = 'Feeding Advice';
        $healthTitle = 'Health Tip';
        $careTitle = 'Care Recommendation';

        $exerciseMessage = 'Aim for regular daily movement and keep activity consistent.';
        $feedingMessage = 'Use measured portions and monitor weight trends regularly.';
        $healthMessage = 'Keep regular check-ups, monitor appetite, and track any behaviour changes.';
        $careMessage = 'Keep vaccination, grooming, and check-up records updated for better premium insights.';

        if ($species === 'dog') {
            $exerciseMessage = 'Aim for 45–60 minutes of daily walks and active play.';
            $healthTitle = 'Dog Health Tip';
            $healthMessage = 'Monitor joints, dental care, hydration, and healthy body condition.';
        } elseif ($species === 'cat') {
            $exerciseMessage = 'Aim for 20–30 minutes of indoor interactive play each day.';
            $healthTitle = 'Cat Health Tip';
            $healthMessage = 'Monitor hydration, litter habits, dental health, and weight changes.';
        }

        if (
            str_contains($breed, 'golden') ||
            str_contains($breed, 'labrador') ||
            str_contains($breed, 'husky') ||
            str_contains($breed, 'collie')
        ) {
            $exerciseMessage = 'Aim for 60–90 minutes of exercise and active play each day.';
            $healthTitle = 'Breed Health Tip';
            $healthMessage = 'Monitor joints, skin health, and body weight over time.';
        }

        if (str_contains($breed, 'dachshund')) {
            $exerciseMessage = 'Aim for 45–60 minutes of gentle daily exercise and avoid excessive jumping.';
            $healthTitle = 'Breed Health Tip';
            $healthMessage = 'Monitor back strain and weight carefully.';
        }

        if (
            str_contains($breed, 'bulldog') ||
            str_contains($breed, 'pug') ||
            str_contains($breed, 'shih tzu')
        ) {
            $exerciseMessage = 'Keep exercise gentle and shorter, especially in warm weather.';
            $healthTitle = 'Breed Health Tip';
            $healthMessage = 'Watch breathing, heat tolerance, and skin folds carefully.';
        }

        if (str_contains($breed, 'ragdoll') || str_contains($breed, 'persian')) {
            $healthTitle = 'Breed Care Tip';
            $healthMessage = 'Keep an eye on grooming, weight, coat condition, and regular indoor activity.';
        }

        if ($age >= 8) {
            $careTitle = 'Senior Care Tip';
            $careMessage = 'Consider more frequent check-ups, softer routines, and lower-impact exercise.';
        } elseif ($age > 0 && $age <= 1) {
            $careTitle = 'Young Pet Tip';
            $careMessage = 'Frequent short play sessions and routine development are ideal at this age.';
            $feedingMessage = 'Smaller regular meals and steady growth monitoring are recommended for younger pets.';
        }

        if ($weight > 0) {
            if ($species === 'dog' && $weight >= 35) {
                $feedingMessage = 'Use measured portions, avoid overfeeding, and monitor joints and body weight closely.';
            } elseif ($species === 'cat' && $weight >= 6) {
                $feedingMessage = 'Use measured portions and encourage daily play to help maintain a healthy weight.';
            }
        }

        if ($activityLevel === 'low') {
            $exerciseMessage = 'Increase activity gradually with short daily sessions and a consistent routine.';
        } elseif ($activityLevel === 'high') {
            $careMessage = 'Support energy levels with hydration, structured exercise, and enough recovery time.';
        }

        return [
            [
                'type' => 'exercise',
                'title' => $exerciseTitle,
                'message' => $exerciseMessage,
            ],
            [
                'type' => 'feeding',
                'title' => $feedingTitle,
                'message' => $feedingMessage,
            ],
            [
                'type' => 'health',
                'title' => $healthTitle,
                'message' => $healthMessage,
            ],
            [
                'type' => 'care',
                'title' => $careTitle,
                'message' => $careMessage,
            ],
        ];
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