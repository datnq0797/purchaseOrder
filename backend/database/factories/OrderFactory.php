<?php

namespace Database\Factories;

use App\Models\Order;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<\App\Models\Order>
 */
class OrderFactory extends Factory
{
    public function definition(): array
    {
        $orderDate = fake()->dateTimeBetween('-3 months', 'now');

        return [
            'order_code' => 'DH'.$orderDate->format('ymd').strtoupper(fake()->unique()->bothify('##??')),
            'customer_name' => fake()->name(),
            'customer_phone' => fake()->numerify('09########'),
            'customer_address' => fake()->address(),
            'status' => fake()->randomElement(Order::STATUSES),
            'order_date' => $orderDate,
            'total_amount' => 0,
            'notes' => fake()->optional()->sentence(),
            'created_by' => null,
        ];
    }
}
