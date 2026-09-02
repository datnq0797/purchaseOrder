<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class DashboardController extends Controller
{
    public function summary(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 30);
        $since = Carbon::now()->subDays($days)->startOfDay();

        $revenue = Order::where('status', 'completed')
            ->where('order_date', '>=', $since)
            ->sum('total_amount');

        $ordersCount = Order::where('order_date', '>=', $since)->count();

        return response()->json([
            'revenue' => (int) $revenue,
            'orders_count' => $ordersCount,
            'products_count' => Product::count(),
            'low_stock_count' => Product::whereColumn('stock_quantity', '<=', 'min_stock')->count(),
            'period_days' => $days,
        ]);
    }

    public function revenueByTime(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 30);
        $since = Carbon::now()->subDays($days - 1)->startOfDay();

        $rows = Order::selectRaw('order_date, SUM(total_amount) as revenue, COUNT(*) as orders_count')
            ->where('status', '!=', 'cancelled')
            ->where('order_date', '>=', $since)
            ->groupBy('order_date')
            ->orderBy('order_date')
            ->get()
            ->keyBy(fn ($row) => $row->order_date->format('Y-m-d'));

        $series = collect();
        for ($i = 0; $i < $days; $i++) {
            $date = $since->copy()->addDays($i)->format('Y-m-d');
            $row = $rows->get($date);

            $series->push([
                'date' => $date,
                'revenue' => $row ? (int) $row->revenue : 0,
                'orders_count' => $row ? (int) $row->orders_count : 0,
            ]);
        }

        return response()->json($series);
    }

    public function ordersByStatus(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 30);
        $since = Carbon::now()->subDays($days)->startOfDay();

        $rows = Order::selectRaw('status, COUNT(*) as count')
            ->where('order_date', '>=', $since)
            ->groupBy('status')
            ->get();

        return response()->json($rows);
    }

    public function stockOverview(Request $request): JsonResponse
    {
        $limit = (int) $request->query('limit', 10);

        $products = Product::query()
            ->select('id', 'name', 'stock_quantity', 'min_stock')
            ->orderBy('stock_quantity')
            ->limit($limit)
            ->get();

        return response()->json($products);
    }

    public function topProducts(Request $request): JsonResponse
    {
        $days = (int) $request->query('days', 30);
        $limit = (int) $request->query('limit', 5);
        $since = Carbon::now()->subDays($days)->startOfDay();

        $rows = OrderItem::query()
            ->selectRaw('order_items.product_id, order_items.product_name, SUM(order_items.quantity) as total_quantity, SUM(order_items.subtotal) as total_revenue')
            ->join('orders', 'orders.id', '=', 'order_items.order_id')
            ->where('orders.status', '!=', 'cancelled')
            ->where('orders.order_date', '>=', $since)
            ->groupBy('order_items.product_id', 'order_items.product_name')
            ->orderByDesc('total_quantity')
            ->limit($limit)
            ->get();

        return response()->json($rows);
    }
}
