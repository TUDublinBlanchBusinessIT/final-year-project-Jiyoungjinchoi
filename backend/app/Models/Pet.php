<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Pet extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',

        // Core fields
        'name',
        'species',
        'breed',
        'dob',
        'age',
        'gender',
        'weight',
        'notes',
        'photo_path',

        // Pet profile tab fields
        'vaccination_status',
        'last_vet_visit',
        'medical_notes',
        'food_type',
        'feeding_schedule',
        'allergies',
        'temperament',
        'behaviour_notes',

        // Lost & Found fields
        'is_lost',
        'lost_status',
        'lost_description',
        'last_seen_location',
        'last_seen_lat',
        'last_seen_lng',
        'lost_photo_path',
        'reported_lost_at',
        'resolved_at',
        'archived_at',
    ];

    protected $casts = [
        'dob' => 'date',
        'last_vet_visit' => 'date',
        'is_lost' => 'boolean',
        'reported_lost_at' => 'datetime',
        'resolved_at' => 'datetime',
        'archived_at' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function reminders()
    {
        return $this->hasMany(\App\Models\Reminder::class);
    }
}