<?php

return [

    'dog' => [

        'groups' => [

            'retriever' => [
                'activity' => 'high',
                'grooming' => 'medium-high',
                'exercise' => 'Retrievers usually need 60–90 minutes of daily activity, including walks, play, and retrieval games.',
                'feeding' => 'Use measured portions because retriever breeds can gain weight easily.',
                'health' => 'Monitor hips, elbows, ears, skin condition, and body weight.',
                'care' => 'Use structured exercise, swimming where suitable, and puzzle toys to prevent boredom.',
            ],

            'herding' => [
                'activity' => 'very high',
                'grooming' => 'medium',
                'exercise' => 'Herding breeds usually need 60–90+ minutes of activity with training, play, and mental stimulation.',
                'feeding' => 'Adjust portions based on activity level because active herding breeds burn more energy.',
                'health' => 'Monitor joints, eyes, behaviour changes, and signs of under-stimulation.',
                'care' => 'Use training games, agility-style play, and problem-solving toys to keep this breed engaged.',
            ],

            'brachycephalic' => [
                'activity' => 'low-medium',
                'grooming' => 'medium',
                'exercise' => 'Use short, gentle walks and avoid intense exercise, especially in warm weather.',
                'feeding' => 'Use strict portion control because many flat-faced breeds are prone to weight gain.',
                'health' => 'Monitor breathing, heat tolerance, eyes, skin folds, and body weight.',
                'care' => 'Keep routines gentle, clean skin folds regularly, and avoid overexertion.',
            ],

            'hound' => [
                'activity' => 'medium-high',
                'grooming' => 'low-medium',
                'exercise' => 'Hound breeds benefit from daily walks, scent games, and safe off-lead activity in secure areas.',
                'feeding' => 'Use measured meals and monitor weight because some hounds are very food motivated.',
                'health' => 'Monitor ears, joints, dental care, and body condition.',
                'care' => 'Use scent-based enrichment and secure walking equipment because hounds may follow smells.',
            ],

            'terrier' => [
                'activity' => 'high',
                'grooming' => 'low-medium',
                'exercise' => 'Terriers usually need active daily play, walks, and training to manage their energy.',
                'feeding' => 'Use measured meals suitable for size and energy level.',
                'health' => 'Monitor teeth, knees, skin, and behaviour changes linked to boredom.',
                'care' => 'Use puzzle toys, training, and structured play to prevent destructive behaviour.',
            ],

            'toy' => [
                'activity' => 'low-medium',
                'grooming' => 'medium-high',
                'exercise' => 'Toy breeds need short daily walks and gentle indoor play.',
                'feeding' => 'Use small measured portions because small dogs can gain weight quickly.',
                'health' => 'Monitor teeth, knees, weight, and temperature sensitivity.',
                'care' => 'Provide dental care, warmth in cold weather, and gentle handling.',
            ],

            'giant' => [
                'activity' => 'medium',
                'grooming' => 'medium',
                'exercise' => 'Large and giant breeds need steady, controlled exercise rather than excessive jumping or intense activity.',
                'feeding' => 'Use balanced meals that support joints, growth, and healthy body condition.',
                'health' => 'Monitor hips, elbows, joints, heart health, and weight.',
                'care' => 'Use joint-friendly routines, avoid overfeeding, and keep exercise consistent.',
            ],

            'spitz' => [
                'activity' => 'high',
                'grooming' => 'high',
                'exercise' => 'Spitz breeds often need active daily walks, play, and mental stimulation.',
                'feeding' => 'Use balanced meals and adjust portions depending on activity level.',
                'health' => 'Monitor coat condition, eyes, joints, and heat tolerance.',
                'care' => 'Brush regularly and avoid intense exercise in warm weather.',
            ],

            'spaniel' => [
                'activity' => 'medium-high',
                'grooming' => 'high',
                'exercise' => 'Spaniels usually need around 60 minutes of walking, play, and scent-based activity each day.',
                'feeding' => 'Use measured meals and monitor body weight.',
                'health' => 'Monitor ears, eyes, skin, coat condition, and weight.',
                'care' => 'Clean ears regularly and brush the coat often.',
            ],

            'poodle' => [
                'activity' => 'medium-high',
                'grooming' => 'high',
                'exercise' => 'Poodle breeds need daily walks, play, and training because they are active and intelligent.',
                'feeding' => 'Adjust portions based on whether the pet is toy, miniature, or standard size.',
                'health' => 'Monitor ears, teeth, joints, coat condition, and weight.',
                'care' => 'Regular grooming is essential because poodle coats require consistent maintenance.',
            ],

            'dachshund' => [
                'activity' => 'medium',
                'grooming' => 'low-medium',
                'exercise' => 'Dachshunds need gentle daily exercise and should avoid repeated jumping or stairs where possible.',
                'feeding' => 'Keep weight controlled to reduce pressure on the back.',
                'health' => 'Monitor back strain, mobility, joints, and body weight carefully.',
                'care' => 'Use ramps or steps where possible to protect the spine.',
            ],

            'mixed' => [
                'activity' => 'varies',
                'grooming' => 'varies',
                'exercise' => 'Base exercise on age, size, weight, and activity level rather than breed alone.',
                'feeding' => 'Use measured portions and adjust based on weight trends.',
                'health' => 'Monitor weight, teeth, joints, coat condition, appetite, and behaviour changes.',
                'care' => 'Use health logs and activity trends to personalise care over time.',
            ],

            'default' => [
                'activity' => 'varies',
                'grooming' => 'varies',
                'exercise' => 'Use age, size, breed, and activity level to plan suitable daily exercise.',
                'feeding' => 'Use measured portions and monitor weight trends regularly.',
                'health' => 'Monitor dental care, hydration, joints, appetite, and body condition.',
                'care' => 'Keep vaccination, grooming, check-up, and health records updated.',
            ],
        ],

        'breed_groups' => [

            // Retrievers
            'labrador retriever' => 'retriever',
            'golden retriever' => 'retriever',
            'flat coated retriever' => 'retriever',
            'curly coated retriever' => 'retriever',
            'chesapeake bay retriever' => 'retriever',
            'nova scotia duck tolling retriever' => 'retriever',

            // Herding
            'border collie' => 'herding',
            'rough collie' => 'herding',
            'smooth collie' => 'herding',
            'bearded collie' => 'herding',
            'german shepherd' => 'herding',
            'australian shepherd' => 'herding',
            'australian cattle dog' => 'herding',
            'shetland sheepdog' => 'herding',
            'belgian shepherd' => 'herding',
            'belgian malinois' => 'herding',
            'old english sheepdog' => 'herding',
            'welsh corgi' => 'herding',
            'pembroke welsh corgi' => 'herding',
            'cardigan welsh corgi' => 'herding',

            // Brachycephalic / flat-faced
            'bulldog' => 'brachycephalic',
            'english bulldog' => 'brachycephalic',
            'french bulldog' => 'brachycephalic',
            'pug' => 'brachycephalic',
            'shih tzu' => 'brachycephalic',
            'boxer' => 'brachycephalic',
            'pekingese' => 'brachycephalic',
            'boston terrier' => 'brachycephalic',
            'lhasa apso' => 'brachycephalic',
            'cavalier king charles spaniel' => 'brachycephalic',

            // Hounds
            'beagle' => 'hound',
            'basset hound' => 'hound',
            'bloodhound' => 'hound',
            'greyhound' => 'hound',
            'whippet' => 'hound',
            'irish wolfhound' => 'giant',
            'afghan hound' => 'hound',
            'saluki' => 'hound',
            'dachshund' => 'dachshund',
            'rhodesian ridgeback' => 'hound',

            // Terriers
            'jack russell terrier' => 'terrier',
            'parson russell terrier' => 'terrier',
            'yorkshire terrier' => 'toy',
            'west highland white terrier' => 'terrier',
            'westie' => 'terrier',
            'scottish terrier' => 'terrier',
            'staffordshire bull terrier' => 'terrier',
            'staffy' => 'terrier',
            'bull terrier' => 'terrier',
            'airedale terrier' => 'terrier',
            'border terrier' => 'terrier',
            'fox terrier' => 'terrier',
            'irish terrier' => 'terrier',
            'cairn terrier' => 'terrier',

            // Toy / small companion
            'chihuahua' => 'toy',
            'maltese' => 'toy',
            'papillon' => 'toy',
            'pomeranian' => 'toy',
            'bichon frise' => 'toy',
            'havanese' => 'toy',
            'miniature pinscher' => 'toy',
            'toy poodle' => 'poodle',
            'miniature poodle' => 'poodle',

            // Giant / large working
            'rottweiler' => 'giant',
            'great dane' => 'giant',
            'saint bernard' => 'giant',
            'newfoundland' => 'giant',
            'bernese mountain dog' => 'giant',
            'mastiff' => 'giant',
            'bullmastiff' => 'giant',
            'doberman' => 'giant',
            'doberman pinscher' => 'giant',
            'akita' => 'giant',
            'cane corso' => 'giant',
            'great pyrenees' => 'giant',

            // Spitz / northern
            'siberian husky' => 'spitz',
            'husky' => 'spitz',
            'alaskan malamute' => 'spitz',
            'samoyed' => 'spitz',
            'shiba inu' => 'spitz',
            'japanese spitz' => 'spitz',
            'chow chow' => 'spitz',
            'keeshond' => 'spitz',

            // Spaniels
            'cocker spaniel' => 'spaniel',
            'english cocker spaniel' => 'spaniel',
            'springer spaniel' => 'spaniel',
            'english springer spaniel' => 'spaniel',
            'welsh springer spaniel' => 'spaniel',
            'king charles spaniel' => 'spaniel',

            // Poodles and poodle mixes
            'poodle' => 'poodle',
            'standard poodle' => 'poodle',
            'cockapoo' => 'poodle',
            'labradoodle' => 'poodle',
            'goldendoodle' => 'poodle',
            'cavapoo' => 'poodle',
            'maltipoo' => 'poodle',

            // Mixed
            'mixed breed' => 'mixed',
            'crossbreed' => 'mixed',
            'cross breed' => 'mixed',
            'mongrel' => 'mixed',
            'unknown' => 'mixed',
        ],
    ],

    'cat' => [

        'groups' => [

            'longhair' => [
                'activity' => 'low-medium',
                'grooming' => 'high',
                'exercise' => 'Encourage gentle indoor play, climbing spaces, and short daily activity sessions.',
                'feeding' => 'Use measured portions and monitor weight because indoor longhair cats can gain weight.',
                'health' => 'Monitor coat matting, hairballs, dental health, hydration, and weight.',
                'care' => 'Brush regularly to reduce tangles, matting, and hairballs.',
            ],

            'flat_faced' => [
                'activity' => 'low-medium',
                'grooming' => 'very high',
                'exercise' => 'Use gentle indoor play and avoid overexertion.',
                'feeding' => 'Use controlled portions and monitor weight carefully.',
                'health' => 'Monitor eyes, breathing, tear staining, coat matting, and dental health.',
                'care' => 'Daily brushing and eye cleaning are especially important.',
            ],

            'large_cat' => [
                'activity' => 'medium',
                'grooming' => 'high',
                'exercise' => 'Use climbing towers, interactive toys, and daily play to support movement.',
                'feeding' => 'Use portions suitable for a larger cat and monitor weight trends.',
                'health' => 'Monitor heart health, hips, joints, weight, and coat condition.',
                'care' => 'Provide strong climbing furniture and regular brushing.',
            ],

            'high_energy' => [
                'activity' => 'very high',
                'grooming' => 'low-medium',
                'exercise' => 'Provide active play, climbing, chasing games, and mental stimulation every day.',
                'feeding' => 'Use balanced meals suitable for a highly active cat.',
                'health' => 'Monitor weight, behaviour, digestion, and signs of boredom.',
                'care' => 'Use enrichment toys, climbing spaces, and regular play sessions.',
            ],

            'short_hair' => [
                'activity' => 'medium',
                'grooming' => 'low-medium',
                'exercise' => 'Use daily play, climbing areas, and interactive toys to support healthy activity.',
                'feeding' => 'Use measured portions and monitor weight trends.',
                'health' => 'Monitor dental health, hydration, litter habits, appetite, and weight.',
                'care' => 'Keep vaccinations, parasite control, and regular check-ups updated.',
            ],

            'hairless' => [
                'activity' => 'medium-high',
                'grooming' => 'special care',
                'exercise' => 'Use indoor play and climbing activities to keep activity levels healthy.',
                'feeding' => 'Use balanced meals and monitor body condition.',
                'health' => 'Monitor skin, temperature sensitivity, ears, and dental health.',
                'care' => 'Regular skin cleaning and warmth are important because this breed has no coat.',
            ],

            'joint_sensitive' => [
                'activity' => 'medium',
                'grooming' => 'medium',
                'exercise' => 'Use gentle daily play and avoid excessive jumping if stiffness or mobility issues appear.',
                'feeding' => 'Use controlled portions to reduce pressure on joints.',
                'health' => 'Monitor joints, stiffness, mobility, and body weight.',
                'care' => 'Keep routines gentle and watch movement carefully.',
            ],

            'mixed' => [
                'activity' => 'varies',
                'grooming' => 'varies',
                'exercise' => 'Base activity on age, weight, personality, and indoor/outdoor routine.',
                'feeding' => 'Use measured portions and monitor weight trends.',
                'health' => 'Monitor hydration, litter habits, dental health, coat condition, and behaviour changes.',
                'care' => 'Use health logs and reminders to personalise care over time.',
            ],

            'default' => [
                'activity' => 'varies',
                'grooming' => 'varies',
                'exercise' => 'Use daily play, climbing spaces, and interactive toys to support healthy activity.',
                'feeding' => 'Use measured portions and monitor weight trends regularly.',
                'health' => 'Monitor hydration, litter habits, dental health, appetite, and body condition.',
                'care' => 'Keep vaccination, grooming, check-up, and health records updated.',
            ],
        ],

        'breed_groups' => [

            // Longhair / high grooming
            'persian' => 'flat_faced',
            'ragdoll' => 'longhair',
            'maine coon' => 'large_cat',
            'norwegian forest cat' => 'large_cat',
            'siberian' => 'large_cat',
            'birman' => 'longhair',
            'himalayan' => 'flat_faced',
            'turkish angora' => 'longhair',
            'turkish van' => 'longhair',
            'domestic longhair' => 'longhair',

            // High energy
            'bengal' => 'high_energy',
            'siamese' => 'high_energy',
            'oriental shorthair' => 'high_energy',
            'abyssinian' => 'high_energy',
            'somali' => 'high_energy',
            'ocicat' => 'high_energy',
            'burmese' => 'high_energy',
            'cornish rex' => 'high_energy',
            'devon rex' => 'high_energy',

            // Short hair / common
            'british shorthair' => 'short_hair',
            'american shorthair' => 'short_hair',
            'domestic shorthair' => 'short_hair',
            'russian blue' => 'short_hair',
            'chartreux' => 'short_hair',
            'egyptian mau' => 'short_hair',
            'bombay' => 'short_hair',
            'korat' => 'short_hair',
            'tonkinese' => 'short_hair',

            // Special care
            'sphynx' => 'hairless',
            'peterbald' => 'hairless',
            'donskoy' => 'hairless',

            // Joint sensitive
            'scottish fold' => 'joint_sensitive',
            'munchkin' => 'joint_sensitive',

            // Mixed
            'mixed breed' => 'mixed',
            'domestic cat' => 'mixed',
            'moggie' => 'mixed',
            'unknown' => 'mixed',
        ],
    ],
];