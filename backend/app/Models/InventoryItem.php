<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryItem extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'category',
        'unit',
        'current_quantity',
        'daily_usage',
        'remind_before_days',
        'last_restocked_at',
        'is_active',
    ];

    protected $casts = [
        'current_quantity' => 'float',
        'daily_usage' => 'float',
        'remind_before_days' => 'integer',
        'is_active' => 'boolean',
        'last_restocked_at' => 'datetime',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}