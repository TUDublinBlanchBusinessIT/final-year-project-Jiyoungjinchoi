<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AiVetChatController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'session_id' => ['nullable', 'integer'],
            'message' => ['required', 'string', 'max:5000'],

            'support_mode' => ['nullable', 'string', 'max:255'],
            'pet_profile_context' => ['nullable', 'string', 'max:20000'],

            'concern' => ['nullable', 'string', 'max:3000'],
            'duration' => ['nullable', 'string', 'max:1000'],
            'appetite' => ['nullable', 'string', 'max:1000'],
            'behaviour' => ['nullable', 'string', 'max:1000'],

            'symptoms' => ['nullable', 'array'],
            'symptoms.*' => ['string', 'max:255'],
        ]);

        $user = $request->user();

        $pet = Pet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$pet) {
            throw ValidationException::withMessages([
                'pet_id' => 'Selected pet was not found for this user.',
            ]);
        }

        if (!$this->userIsPremium($user)) {
            return response()->json([
                'message' => 'AI Pet Assistant is available for premium users only.',
            ], 403);
        }

        if (!empty($validated['session_id'])) {
            $session = $this->findOwnedSession($validated['session_id'], $user->id, $pet->id);

            if (!$session) {
                throw ValidationException::withMessages([
                    'session_id' => 'AI assistant session not found for this pet.',
                ]);
            }

            if (!empty($session->ended_at)) {
                return response()->json([
                    'message' => 'This AI assistant session has already ended and is read-only.',
                ], 422);
            }
        }

        $apiKey = config('services.openai.api_key');
        $model = config('services.openai.model', 'gpt-4o-mini');

        if (!$apiKey) {
            return response()->json([
                'message' => 'OpenAI API key is not configured.',
            ], 500);
        }

        $supportMode = trim((string) ($validated['support_mode'] ?? 'Health & Symptoms'));
        $symptoms = $validated['symptoms'] ?? [];
        $petProfileContext = trim((string) ($validated['pet_profile_context'] ?? ''));

        $petContext = [
            'name' => $pet->name,
            'species' => $pet->species,
            'breed' => $pet->breed,
            'age' => $pet->age,
            'gender' => $pet->gender,
            'weight' => $pet->weight,
            'allergies' => $pet->allergies,
            'health_conditions' => $pet->health_conditions,
            'vaccination_status' => $pet->vaccination_status,
            'notes' => $pet->notes,
            'eye_color' => $pet->eye_color ?? null,
            'fur_type' => $pet->fur_type ?? null,
            'markings' => $pet->markings ?? null,
            'microchip_number' => $pet->microchip_number ?? null,
            'vaccination_history' => $pet->vaccination_history ?? null,
            'last_vaccination_date' => $pet->last_vaccination_date ?? null,
            'vaccine_interval_days' => $pet->vaccine_interval_days ?? null,
            'last_grooming_date' => $pet->last_grooming_date ?? null,
            'grooming_interval_days' => $pet->grooming_interval_days ?? null,
        ];

        $systemPrompt = <<<PROMPT
You are Pawfection AI Pet Assistant.

You are an AI support assistant for pet owners.
You are NOT a licensed veterinarian.
Do NOT claim to diagnose, prescribe, or replace a real vet.
You must clearly speak as an AI assistant.
Give practical, calm, general pet-care guidance only.
Keep answers supportive, clear, structured, and not overly long.
Avoid repeating the same sentence structure every time.
Ask 2 to 4 short follow-up questions only when useful.

The selected support mode may be one of:
- Health & Symptoms
- Behaviour & Training
- Food & Nutrition
- Grooming & Care
- Routine & Reminders
- Appointment Prep
- Lost Pet Support
- New Pet Owner Help
- Travel & Planning
- Other

Rules by mode:

If support mode is "Health & Symptoms":
- provide general symptom guidance only
- do not diagnose
- mention when in-person veterinary care may be needed
- if the user mentions emergencies such as collapse, seizures, trouble breathing, severe bleeding, poisoning, or inability to stand, strongly recommend immediate emergency veterinary help

