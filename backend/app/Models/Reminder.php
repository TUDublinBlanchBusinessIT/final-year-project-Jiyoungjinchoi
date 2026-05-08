<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = [
        'user_id',
        'pet_id',
        'appointment_id',
        'type',
        'title',
        'message',
        'reminder_date',
        'status',
        'dedupe_key',
        'notified_at',
    ];

    protected $casts = [
        'reminder_date' => 'datetime',
        'notified_at' => 'datetime',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function appointment()
    {
        return $this->belongsTo(Appointment::class);
    }
}