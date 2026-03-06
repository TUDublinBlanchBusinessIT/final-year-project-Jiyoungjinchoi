<?php

namespace App\Mail;

use App\Models\Reminder;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ReminderDueMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Reminder $reminder)
    {
    }

    public function build()
    {
        return $this->subject('Pawfection Reminder: ' . ($this->reminder->title ?? 'Reminder'))
            ->html("
                <h2>{$this->reminder->title}</h2>
                <p>{$this->reminder->message}</p>
                <p><b>Due:</b> {$this->reminder->reminder_date}</p>
            ");
    }
}