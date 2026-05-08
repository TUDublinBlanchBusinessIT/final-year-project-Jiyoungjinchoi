<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class AiVetChatSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'pet_id',
        'intake_summary',
        'concern',
        'duration',
        'appetite',
        'behaviour',
        'symptoms',
        'guidance',
        'transcript',
        'rating',
        'feedback',
        'started_at',
        'ended_at',
    ];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
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