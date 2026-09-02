<?php

namespace App\Services\Pdf;

use App\Models\Product;
use Illuminate\Http\UploadedFile;
use Smalot\PdfParser\Parser;

/**
 * Best-effort extraction of order lines from an uploaded PDF.
 *
 * PDF layouts vary too much to parse perfectly, so this returns a
 * preview (parsed product name/quantity + a best-guess product match)
 * for the user to review and correct before the order is actually
 * created — see OrderImportController::confirm().
 *
 * Recognised line shapes, tried in order:
 *   "Tên sản phẩm x2"            -> trailing "x<qty>"
 *   "Tên sản phẩm - SL: 2"       -> explicit "SL"/"Số lượng" label
 *   "Tên sản phẩm   2   50000"   -> columns separated by 2+ spaces/tabs
 * Anything else falls back to quantity = 1 with a low_confidence flag.
 */
class PdfOrderParser
{
    private const SKIP_PATTERNS = '/^(trang|page|tổng cộng|tong cong|stt|ghi chú|ghi chu|đơn hàng|don hang)\b/iu';

    public function parse(UploadedFile $file): array
    {
        $parser = new Parser;
        $pdf = $parser->parseFile($file->getRealPath());
        $text = trim($pdf->getText());

        $lines = collect(preg_split('/\r\n|\r|\n/', $text))
            ->map(fn ($line) => trim($line))
            ->filter(fn ($line) => $line !== '' && ! preg_match(self::SKIP_PATTERNS, $line))
            ->values();

        $products = Product::query()->select('id', 'name', 'price')->get();

        $items = $lines
            ->map(fn ($line) => $this->parseLine($line, $products))
            ->filter()
            ->values();

        return [
            'raw_text' => $text,
            'items' => $items->toArray(),
        ];
    }

    private function parseLine(string $line, \Illuminate\Support\Collection $products): ?array
    {
        $name = null;
        $quantity = null;
        $lowConfidence = false;

        if (preg_match('/^(.+?)\s*[xX×]\s*(\d+)\s*$/u', $line, $m)) {
            $name = trim($m[1]);
            $quantity = (int) $m[2];
        } elseif (preg_match('/^(.+?)[\s\-:]+(?:SL|Số lượng|So luong)[:\s]+(\d+)/iu', $line, $m)) {
            $name = trim($m[1]);
            $quantity = (int) $m[2];
        } else {
            $columns = preg_split('/\t|\s{2,}/u', $line);
            $columns = array_values(array_filter($columns, fn ($c) => trim($c) !== ''));

            if (count($columns) >= 2) {
                $numericIndex = null;
                foreach ($columns as $i => $col) {
                    if ($i > 0 && preg_match('/^\d+$/', trim($col))) {
                        $numericIndex = $i;
                        break;
                    }
                }

                if ($numericIndex !== null) {
                    $name = trim($columns[0]);
                    $quantity = (int) trim($columns[$numericIndex]);
                }
            }
        }

        if ($name === null) {
            $name = $line;
            $quantity = 1;
            $lowConfidence = true;
        }

        if ($name === '' || $quantity < 1) {
            return null;
        }

        $match = $this->matchProduct($name, $products);

        return [
            'line_raw' => $line,
            'product_name' => $name,
            'quantity' => $quantity,
            'low_confidence' => $lowConfidence || $match === null,
            'matched_product_id' => $match?->id,
            'matched_product_name' => $match?->name,
            'unit_price' => $match?->price,
        ];
    }

    private function matchProduct(string $name, \Illuminate\Support\Collection $products): ?Product
    {
        $normalized = mb_strtolower(trim($name));

        $exact = $products->first(fn (Product $p) => mb_strtolower($p->name) === $normalized);
        if ($exact) {
            return $exact;
        }

        return $products
            ->filter(fn (Product $p) => str_contains($normalized, mb_strtolower($p->name))
                || str_contains(mb_strtolower($p->name), $normalized))
            ->sortByDesc(fn (Product $p) => mb_strlen($p->name))
            ->first();
    }
}
