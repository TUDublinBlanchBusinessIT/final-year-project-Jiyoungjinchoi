<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Mail;
use App\Models\Reminder;
use App\Mail\ReminderDueMail;

class SendReminderEmails extends Command
{
    protected $signature = 'reminders:send-emails';
    protected $description = 'Send reminder emails for due reminders';

    public function handle(): int
    {
        $today = Carbon::today();

        $reminders = Reminder::query()
            ->where('status', 'pending')
            ->whereNull('notified_at')
            ->whereDate('reminder_date', '<=', $today)
            ->with('user')
            ->get();

        $sent = 0;

        foreach ($reminders as $reminder) {
            if (!$reminder->user || !$reminder->user->email) continue;

            Mail::to($reminder->user->email)->send(new ReminderDueMail($reminder));

            $reminder->notified_at = Carbon::now();
            $reminder->save();

            $sent++;
        }

        $this->info("Sent {$sent} reminder emails.");
        return Command::SUCCESS;
    }
}