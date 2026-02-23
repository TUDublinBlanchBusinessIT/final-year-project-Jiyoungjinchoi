<?php

namespace Database\Seeders;

use App\Models\Provider;
use Illuminate\Database\Seeder;

class ProviderSeeder extends Seeder
{
    public function run(): void
    {
        $data = [
            [
                'name' => 'Happy Paws Vet Clinic',
                'type' => 'vet',
                'address' => 'Main Street',
                'county' => 'Dublin',
                'phone' => '01 123 4567',
                'email' => 'contact@happypawsvet.ie',
            ],
            [
                'name' => 'Cork Animal Care',
                'type' => 'vet',
                'address' => 'River Road',
                'county' => 'Cork',
                'phone' => '021 555 0000',
                'email' => 'hello@corkaninalcare.ie',
            ],
            [
                'name' => 'Fresh Fur Grooming',
                'type' => 'groomer',
                'address' => 'Park Avenue',
                'county' => 'Dublin',
                'phone' => '01 222 3333',
                'email' => 'book@freshfur.ie',
            ],
            [
                'name' => 'Galway Groom Studio',
                'type' => 'groomer',
                'address' => 'Harbour Lane',
                'county' => 'Galway',
                'phone' => '091 777 888',
                'email' => 'info@galwaygroom.ie',
            ],
        ];

        foreach ($data as $item) {
            Provider::updateOrCreate(
                ['name' => $item['name'], 'type' => $item['type']],
                $item
            );
        }
    }
}