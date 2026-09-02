<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ImportPdfConfirmRequest;
use App\Http\Resources\OrderResource;
use App\Services\OrderService;
use App\Services\Pdf\PdfOrderParser;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderImportController extends Controller
{
    public function __construct(
        private readonly PdfOrderParser $parser,
        private readonly OrderService $orders,
    ) {
    }

    /**
     * Step 1: upload a PDF and return the parsed preview (no order is
     * created yet — PDF parsing is best-effort and needs user review).
     */
    public function parse(Request $request): JsonResponse
    {
        $request->validate([
            'file' => ['required', 'file', 'mimes:pdf', 'max:10240'],
        ]);

        $result = $this->parser->parse($request->file('file'));

        return response()->json($result);
    }

    /**
     * Step 2: create the real order from the user-reviewed/corrected items.
     */
    public function confirm(ImportPdfConfirmRequest $request): JsonResponse
    {
        $order = $this->orders->create([
            ...$request->validated(),
            'status' => 'pending',
        ], $request->user()?->id);

        return response()->json(new OrderResource($order), 201);
    }
}
