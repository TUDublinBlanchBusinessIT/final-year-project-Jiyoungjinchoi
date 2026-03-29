<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Pet;
use App\Models\FoundReport;
use App\Models\Sighting;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /*
        |--------------------------------------------------------------------------
        | USERS
        |--------------------------------------------------------------------------
        */

        $aisha = User::updateOrCreate(
            ['email' => 'aisha.basic@example.com'],
            [
                'name' => 'Aisha Khan',
                'password' => Hash::make('password123'),
                'account_type' => 'basic',
                'role' => 'user',
                'is_banned' => false,
                'subscription_started_at' => null,
                'notification_email' => true,
                'notification_sms' => false,
            ]
        );

        $liam = User::updateOrCreate(
            ['email' => 'liam.basic@example.com'],
            [
                'name' => 'Liam Murphy',
                'password' => Hash::make('password123'),
                'account_type' => 'basic',
                'role' => 'user',
                'is_banned' => false,
                'subscription_started_at' => null,
                'notification_email' => true,
                'notification_sms' => false,
            ]
        );

        $sofia = User::updateOrCreate(
            ['email' => 'sofia.basic@example.com'],
            [
                'name' => 'Sofia Ali',
                'password' => Hash::make('password123'),
                'account_type' => 'basic',
                'role' => 'user',
                'is_banned' => false,
                'subscription_started_at' => null,
                'notification_email' => false,
                'notification_sms' => false,
            ]
        );

        $aaira = User::updateOrCreate(
            ['email' => 'aaira.premium@example.com'],
            [
                'name' => 'Aaira Bell',
                'password' => Hash::make('password123'),
                'account_type' => 'premium',
                'role' => 'user',
                'is_banned' => false,
                'subscription_started_at' => now()->subDays(30),
                'notification_email' => true,
                'notification_sms' => true,
            ]
        );

        $sozi = User::updateOrCreate(
            ['email' => 'sozi.premium@example.com'],
            [
                'name' => 'Sozi Fatima',
                'password' => Hash::make('password123'),
                'account_type' => 'premium',
                'role' => 'user',
                'is_banned' => false,
                'subscription_started_at' => now()->subDays(20),
                'notification_email' => true,
                'notification_sms' => true,
            ]
        );

        $bella = User::updateOrCreate(
            ['email' => 'bella.premium@example.com'],
            [
                'name' => 'Bella Jordan',
                'password' => Hash::make('password123'),
                'account_type' => 'premium',
                'role' => 'user',
                'is_banned' => false,
                'subscription_started_at' => now()->subDays(10),
                'notification_email' => true,
                'notification_sms' => false,
            ]
        );

        foreach ([$aisha, $liam, $sofia, $aaira, $sozi, $bella] as $user) {
            $user->forceFill([
                'email_verified_at' => now(),
            ])->save();
        }

        /*
        |--------------------------------------------------------------------------
        | PETS
        |--------------------------------------------------------------------------
        */

        Pet::updateOrCreate(
            ['user_id' => $aisha->id, 'name' => 'Milo'],
            [
                'user_id' => $aisha->id,
                'name' => 'Milo',
                'species' => 'Dog',
                'breed' => 'Golden Retriever',
                'age' => '3',
                'gender' => 'Male',
                'weight' => 28,
                'notes' => 'Friendly and energetic.',
                'eye_color' => 'Brown',
                'fur_type' => 'Medium',
                'microchip_number' => 'MC100001',
                'diet' => 'Dry food and chicken',
                'personality_traits' => 'Playful, loyal',
                'status' => 'active',
                'photo_path' => 'pets/milo.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $aisha->id, 'name' => 'Luna'],
            [
                'user_id' => $aisha->id,
                'name' => 'Luna',
                'species' => 'Cat',
                'breed' => 'British Shorthair',
                'age' => '2',
                'gender' => 'Female',
                'weight' => 4,
                'notes' => 'Calm indoor cat.',
                'eye_color' => 'Amber',
                'fur_type' => 'Short',
                'microchip_number' => 'MC100002',
                'diet' => 'Wet food',
                'personality_traits' => 'Quiet, affectionate',
                'status' => 'active',
                'photo_path' => 'pets/luna.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $liam->id, 'name' => 'Rocky'],
            [
                'user_id' => $liam->id,
                'name' => 'Rocky',
                'species' => 'Dog',
                'breed' => 'German Shepherd',
                'age' => '4',
                'gender' => 'Male',
                'weight' => 34,
                'notes' => 'Protective and loyal.',
                'eye_color' => 'Dark Brown',
                'fur_type' => 'Thick',
                'microchip_number' => 'MC100003',
                'diet' => 'High protein dog food',
                'personality_traits' => 'Protective, smart',
                'status' => 'active',
                'photo_path' => 'pets/rocky.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $sofia->id, 'name' => 'Shadow'],
            [
                'user_id' => $sofia->id,
                'name' => 'Shadow',
                'species' => 'Cat',
                'breed' => 'Persian',
                'age' => '3',
                'gender' => 'Male',
                'weight' => 4.5,
                'notes' => 'Quiet and likes to nap.',
                'eye_color' => 'Blue',
                'fur_type' => 'Long',
                'microchip_number' => 'MC100004',
                'diet' => 'Indoor cat food',
                'personality_traits' => 'Calm, sleepy',
                'status' => 'active',
                'photo_path' => 'pets/shadow.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        $nala = Pet::updateOrCreate(
            ['user_id' => $aaira->id, 'name' => 'Nala'],
            [
                'user_id' => $aaira->id,
                'name' => 'Nala',
                'species' => 'Dog',
                'breed' => 'Husky',
                'age' => '3',
                'gender' => 'Female',
                'weight' => 24,
                'notes' => 'Very active and loves long walks.',
                'eye_color' => 'Blue',
                'fur_type' => 'Double coat',
                'microchip_number' => 'MC200001',
                'diet' => 'Dry food and salmon',
                'personality_traits' => 'Energetic, vocal',
                'status' => 'active',
                'photo_path' => 'pets/nala.jpg',
                'is_lost' => true,
                'is_priority' => true,
                'lost_status' => 'missing',
                'lost_description' => 'Grey and white husky, wearing a blue collar.',
                'lost_photo_path' => 'lost_pets/nala-lost.jpg',
                'last_seen_location' => 'O’Connell Street',
                'last_seen_lat' => 53.3498,
                'last_seen_lng' => -6.2603,
                'reported_lost_at' => now()->subDay(),
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $aaira->id, 'name' => 'Whiskers'],
            [
                'user_id' => $aaira->id,
                'name' => 'Whiskers',
                'species' => 'Cat',
                'breed' => 'Siamese',
                'age' => '2',
                'gender' => 'Male',
                'weight' => 4,
                'notes' => 'Very vocal and affectionate.',
                'eye_color' => 'Blue',
                'fur_type' => 'Short',
                'microchip_number' => 'MC200002',
                'diet' => 'Wet food and treats',
                'personality_traits' => 'Talkative, affectionate',
                'status' => 'active',
                'photo_path' => 'pets/whiskers.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        $mars = Pet::updateOrCreate(
            ['user_id' => $sozi->id, 'name' => 'Mars'],
            [
                'user_id' => $sozi->id,
                'name' => 'Mars',
                'species' => 'Dog',
                'breed' => 'Dachshund',
                'age' => '4',
                'gender' => 'Male',
                'weight' => 8,
                'notes' => 'Small, fast, and curious.',
                'eye_color' => 'Brown',
                'fur_type' => 'Short',
                'microchip_number' => 'MC200003',
                'diet' => 'Small breed food',
                'personality_traits' => 'Curious, brave',
                'status' => 'active',
                'photo_path' => 'pets/mars.jpg',
                'is_lost' => true,
                'is_priority' => false,
                'lost_status' => 'missing',
                'lost_description' => 'Black dachshund with tan paws.',
                'lost_photo_path' => 'lost_pets/mars-lost.jpg',
                'last_seen_location' => 'Tallaght',
                'last_seen_lat' => 53.2881,
                'last_seen_lng' => -6.3731,
                'reported_lost_at' => now()->subHours(12),
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $sozi->id, 'name' => 'Misty'],
            [
                'user_id' => $sozi->id,
                'name' => 'Misty',
                'species' => 'Cat',
                'breed' => 'Ragdoll',
                'age' => '3',
                'gender' => 'Female',
                'weight' => 5,
                'notes' => 'Blue eyes and very gentle.',
                'eye_color' => 'Blue',
                'fur_type' => 'Long',
                'microchip_number' => 'MC200004',
                'diet' => 'Indoor wet food',
                'personality_traits' => 'Gentle, quiet',
                'status' => 'active',
                'photo_path' => 'pets/misty.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $bella->id, 'name' => 'Max'],
            [
                'user_id' => $bella->id,
                'name' => 'Max',
                'species' => 'Dog',
                'breed' => 'Labrador',
                'age' => '5',
                'gender' => 'Male',
                'weight' => 30,
                'notes' => 'Friendly family dog.',
                'eye_color' => 'Brown',
                'fur_type' => 'Short',
                'microchip_number' => 'MC200005',
                'diet' => 'Dry food',
                'personality_traits' => 'Friendly, obedient',
                'status' => 'active',
                'photo_path' => 'pets/max.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        Pet::updateOrCreate(
            ['user_id' => $bella->id, 'name' => 'Cleo'],
            [
                'user_id' => $bella->id,
                'name' => 'Cleo',
                'species' => 'Cat',
                'breed' => 'Bengal',
                'age' => '2',
                'gender' => 'Female',
                'weight' => 4.2,
                'notes' => 'Very energetic and curious.',
                'eye_color' => 'Green',
                'fur_type' => 'Short',
                'microchip_number' => 'MC200006',
                'diet' => 'High protein cat food',
                'personality_traits' => 'Energetic, curious',
                'status' => 'active',
                'photo_path' => 'pets/cleo.jpg',
                'is_lost' => false,
                'is_priority' => false,
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | FOUND REPORTS
        |--------------------------------------------------------------------------
        */

        FoundReport::updateOrCreate(
            [
                'reporter_name' => 'Aisha Khan',
                'location_found' => 'Phibsborough',
                'species' => 'Dog',
            ],
            [
                'user_id' => $aisha->id,
                'reporter_name' => 'Aisha Khan',
                'species' => 'Dog',
                'breed' => 'Beagle',
                'colour' => 'Brown and white',
                'description' => 'Small beagle found near the shops, very friendly.',
                'location_found' => 'Phibsborough',
                'found_at' => now()->subHours(6),
                'photo_path' => 'found_reports/beagle-found.jpg',
                'notes' => 'Wearing a red collar.',
            ]
        );

        FoundReport::updateOrCreate(
            [
                'reporter_name' => 'Sofia Ali',
                'location_found' => 'Kerry',
                'species' => 'Cat',
            ],
            [
                'user_id' => $sofia->id,
                'reporter_name' => 'Sofia Ali',
                'species' => 'Cat',
                'breed' => 'Domestic Short Hair',
                'colour' => 'White',
                'description' => 'White cat seen wandering near a housing estate.',
                'location_found' => 'Kerry',
                'found_at' => now()->subHours(10),
                'photo_path' => 'found_reports/white-cat-found.jpg',
                'notes' => 'Very calm and seemed used to people.',
            ]
        );

        /*
        |--------------------------------------------------------------------------
        | SIGHTINGS
        |--------------------------------------------------------------------------
        */

        Sighting::updateOrCreate(
            [
                'pet_id' => $nala->id,
                'location' => 'Phibsborough',
            ],
            [
                'pet_id' => $nala->id,
                'reported_by' => $liam->id,
                'location' => 'Phibsborough',
                'lat' => 53.3601,
                'lng' => -6.2725,
                'notes' => 'Saw a husky running across the road near the shops.',
                'photo_path' => 'sightings/nala-phibsborough.jpg',
                'owner_notified_at' => now()->subHours(4),
            ]
        );

        Sighting::updateOrCreate(
            [
                'pet_id' => $mars->id,
                'location' => 'Tallaght',
            ],
            [
                'pet_id' => $mars->id,
                'reported_by' => $aaira->id,
                'location' => 'Tallaght',
                'lat' => 53.2875,
                'lng' => -6.3698,
                'notes' => 'Looked like a dachshund near the bus stop.',
                'photo_path' => 'sightings/mars-tallaght.jpg',
                'owner_notified_at' => now()->subHours(3),
            ]
        );

        Sighting::updateOrCreate(
            [
                'pet_id' => $nala->id,
                'location' => 'O’Connell Street',
            ],
            [
                'pet_id' => $nala->id,
                'reported_by' => $sozi->id,
                'location' => 'O’Connell Street',
                'lat' => 53.3495,
                'lng' => -6.2600,
                'notes' => 'Possible sighting close to the last reported area.',
                'photo_path' => 'sightings/nala-oconnell-street.jpg',
                'owner_notified_at' => now()->subHours(2),
            ]
        );
    }
}