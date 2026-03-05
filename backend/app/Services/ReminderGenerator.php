<?php

namespace App\Services;

use App\Models\Pet;
use App\Models\Reminder;
use Carbon\Carbon;

class ReminderGenerator
{
    public function generateForPet(Pet $pet): int
    {
        $created = 0;
        $today = Carbon::today();

        // Must have a user owner (your Pet model likely has user_id already)
        if (!$pet->user_id) {
            return 0;
        }

        // --- Birthday reminder (next birthday) ---
        if ($pet->date_of_birth) {
            $dob = Carbon::parse($pet->date_of_birth);
            $nextBirthday = $dob->copy()->year($today->year);
            if ($nextBirthday->lt($today)) {
                $nextBirthday = $nextBirthday->addYear();
            }

            $created += $this->createOnce(
                $pet->user_id,
                $pet->id,
                'birthday',
                "🎂 {$pet->name}'s Birthday",
                "Reminder: {$pet->name}'s birthday is on " . $nextBirthday->toFormattedDateString(),
                $nextBirthday->toDateString(),
                "birthday:" . $nextBirthday->toDateString()
            );
        }

        // --- Vaccine reminder (last vaccination + interval) ---
        // If last_vaccination_date missing, create a "schedule vaccination" reminder for today
        if ($pet->last_vaccination_date) {
            $due = Carbon::parse($pet->last_vaccination_date)->addDays((int)$pet->vaccine_interval_days);
            $created += $this->createOnce(
                $pet->user_id,
                $pet->id,
                'vaccine',
                "💉 Vaccine Due for {$pet->name}",
                "Reminder: {$pet->name} may be due a vaccination on " . $due->toFormattedDateString(),
                $due->toDateString(),
                "vaccine:" . $due->toDateString()
            );
        } else {
            $created += $this->createOnce(
                $pet->user_id,
                $pet->id,
                'vaccine',
                "💉 Add Vaccination Date for {$pet->name}",
                "Reminder: add {$pet->name}'s last vaccination date to track future vaccine reminders.",
                $today->toDateString(),
                "vaccine:missing_last_date"
            );
        }

        // --- Grooming reminder (last grooming + interval) ---
        if ($pet->last_grooming_date) {
            $due = Carbon::parse($pet->last_grooming_date)->addDays((int)$pet->grooming_interval_days);
            $created += $this->createOnce(
                $pet->user_id,
                $pet->id,
                'grooming',
                "🧼 Grooming Due for {$pet->name}",
                "Reminder: {$pet->name} may be due grooming on " . $due->toFormattedDateString(),
                $due->toDateString(),
                "grooming:" . $due->toDateString()
            );
        } else {
            $created += $this->createOnce(
                $pet->user_id,
                $pet->id,
                'grooming',
                "🧼 Add Grooming Date for {$pet->name}",
                "Reminder: add {$pet->name}'s last grooming date to track future grooming reminders.",
                $today->toDateString(),
                "grooming:missing_last_date"
            );
        }

        return $created;
    }

    public function generateForAllPets(): int
    {
        $count = 0;
        Pet::query()->chunk(200, function ($pets) use (&$count) {
            foreach ($pets as $pet) {
                $count += $this->generateForPet($pet);
            }
        });
        return $count;
    }

    private function createOnce(
        int $userId,
        int $petId,
        string $type,
        string $title,
        string $message,
        string $reminderDate,
        string $dedupeKey
    ): int {
        $rem = Reminder::firstOrCreate(
            [
                'user_id' => $userId,
                'pet_id' => $petId,
                'dedupe_key' => $dedupeKey,
            ],
            [
                'type' => $type,
                'title' => $title,
                'message' => $message,
                'reminder_date' => $reminderDate,
                'status' => 'pending',
            ]
        );

        return $rem->wasRecentlyCreated ? 1 : 0;
    }
}