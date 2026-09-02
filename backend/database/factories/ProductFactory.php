<?php

namespace Database\Factories;

use App\Models\Category;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<\App\Models\Product>
 */
class ProductFactory extends Factory
{
    public function definition(): array
    {
        $name = fake()->unique()->words(3, true);
        $cost = fake()->numberBetween(10, 500) * 1000;

        return [
            'category_id' => Category::factory(),
            'name' => Str::title($name),
            'sku' => strtoupper(Str::random(3)).'-'.fake()->unique()->numberBetween(1000, 9999),
            'unit' => fake()->randomElement(['cái', 'hộp', 'thùng', 'kg', 'bộ']),
            'cost_price' => $cost,
            'price' => (int) ($cost * fake()->randomFloat(2, 1.2, 1.8)),
            'stock_quantity' => fake()->numberBetween(0, 300),
            'min_stock' => fake()->numberBetween(5, 30),
            'image_path' => null,
            'description' => fake()->optional()->sentence(),
            'is_active' => true,
        ];
    }
}
