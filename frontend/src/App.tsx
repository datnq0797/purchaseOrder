import { Toaster } from 'react-hot-toast'
import { Navigate, Route, BrowserRouter, Routes } from 'react-router-dom'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthProvider } from '@/context/AuthContext'
import { CategoriesPage } from '@/pages/CategoriesPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { LoginPage } from '@/pages/LoginPage'
import { OrderFormPage } from '@/pages/OrderFormPage'
import { OrderImportPage } from '@/pages/OrderImportPage'
import { OrdersPage } from '@/pages/OrdersPage'
import { ProductFormPage } from '@/pages/ProductFormPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ProtectedRoute } from '@/routes/ProtectedRoute'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster position="top-right" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<DashboardPage />} />

              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/orders/create" element={<OrderFormPage />} />
              <Route path="/orders/import" element={<OrderImportPage />} />
              <Route path="/orders/:id/edit" element={<OrderFormPage />} />

              <Route path="/products" element={<ProductsPage />} />
              <Route path="/products/create" element={<ProductFormPage />} />
              <Route path="/products/:id/edit" element={<ProductFormPage />} />

              <Route path="/categories" element={<CategoriesPage />} />
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
