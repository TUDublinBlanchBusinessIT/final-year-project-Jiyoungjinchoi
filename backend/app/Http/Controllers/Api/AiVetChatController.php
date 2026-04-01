<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Pet;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Validation\ValidationException;

class AiVetChatController extends Controller
{
    public function chat(Request $request)
    {
        $validated = $request->validate([
            'pet_id' => ['required', 'integer', 'exists:pets,id'],
            'message' => ['required', 'string', 'max:3000'],
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

        $apiKey = config('services.openai.api_key');
        $model = config('services.openai.model', 'gpt-4o-mini');

        if (!$apiKey) {
            return response()->json([
                'message' => 'OpenAI API key is not configured.',
            ], 500);
        }

        $symptoms = $validated['symptoms'] ?? [];

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
        ];

        $systemPrompt = <<<PROMPT
You are Pawfection AI Vet Assistant.

You are an AI support assistant for pet owners.
You are NOT a licensed veterinarian.
Do NOT claim to diagnose, prescribe, or replace a real vet.
You must clearly speak as an AI assistant.
Give practical, calm, general pet-care guidance only.
When symptoms may be urgent, strongly recommend immediate in-person veterinary care.
When useful, ask 2 to 4 short follow-up questions.
Keep answers supportive, clear, and not overly long.
Avoid repeating the same sentence structure every time.
If the user mentions emergencies such as collapse, seizures, trouble breathing, severe bleeding, poisoning, or inability to stand, tell them to seek emergency veterinary help immediately.
PROMPT;

        $userPrompt = [
            'pet_context' => $petContext,
            'intake' => [
                'main_concern' => $validated['concern'] ?? null,
                'duration' => $validated['duration'] ?? null,
                'appetite' => $validated['appetite'] ?? null,
                'behaviour' => $validated['behaviour'] ?? null,
                'symptoms' => $symptoms,
            ],
            'latest_user_message' => $validated['message'],
            'instruction' => 'Respond as Pawfection AI Vet Assistant. Mention that you are AI, provide general guidance only, include urgent warning signs if relevant, and end with a short disclaimer.',
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
                                'text' => json_encode($userPrompt, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES),
                            ],
                        ],
                    ],
                ],
                'max_output_tokens' => 500,
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
            'assistant_name' => 'Pawfection AI Vet Assistant',
            'disclaimer' => 'This is AI guidance only and not a substitute for a licensed veterinarian.',
        ]);
    }
}