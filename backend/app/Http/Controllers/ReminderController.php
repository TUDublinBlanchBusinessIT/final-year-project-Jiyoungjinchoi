<?php

namespace App\Http\Controllers;

use App\Models\Reminder;
use App\Models\Pet;
use App\Services\ReminderGenerator;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

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

    // POST /api/reminders/generate
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

    // GET /api/reminders/upcoming
    public function upcoming(Request $request)
    {
        $user = $request->user();

        $reminders = Reminder::query()
            ->where('user_id', $user->id)
            ->where('status', 'pending')
            ->whereDate('reminder_date', '>=', Carbon::today())
            ->orderBy('reminder_date')
            ->limit(5)
            ->get();

        return response()->json($reminders);
    }

    // PATCH /api/reminders/{reminder}/complete
    public function complete(Request $request, Reminder $reminder)
    {
        $user = $request->user();

        if ($reminder->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $reminder->status = 'completed';
        $reminder->save();

        return response()->json([
            'message' => 'Reminder marked as completed',
            'reminder' => $reminder,
        ]);
    }

    // PATCH /api/reminders/{reminder}/snooze
    public function snooze(Request $request, Reminder $reminder)
    {
        $user = $request->user();

        if ($reminder->user_id !== $user->id) {
            return response()->json(['message' => 'Forbidden'], 403);
        }

        $validated = $request->validate([
            'days' => ['required', 'integer', 'min:1', 'max:30'],
        ]);

        $reminder->reminder_date = Carbon::parse($reminder->reminder_date)->addDays((int)$validated['days'])->toDateString();
        $reminder->status = 'pending';
        $reminder->save();

        return response()->json([
            'message' => 'Reminder snoozed',
            'reminder' => $reminder,
        ]);
    }
}