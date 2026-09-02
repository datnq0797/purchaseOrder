# Purchase Order Dashboard

Dashboard quản lý đơn hàng và tồn kho: thống kê doanh số/đơn hàng/tồn kho bằng biểu đồ, CRUD đơn hàng và sản phẩm, xuất phiếu soạn kho ra Excel, nhập đơn hàng từ file PDF.

## Tech stack

- **Backend**: Laravel 12 (API-only), MySQL, Laravel Sanctum (Bearer token), Laravel Excel, smalot/pdfparser
- **Frontend**: React 19 + TypeScript + Vite, Tailwind CSS v4, React Router, Recharts, React Hook Form + Zod

## Cấu trúc thư mục

```
backend/    Laravel REST API
frontend/   React SPA
```

## Yêu cầu môi trường

- PHP >= 8.2, Composer
- Node.js >= 20, npm
- MySQL đang chạy (XAMPP hoặc tương đương)

## Cài đặt

### 1. Backend

```bash
cd backend
composer install
cp .env.example .env
php artisan key:generate
```

Tạo database MySQL (mặc định `.env` trỏ tới `purchase_order_db`, user `root`, không mật khẩu — chỉnh lại `DB_*` trong `backend/.env` nếu khác):

```sql
CREATE DATABASE purchase_order_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

Chạy migration + seed dữ liệu mẫu (8 danh mục, 48 sản phẩm, 90 đơn hàng trải 3 tháng):

```bash
php artisan migrate --seed
```

Chạy server:

```bash
php artisan serve
# API chạy tại http://127.0.0.1:8000
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env   # VITE_API_URL mặc định trỏ tới http://127.0.0.1:8000/api
npm run dev
# App chạy tại http://localhost:5173
```

## Tài khoản test

```
Email:    admin@example.com
Password: password
```

## Tính năng chính

- **Dashboard**: doanh số theo thời gian (line chart), đơn hàng theo trạng thái (pie chart), tồn kho thấp nhất (bar chart), top sản phẩm bán chạy (bar chart), KPI cards.
- **Đơn hàng**: CRUD đầy đủ, đổi trạng thái (chờ xử lý / đang xử lý / hoàn thành / đã hủy), tìm kiếm/lọc/phân trang. Tạo/sửa đơn hàng và hủy đơn sẽ tự động trừ/hoàn tồn kho tương ứng.
- **Xuất phiếu soạn kho**: xuất file Excel (.xlsx) cho từng đơn hàng.
- **Nhập đơn hàng từ PDF**: tải lên PDF, hệ thống tự nhận diện dòng sản phẩm/số lượng và cố khớp với sản phẩm có sẵn — người dùng xem lại/chỉnh sửa trước khi xác nhận tạo đơn (vì việc đọc PDF không thể chính xác 100% với mọi định dạng).
- **Sản phẩm & Danh mục**: CRUD, cảnh báo sắp hết hàng, mỗi sản phẩm có giá bán lẻ/bán sỉ riêng (bảng `product_prices`).

## Kiểm thử

```bash
cd backend
php artisan test        # 9 feature test: auth + logic trừ/hoàn tồn kho

cd frontend
npx tsc -b --noEmit      # type-check
npm run build             # production build
```

## Ghi chú

- Auth dùng Sanctum **token-based** (Bearer), không dùng cookie — đơn giản hơn cho SPA chạy khác port với API trong môi trường dev.
- Parser PDF là best-effort: nhận diện các dòng dạng `Tên sản phẩm x2`, `Tên sản phẩm - SL: 2`, hoặc dạng cột cách nhau ≥2 khoảng trắng/tab. Dòng không khớp mẫu nào sẽ được đánh dấu `low_confidence` để người dùng tự chỉnh trong bước xem trước.
