<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_an_order_deducts_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 10, 'price' => 50000]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'Test Customer',
            'status' => 'pending',
            'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ]);

        $response->assertCreated();
        $this->assertEquals(7, $product->fresh()->stock_quantity);
        $this->assertEquals(150000, $response->json('total_amount'));
    }

    public function test_cancelling_an_order_restores_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 10, 'price' => 50000]);

        $order = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'Test Customer',
            'status' => 'pending',
            'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 3],
            ],
        ])->json();

        $this->assertEquals(7, $product->fresh()->stock_quantity);

        $this->actingAs($user, 'sanctum')
            ->patchJson("/api/orders/{$order['id']}/status", ['status' => 'cancelled'])
            ->assertOk();

        $this->assertEquals(10, $product->fresh()->stock_quantity);
    }

    public function test_creating_an_order_fails_when_stock_is_insufficient(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 2]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'Test Customer',
            'status' => 'pending',
            'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 5],
            ],
        ]);

        $response->assertStatus(422);
        $this->assertEquals(2, $product->fresh()->stock_quantity);
    }

    public function test_deleting_an_order_restores_stock(): void
    {
        $user = User::factory()->create();
        $product = Product::factory()->create(['stock_quantity' => 10]);

        $order = $this->actingAs($user, 'sanctum')->postJson('/api/orders', [
            'customer_name' => 'Test Customer',
            'status' => 'processing',
            'order_date' => now()->toDateString(),
            'items' => [
                ['product_id' => $product->id, 'quantity' => 4],
            ],
        ])->json();

        $this->actingAs($user, 'sanctum')
            ->deleteJson("/api/orders/{$order['id']}")
            ->assertNoContent();

        $this->assertEquals(10, $product->fresh()->stock_quantity);
    }
}
