<?php

namespace App\Services;

use App\Models\Order;
use App\Models\Product;
use App\Models\StockMovement;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

/**
 * Encapsulates order write operations and the stock-movement side effects
 * that come with them: creating/updating a non-cancelled order commits
 * (deducts) stock, cancelling or deleting one releases it back.
 */
class OrderService
{
    public function create(array $data, ?int $userId = null): Order
    {
        return DB::transaction(function () use ($data, $userId) {
            $order = Order::create([
                'order_code' => $this->generateOrderCode($data['order_date']),
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'status' => $data['status'],
                'order_date' => $data['order_date'],
                'notes' => $data['notes'] ?? null,
                'total_amount' => 0,
                'created_by' => $userId,
            ]);

            $this->syncItems($order, $data['items']);

            return $order->fresh('items');
        });
    }

    public function update(Order $order, array $data): Order
    {
        return DB::transaction(function () use ($order, $data) {
            if ($order->status !== 'cancelled') {
                $this->releaseStock($order);
            }

            $order->items()->delete();

            $order->update([
                'customer_name' => $data['customer_name'],
                'customer_phone' => $data['customer_phone'] ?? null,
                'customer_address' => $data['customer_address'] ?? null,
                'status' => $data['status'],
                'order_date' => $data['order_date'],
                'notes' => $data['notes'] ?? null,
            ]);

            $this->syncItems($order, $data['items']);

            return $order->fresh('items');
        });
    }

    public function updateStatus(Order $order, string $newStatus): Order
    {
        if ($newStatus === $order->status) {
            return $order;
        }

        return DB::transaction(function () use ($order, $newStatus) {
            if ($newStatus === 'cancelled') {
                $this->releaseStock($order);
            } elseif ($order->status === 'cancelled') {
                $this->commitStock($order);
            }

            $order->update(['status' => $newStatus]);

            return $order->fresh('items');
        });
    }

    public function delete(Order $order): void
    {
        DB::transaction(function () use ($order) {
            if ($order->status !== 'cancelled') {
                $this->releaseStock($order);
            }

            $order->delete();
        });
    }

    /**
     * Replace an order's items, snapshotting each product's current price,
     * and deduct stock for the new items unless the order is cancelled.
     */
    private function syncItems(Order $order, array $items): void
    {
        $total = 0;

        foreach ($items as $item) {
            $product = Product::findOrFail($item['product_id']);
            $quantity = (int) $item['quantity'];
            $subtotal = $quantity * $product->price;
            $total += $subtotal;

            $order->items()->create([
                'product_id' => $product->id,
                'product_name' => $product->name,
                'quantity' => $quantity,
                'unit_price' => $product->price,
                'subtotal' => $subtotal,
            ]);

            if ($order->status !== 'cancelled') {
                $this->adjustStock(
                    $product,
                    -$quantity,
                    'order',
                    $order->id,
                    "Xuất kho cho đơn {$order->order_code}"
                );
            }
        }

        $order->update(['total_amount' => $total]);
    }

    private function releaseStock(Order $order): void
    {
        foreach ($order->items as $item) {
            if (! $item->product) {
                continue;
            }

            $this->adjustStock(
                $item->product,
                $item->quantity,
                'order',
                $order->id,
                "Hoàn kho do hủy/sửa đơn {$order->order_code}"
            );
        }
    }

    private function commitStock(Order $order): void
    {
        foreach ($order->items as $item) {
            if (! $item->product) {
                continue;
            }

            $this->adjustStock(
                $item->product,
                -$item->quantity,
                'order',
                $order->id,
                "Xuất kho cho đơn {$order->order_code}"
            );
        }
    }

    private function adjustStock(Product $product, int $delta, string $referenceType, int $referenceId, string $note): void
    {
        if ($delta < 0 && $product->stock_quantity + $delta < 0) {
            throw ValidationException::withMessages([
                'items' => "Sản phẩm \"{$product->name}\" không đủ tồn kho (còn {$product->stock_quantity}).",
            ]);
        }

        $product->increment('stock_quantity', $delta);

        StockMovement::create([
            'product_id' => $product->id,
            'type' => $delta >= 0 ? 'in' : 'out',
            'quantity' => abs($delta),
            'reference_type' => $referenceType,
            'reference_id' => $referenceId,
            'note' => $note,
            'created_at' => now(),
        ]);
    }

    private function generateOrderCode(string $orderDate): string
    {
        $prefix = 'DH'.date('ymd', strtotime($orderDate));

        do {
            $code = $prefix.strtoupper(Str::random(4));
        } while (Order::where('order_code', $code)->exists());

        return $code;
    }
}