If support mode is NOT "Health & Symptoms":
- do not frame the answer as a medical consultation unless the user clearly asks a health question
- give practical, relevant support for the chosen topic
- use the pet profile naturally where helpful
- be helpful for planning, organisation, routines, behaviour, feeding, grooming, lost pet support, travel, and other general pet care topics

If support mode is "Lost Pet Support":
- help write clear, calm, useful lost pet wording
- help organise identifying details from the pet profile

If support mode is "Appointment Prep":
- help prepare questions, summaries, and notes for the upcoming appointment

If support mode is "Routine & Reminders":
- help structure routines, schedules, and reminder ideas

If support mode is "Behaviour & Training":
- help identify patterns, triggers, and gentle next-step ideas

If support mode is "Food & Nutrition":
- help organise food routines and transitions, but avoid medical claims

If support mode is "Grooming & Care":
- help with home care, grooming frequency, coat or care planning

If support mode is "New Pet Owner Help":
- help with first steps, checklists, and beginner guidance

If support mode is "Travel & Planning":
- help with packing lists, transition tips, and travel prep

If support mode is "Other":
- help broadly with pet-related questions that do not fit the listed categories

End with a short disclaimer when the topic is health-related or could be risky.
PROMPT;

        $userPrompt = [
            'support_mode' => $supportMode,
            'pet_context' => $petContext,
            'pet_profile_context' => $petProfileContext ?: null,
            'intake' => [
                'main_concern' => $validated['concern'] ?? null,
                'duration' => $validated['duration'] ?? null,
                'appetite' => $validated['appetite'] ?? null,
                'behaviour' => $validated['behaviour'] ?? null,
                'symptoms' => $symptoms,
            ],
            'latest_user_message' => $validated['message'],
            'instruction' => 'Respond as Pawfection AI Pet Assistant. Use the selected support mode and the pet profile context naturally. For health mode, provide general guidance only and do not diagnose. For non-health modes, provide broader pet support relevant to the chosen topic.',
        ];

        $response = Http::withToken($apiKey)
            ->withoutVerifying()
            ->timeout(45)
            ->post('https://api.openai.com/v1/responses', [
                'model' => $model,
                'input' => [
                    [
                        'role' => 'system',
                        'content' => [
                            [
                                'type' => 'input_text',
                                'text' => $systemPrompt,
                            ],
                        ],
                    ],
                    [
                        'role' => 'user',
                        'content' => [
                            [
                                'type' => 'input_text',
                                'text' => json_encode($userPrompt, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE),
                            ],
                        ],
                    ],
                ],
                'max_output_tokens' => 700,
            ]);

        if (!$response->successful()) {
            return response()->json([
                'message' => 'Failed to get AI response.',
                'status' => $response->status(),
                'body' => $response->body(),
                'json' => $response->json(),
            ], $response->status());
        }

        $data = $response->json();

        $reply = data_get($data, 'output_text');

        if (is_array($reply)) {
            $reply = implode("\n", array_filter($reply));
        }

        if (!$reply) {
            $output = data_get($data, 'output', []);

            foreach ($output as $item) {
                $content = $item['content'] ?? [];

                foreach ($content as $part) {
                    if (($part['type'] ?? null) === 'output_text' && !empty($part['text'])) {
                        $reply = $part['text'];
                        break 2;
                    }
                }
            }
        }

        if (!$reply) {
            $reply = 'Sorry, I could not generate a response right now.';
        }

        return response()->json([
            'reply' => $reply,
            'assistant_name' => 'Pawfection AI Pet Assistant',
            'disclaimer' => $supportMode === 'Health & Symptoms'
                ? 'This is AI guidance only and not a substitute for a licensed veterinarian.'
                : 'This is AI support only and should be used as general pet guidance.',
            'support_mode' => $supportMode,
            'session_id' => $validated['session_id'] ?? null,
        ]);
    }

    public function sessions(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
        ]);

        $user = $request->user();

        $pet = Pet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$pet) {
            throw ValidationException::withMessages([
                'pet_id' => 'Selected pet was not found for this user.',
            ]);
        }

        if (!$this->userIsPremium($user)) {
            return response()->json([
                'message' => 'AI Pet Assistant history is available for premium users only.',
            ], 403);
        }

        $sessions = DB::table('ai_vet_chat_sessions')
            ->where('user_id', $user->id)
            ->where('pet_id', $pet->id)
            ->orderByDesc('started_at')
            ->orderByDesc('id')
            ->get()
            ->map(function ($session) {
                return $this->formatSession($session);
            })
            ->values();

        return response()->json([
            'sessions' => $sessions,
        ]);
    }

    public function storeSession(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'intake_summary' => ['nullable', 'string', 'max:10000'],
            'support_mode' => ['nullable', 'string', 'max:255'],
            'concern' => ['nullable', 'string', 'max:3000'],
            'duration' => ['nullable', 'string', 'max:1000'],
            'appetite' => ['nullable', 'string', 'max:1000'],
            'behaviour' => ['nullable', 'string', 'max:1000'],
            'symptoms' => ['nullable', 'array'],
            'symptoms.*' => ['string', 'max:255'],
            'guidance' => ['nullable', 'array'],
            'guidance.*' => ['nullable', 'string'],
            'transcript' => ['nullable', 'array'],
            'started_at' => ['nullable', 'date'],
        ]);

        $user = $request->user();

        $pet = Pet::where('id', $validated['pet_id'])
            ->where('user_id', $user->id)
            ->first();

        if (!$pet) {
            throw ValidationException::withMessages([
                'pet_id' => 'Selected pet was not found for this user.',
            ]);
        }

        if (!$this->userIsPremium($user)) {
            return response()->json([
                'message' => 'AI Pet Assistant is available for premium users only.',
            ], 403);
        }

        $sessionId = DB::table('ai_vet_chat_sessions')->insertGetId([
            'user_id' => $user->id,
            'pet_id' => $pet->id,
            'intake_summary' => $validated['intake_summary'] ?? null,
            'support_mode' => $validated['support_mode'] ?? 'Health & Symptoms',
            'concern' => $validated['concern'] ?? null,
            'duration' => $validated['duration'] ?? null,
            'appetite' => $validated['appetite'] ?? null,
            'behaviour' => $validated['behaviour'] ?? null,
            'symptoms' => $this->jsonEncodeOrNull($validated['symptoms'] ?? []),
            'guidance' => $this->jsonEncodeOrNull($validated['guidance'] ?? []),
            'transcript' => $this->jsonEncodeOrNull($validated['transcript'] ?? []),
            'rating' => null,
            'feedback' => null,
            'started_at' => $this->normalizeDateTime($validated['started_at'] ?? null),
            'ended_at' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $session = DB::table('ai_vet_chat_sessions')->where('id', $sessionId)->first();

        return response()->json([
            'message' => 'AI assistant session created successfully.',
            'session' => $this->formatSession($session),
        ], 201);
    }

    public function updateTranscript(Request $request, $sessionId)
    {
        $validated = $request->validate([
            'transcript' => ['required', 'array'],
        ]);

        $user = $request->user();

        if (!$this->userIsPremium($user)) {
            return response()->json([
                'message' => 'AI Pet Assistant is available for premium users only.',
            ], 403);
        }

        $session = $this->findOwnedSession($sessionId, $user->id);

        if (!$session) {
            return response()->json([
                'message' => 'AI assistant session not found.',
            ], 404);
        }

        if (!empty($session->ended_at)) {
            return response()->json([
                'message' => 'This AI assistant session has already ended and is read-only.',
            ], 422);
        }

        DB::table('ai_vet_chat_sessions')
            ->where('id', $session->id)
            ->update([
                'transcript' => $this->jsonEncodeOrNull($validated['transcript']),
                'updated_at' => now(),
            ]);

        $updated = DB::table('ai_vet_chat_sessions')->where('id', $session->id)->first();

        return response()->json([
            'message' => 'Transcript updated successfully.',
            'session' => $this->formatSession($updated),
        ]);
    }

    public function endSession(Request $request, $sessionId)
    {
        $validated = $request->validate([
            'ended_at' => ['nullable', 'date'],
            'transcript' => ['nullable', 'array'],
        ]);

        $user = $request->user();

        if (!$this->userIsPremium($user)) {
            return response()->json([
                'message' => 'AI Pet Assistant is available for premium users only.',
            ], 403);
        }

        $session = $this->findOwnedSession($sessionId, $user->id);

        if (!$session) {
            return response()->json([
                'message' => 'AI assistant session not found.',
            ], 404);
        }

        if (!empty($session->ended_at)) {
            return response()->json([
                'message' => 'This AI assistant session has already ended.',
                'session' => $this->formatSession($session),
            ], 200);
        }

        DB::table('ai_vet_chat_sessions')
            ->where('id', $session->id)
            ->update([
                'ended_at' => $this->normalizeDateTime($validated['ended_at'] ?? null),
                'transcript' => array_key_exists('transcript', $validated)
                    ? $this->jsonEncodeOrNull($validated['transcript'])
                    : $session->transcript,
                'updated_at' => now(),
            ]);

        $updated = DB::table('ai_vet_chat_sessions')->where('id', $session->id)->first();

        return response()->json([
            'message' => 'AI assistant session ended successfully.',
            'session' => $this->formatSession($updated),
        ]);
    }

    public function storeRating(Request $request, $sessionId)
    {
        $validated = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'feedback' => ['nullable', 'string', 'max:1000'],
        ]);

        $user = $request->user();

        if (!$this->userIsPremium($user)) {
            return response()->json([
                'message' => 'AI Pet Assistant is available for premium users only.',
            ], 403);
        }

        $session = $this->findOwnedSession($sessionId, $user->id);

        if (!$session) {
            return response()->json([
                'message' => 'AI assistant session not found.',
            ], 404);
        }

        if (empty($session->ended_at)) {
            return response()->json([
                'message' => 'Please end the AI assistant session before rating it.',
            ], 422);
        }

        DB::table('ai_vet_chat_sessions')
            ->where('id', $session->id)
            ->update([
                'rating' => $validated['rating'],
                'feedback' => $validated['feedback'] ?? null,
                'updated_at' => now(),
            ]);

        $updated = DB::table('ai_vet_chat_sessions')->where('id', $session->id)->first();

        return response()->json([
            'message' => 'AI assistant session rating saved successfully.',
            'session' => $this->formatSession($updated),
        ]);
    }

    private function userIsPremium($user): bool
    {
        return $user->is_premium === true
            || strtolower((string) ($user->account_type ?? '')) === 'premium'
            || strtolower((string) ($user->plan ?? '')) === 'premium'
            || strtolower((string) ($user->subscription ?? '')) === 'premium';
    }

    private function findOwnedSession($sessionId, $userId, $petId = null)
    {
        $query = DB::table('ai_vet_chat_sessions')
            ->where('id', $sessionId)
            ->where('user_id', $userId);

        if ($petId !== null) {
            $query->where('pet_id', $petId);
        }

        return $query->first();
    }

    private function jsonEncodeOrNull($value): ?string
    {
        if ($value === null) {
            return null;
        }

        return json_encode($value, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function decodeJsonField($value, $fallback = [])
    {
        if ($value === null || $value === '') {
            return $fallback;
        }

        if (is_array($value)) {
            return $value;
        }

        $decoded = json_decode($value, true);

        return json_last_error() === JSON_ERROR_NONE ? $decoded : $fallback;
    }

    private function normalizeDateTime($value)
    {
        if (empty($value)) {
            return now();
        }

        try {
            return Carbon::parse($value)->format('Y-m-d H:i:s');
        } catch (\Throwable $e) {
            return now();
        }
    }

    private function formatSession($session): array
    {
        return [
            'id' => $session->id,
            'user_id' => $session->user_id,
            'pet_id' => $session->pet_id,
            'intake_summary' => $session->intake_summary,
            'support_mode' => $session->support_mode ?? 'Health & Symptoms',
            'concern' => $session->concern,
            'duration' => $session->duration,
            'appetite' => $session->appetite,
            'behaviour' => $session->behaviour,
            'symptoms' => $this->decodeJsonField($session->symptoms, []),
            'guidance' => $this->decodeJsonField($session->guidance, []),
            'transcript' => $this->decodeJsonField($session->transcript, []),
            'rating' => $session->rating,
            'feedback' => $session->feedback,
            'started_at' => $session->started_at,
            'ended_at' => $session->ended_at,
            'created_at' => $session->created_at,
            'updated_at' => $session->updated_at,
        ];
    }
}