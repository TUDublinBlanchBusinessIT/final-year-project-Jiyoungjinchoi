<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Reminder extends Model
{
    protected $fillable = [
        'user_id',
        'pet_id',
        'type',
        'title',
        'message',
        'reminder_date',
        'status',
        'dedupe_key',
    ];

    protected $casts = [
        'reminder_date' => 'date',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}