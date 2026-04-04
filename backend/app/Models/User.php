<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Cashier\Billable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable implements MustVerifyEmail
{
    use HasApiTokens, HasFactory, Notifiable, Billable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'account_type',
        'role',
        'is_banned',
        'subscription_started_at',
        'subscription_status',
        'notification_email',
        'notification_sms',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'subscription_started_at' => 'datetime',
            'is_banned' => 'boolean',
            'notification_email' => 'boolean',
            'notification_sms' => 'boolean',
        ];
    }

    public function pets()
    {
        return $this->hasMany(Pet::class);
    }
}