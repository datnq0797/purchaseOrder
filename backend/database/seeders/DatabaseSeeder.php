<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductPrice;
use App\Models\StockMovement;
use App\Models\User;
use Illuminate\Support\Str;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with an admin account and a few
     * months of realistic sample data so the dashboard charts have
     * something meaningful to render out of the box.
     */
    public function run(): void
    {
        $admin = User::factory()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => bcrypt('password'),
        ]);

        $categories = collect([
            'Đồ điện tử', 'Văn phòng phẩm', 'Gia dụng', 'Thực phẩm khô',
            'Đồ uống', 'Mỹ phẩm', 'Dụng cụ sửa chữa', 'Đồ chơi',
        ])->map(fn (string $name) => Category::create([
            'name' => $name,
            'slug' => Str::slug($name),
        ]));

        $products = $categories->flatMap(function (Category $category) {
            return Product::factory(6)->create([
                'category_id' => $category->id,
            ]);
        });

        // Give every product a retail + wholesale price row so the
        // "Giá" table is populated with history from day one.
        $products->each(function (Product $product) {
            ProductPrice::create([
                'product_id' => $product->id,
                'price_type' => 'retail',
                'price' => $product->price,
                'effective_from' => now()->subMonths(3),
            ]);
            ProductPrice::create([
                'product_id' => $product->id,
                'price_type' => 'wholesale',
                'price' => (int) ($product->price * 0.85),
                'effective_from' => now()->subMonths(3),
            ]);

            StockMovement::create([
                'product_id' => $product->id,
                'type' => 'in',
                'quantity' => $product->stock_quantity,
                'reference_type' => 'initial_stock',
                'note' => 'Nhập kho ban đầu',
                'created_at' => now()->subMonths(3),
            ]);
        });

        // Spread 90 orders across the last 3 months so the dashboard's
        // time-series/status/top-product charts have real variation.
        for ($i = 0; $i < 90; $i++) {
            $orderDate = now()->subDays(fake()->numberBetween(0, 89));
            $status = fake()->randomElement(['pending', 'processing', 'completed', 'completed', 'completed', 'cancelled']);

            $order = Order::create([
                'order_code' => 'DH'.$orderDate->format('ymd').strtoupper(Str::random(4)),
                'customer_name' => fake()->name(),
                'customer_phone' => fake()->numerify('09########'),
                'customer_address' => fake()->address(),
                'status' => $status,
                'order_date' => $orderDate,
                'total_amount' => 0,
                'notes' => fake()->optional()->sentence(),
                'created_by' => $admin->id,
            ]);

            $itemCount = fake()->numberBetween(1, 5);
            $orderProducts = $products->random($itemCount);
            $total = 0;

            foreach ($orderProducts as $product) {
                $quantity = fake()->numberBetween(1, 8);
                $subtotal = $quantity * $product->price;
                $total += $subtotal;

                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'quantity' => $quantity,
                    'unit_price' => $product->price,
                    'subtotal' => $subtotal,
                ]);

                if ($status !== 'cancelled') {
                    StockMovement::create([
                        'product_id' => $product->id,
                        'type' => 'out',
                        'quantity' => $quantity,
                        'reference_type' => 'order',
                        'reference_id' => $order->id,
                        'note' => 'Xuất kho cho đơn '.$order->order_code,
                        'created_at' => $orderDate,
                    ]);
                }
            }

            $order->update(['total_amount' => $total]);
        }
    }
}
