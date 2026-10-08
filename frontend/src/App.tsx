import './App.css'
import DetailProduct from './pages/detailProduct'
import Home from './pages/home'
import MnBanner from './pages/mnBanner'

function App() {
  // Chưa có router: /admin/banner là trang quản lý banner,
  // /product/<id> là chi tiết sản phẩm, còn lại là trang chủ
  const path = window.location.pathname
  if (path.startsWith('/admin/banner')) {
    return <MnBanner/>
  }
  const productMatch = path.match(/^\/product\/(\d+)/)
  if (productMatch) {
    return <DetailProduct productId={Number(productMatch[1])} />
  }
  return (
    <Home/>
  )}

export default App
