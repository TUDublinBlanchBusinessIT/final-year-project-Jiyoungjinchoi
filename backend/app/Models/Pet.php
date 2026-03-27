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
        'name',
        'species',
        'breed',
        'dob',
        'age',
        'gender',
        'weight',
        'notes',
        'photo_path',
        'last_vaccination_date',
        'vaccine_interval_days',
        'last_grooming_date',
        'grooming_interval_days',
        'eye_color',
        'fur_type',
        'markings',
        'health_conditions',
        'allergies',
        'vaccination_history',
        'microchip_number',
        'exercise_level',
        'activity_level',
        'diet',
        'personality_traits',
        'vaccination_status',
        'last_vet_visit',
        'medical_notes',
        'food_type',
        'feeding_schedule',
        'temperament',
        'behaviour_notes',
        'status',
        'memorial_message',
        'is_lost',
        'is_priority',
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
        'last_vaccination_date' => 'date',
        'last_grooming_date' => 'date',
        'last_vet_visit' => 'date',
        'is_lost' => 'boolean',
        'is_priority' => 'boolean',
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

    public function healthLogs()
    {
        return $this->hasMany(\App\Models\PetHealthLog::class)->orderByDesc('log_date');
    }
}