<?php

namespace App\Http\Controllers\Api;

use App\Exports\OrderPackingListExport;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreOrderRequest;
use App\Http\Requests\UpdateOrderRequest;
use App\Http\Requests\UpdateOrderStatusRequest;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\OrderService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class OrderController extends Controller
{
    public function __construct(private readonly OrderService $orders)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = Order::withCount('items');

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('order_code', 'like', "%{$search}%")
                    ->orWhere('customer_name', 'like', "%{$search}%");
            });
        }

        if ($from = $request->query('date_from')) {
            $query->whereDate('order_date', '>=', $from);
        }

        if ($to = $request->query('date_to')) {
            $query->whereDate('order_date', '<=', $to);
        }

        $perPage = (int) $request->query('per_page', 15);
        $orders = $query->orderByDesc('order_date')->orderByDesc('id')->paginate($perPage);

        return response()->json([
            'data' => OrderResource::collection($orders->items()),
            'meta' => [
                'current_page' => $orders->currentPage(),
                'last_page' => $orders->lastPage(),
                'per_page' => $orders->perPage(),
                'total' => $orders->total(),
            ],
        ]);
    }

    public function store(StoreOrderRequest $request): JsonResponse
    {
        $order = $this->orders->create($request->validated(), $request->user()?->id);

        return response()->json(new OrderResource($order), 201);
    }

    public function show(Order $order): JsonResponse
    {
        return response()->json(new OrderResource($order->load('items')));
    }

    public function update(UpdateOrderRequest $request, Order $order): JsonResponse
    {
        $order = $this->orders->update($order, $request->validated());

        return response()->json(new OrderResource($order));
    }

    public function updateStatus(UpdateOrderStatusRequest $request, Order $order): JsonResponse
    {
        $order = $this->orders->updateStatus($order, $request->validated()['status']);

        return response()->json(new OrderResource($order));
    }

    public function destroy(Order $order): JsonResponse
    {
        $this->orders->delete($order);

        return response()->json(null, 204);
    }

    public function exportExcel(Order $order): BinaryFileResponse
    {
        $order->load('items');

        return Excel::download(
            new OrderPackingListExport($order),
            "phieu-soan-kho-{$order->order_code}.xlsx"
        );
    }
}
