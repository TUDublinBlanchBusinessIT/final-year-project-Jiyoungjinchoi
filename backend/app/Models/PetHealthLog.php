<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PetHealthLog extends Model
{
    use HasFactory;

    protected $fillable = [
        'pet_id',
        'log_date',
        'weight',
        'activity_minutes',
        'appetite',
        'note',
    ];

    protected $casts = [
        'log_date' => 'date',
        'weight' => 'decimal:2',
        'activity_minutes' => 'integer',
    ];

    public function pet()
    {
        return $this->belongsTo(Pet::class);
    }
}