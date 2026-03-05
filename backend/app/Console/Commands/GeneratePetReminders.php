<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\ReminderGenerator;

class GeneratePetReminders extends Command
{
    protected $signature = 'reminders:generate';
    protected $description = 'Generate pet reminders based on pet data';

    public function handle(ReminderGenerator $generator): int
    {
        $created = $generator->generateForAllPets();
        $this->info("Generated reminders. Newly created: {$created}");
        return Command::SUCCESS;
    }
}