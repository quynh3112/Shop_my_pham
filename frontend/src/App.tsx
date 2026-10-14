import './App.css'
import { Button, Result } from 'antd'
import { BrowserRouter, Link, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import MainLayout from './component/mainLayout'
import RequireAuth from './component/requireAuth'
import AdminLayout, { AdminHome } from './layouts/admin.layout'
import RequirePermission from './component/requirePermission'
import MnStaff from './pages/mnStaff'
import MnCustomer from './pages/mnCustomer'
import MomoPayment from './pages/momoPayment'
import Cart from './pages/cart'
import Checkout from './pages/checkout'
import DetailProduct from './pages/detailProduct'
import Favorites from './pages/favorites'
import Home from './pages/home'
import MnBanner from './pages/mnBanner'
import MnChat from './pages/mnChat'
import MnReport from './pages/mnReport'
import MnOrder from './pages/mnOrder'
import MnCategory from './pages/mnCategory'
import MnInventory from './pages/mnInventory'
import MnProduct from './pages/mnProduct'
import MyOrders from './pages/myOrders'
import News from './pages/news'
import OrderDetail from './pages/orderDetail'
import OrderSuccess from './pages/orderSuccess'
import Products from './pages/products'
import SkinAnalysisPage from './pages/skinAnalysis'
import type { ProductQuery } from './types/product'

function ProductDetailRoute() {
  const { productId } = useParams()
  return <DetailProduct key={productId} productId={Number(productId)} />
}

function ProductsRoute() {
  const [searchParams] = useSearchParams()
  const categoryId = Number(searchParams.get('categoryId'))
  const sort = searchParams.get('sort') as ProductQuery['sort'] | null
  const query: ProductQuery = {
    search: searchParams.get('search') || undefined,
    categoryId: Number.isInteger(categoryId) && categoryId > 0 ? categoryId : undefined,
    sort: sort || undefined,
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
          <Route path="/news" element={<News />} />

          <Route element={<RequireAuth />}>
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/order-success/:code" element={<OrderSuccess />} />
            <Route path="/orders" element={<MyOrders />} />
            <Route path="/orders/:code" element={<OrderDetail />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/skin-analysis" element={<SkinAnalysisPage />} />
            <Route path="/skin-analysis/:id" element={<SkinAnalysisPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>

        {/* Cổng thanh toán MoMo giả lập: trang riêng, không có header cửa hàng */}
        <Route element={<RequireAuth />}>
          <Route path="/payment/momo/:code" element={<MomoPayment />} />
        </Route>

        {/* Khu quản lý: ADMIN + nhân viên; từng trang kiểm tra quyền riêng */}
        <Route path="/admin" element={<RequireAuth staffArea />}>
          <Route element={<AdminLayout />}>
            <Route index element={<AdminHome />} />
            <Route path="products" element={<RequirePermission access="products"><MnProduct /></RequirePermission>} />
            <Route path="categories" element={<RequirePermission access="categories"><MnCategory /></RequirePermission>} />
            <Route path="inventory" element={<RequirePermission access="inventory"><MnInventory /></RequirePermission>} />
            <Route path="banners" element={<RequirePermission access="banners"><MnBanner /></RequirePermission>} />
            <Route path="orders" element={<RequirePermission access="orders"><MnOrder /></RequirePermission>} />
            <Route path="customers" element={<RequirePermission access="customers"><MnCustomer /></RequirePermission>} />
            <Route path="chat" element={<RequirePermission access="chat"><MnChat /></RequirePermission>} />
            <Route path="reports" element={<RequirePermission access="reports"><MnReport /></RequirePermission>} />
            <Route path="staff" element={<RequirePermission access="admin"><MnStaff /></RequirePermission>} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
