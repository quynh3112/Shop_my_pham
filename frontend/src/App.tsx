import './App.css'
import { Button, Result } from 'antd'
import { BrowserRouter, Link, Navigate, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import MainLayout from './component/mainLayout'
import RequireAuth from './component/requireAuth'
import AdminLayout from './layouts/admin.layout'
import Cart from './pages/cart'
import DetailProduct from './pages/detailProduct'
import Home from './pages/home'
import MnBanner from './pages/mnBanner'
import MnProduct from './pages/mnProduct'
import Products from './pages/products'
import type { ProductQuery } from './types/product'

function ProductDetailRoute() {
  const { productId } = useParams()
  return <DetailProduct key={productId} productId={Number(productId)} />
}

function ProductsRoute() {
  const [searchParams] = useSearchParams()
  const categoryId = Number(searchParams.get('categoryId'))
  const query: ProductQuery = {
    search: searchParams.get('search') || undefined,
    categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined,
  }
  // key theo query để bộ lọc khởi tạo lại khi đổi danh mục / từ khoá
  return <Products key={searchParams.toString()} query={query} />
}

function NotFound() {
  return (
    <Result
      status="404"
      title="Không tìm thấy trang"
      subTitle="Trang bạn tìm không tồn tại."
      extra={
        <Link to="/">
          <Button type="primary">Về trang chủ</Button>
        </Link>
      }
    />
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductsRoute />} />
          <Route path="/product/:productId" element={<ProductDetailRoute />} />

          <Route element={<RequireAuth />}>
            <Route path="/cart" element={<Cart />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        <Route path="/admin" element={<RequireAuth adminOnly />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Navigate to="products" replace />} />
            <Route path="products" element={<MnProduct />} />
            <Route path="banners" element={<MnBanner />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
