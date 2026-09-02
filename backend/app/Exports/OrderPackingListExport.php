<?php

namespace App\Exports;

use App\Models\Order;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithEvents;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Events\AfterSheet;
use PhpOffice\PhpSpreadsheet\Style\Alignment;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

/**
 * "Phiếu soạn kho" (warehouse picking list) for a single order: one row
 * per line item so warehouse staff can pick and check off products.
 */
class OrderPackingListExport implements FromArray, WithEvents, WithHeadings, WithStyles
{
    public function __construct(private readonly Order $order)
    {
    }

    public function array(): array
    {
        return $this->order->items->map(fn ($item, $index) => [
            $index + 1,
            $item->product_name,
            $item->product?->sku ?? '-',
            $item->quantity,
            $item->product?->unit ?? '-',
            '',
        ])->toArray();
    }

    public function headings(): array
    {
        return ['STT', 'Tên sản phẩm', 'SKU', 'Số lượng', 'Đơn vị', 'Ghi chú'];
    }

    public function styles(Worksheet $sheet): array
    {
        return [
            1 => ['font' => ['bold' => true]],
        ];
    }

    public function registerEvents(): array
    {
        return [
            AfterSheet::class => function (AfterSheet $event) {
                $sheet = $event->sheet->getDelegate();
                $order = $this->order;

                $sheet->insertNewRowBefore(1, 4);
                $sheet->setCellValue('A1', 'PHIẾU SOẠN KHO');
                $sheet->setCellValue('A2', "Đơn hàng: {$order->order_code}");
                $sheet->setCellValue('A3', "Khách hàng: {$order->customer_name} - Ngày đặt: {$order->order_date->format('d/m/Y')}");

                $sheet->mergeCells('A1:F1');
                $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(14);
                $sheet->getStyle('A1')->getAlignment()->setHorizontal(Alignment::HORIZONTAL_CENTER);

                $lastRow = $sheet->getHighestRow();
                $sheet->getStyle("A5:F5")->getFont()->setBold(true);
                $sheet->getStyle("A5:F{$lastRow}")->getBorders()->getAllBorders()
                    ->setBorderStyle(\PhpOffice\PhpSpreadsheet\Style\Border::BORDER_THIN);

                foreach (range('A', 'F') as $column) {
                    $sheet->getColumnDimension($column)->setAutoSize(true);
                }
            },
        ];
    }
}
