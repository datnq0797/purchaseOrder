<?php

namespace Database\Factories;

use App\Models\Product;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\ProductPrice>
 */
class ProductPriceFactory extends Factory
{
    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'price_type' => 'retail',
            'price' => fake()->numberBetween(10, 800) * 1000,
            'effective_from' => fake()->dateTimeBetween('-6 months', 'now'),
        ];
    }
}
