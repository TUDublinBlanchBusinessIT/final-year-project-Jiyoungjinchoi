<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use App\Models\Pet;
use App\Services\ReminderGenerator;
use Illuminate\Http\Request;

class ReminderController extends Controller
{
    // GET /api/reminders
    public function index(Request $request)
    {
        $user = $request->user();

        $reminders = Reminder::query()
            ->where('user_id', $user->id)
            ->orderBy('reminder_date')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($reminders);
    }

    // POST /api/reminders/generate (generate for all user's pets)
    public function generate(Request $request, ReminderGenerator $generator)
    {
        $user = $request->user();

        $created = 0;
        $pets = Pet::where('user_id', $user->id)->get();

        foreach ($pets as $pet) {
            $created += $generator->generateForPet($pet);
        }

        return response()->json([
            'message' => 'Reminders generated',
            'created' => $created,
        ]);
    }
}