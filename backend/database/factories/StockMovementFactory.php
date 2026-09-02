<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\StockMovement>
 */
class StockMovementFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'type' => fake()->randomElement(['in', 'out']),
            'quantity' => fake()->numberBetween(1, 20),
            'reference_type' => null,
            'reference_id' => null,
            'note' => null,
            'created_at' => fake()->dateTimeBetween('-3 months', 'now'),
        ];
    }
}
