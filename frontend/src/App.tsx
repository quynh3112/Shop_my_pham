import './App.css'
import Home from './pages/home'
import MnBanner from './pages/mnBanner'

function App() {
  // Chưa có router: /admin/banner là trang quản lý banner, còn lại là trang chủ
  if (window.location.pathname.startsWith('/admin/banner')) {
    return <MnBanner/>
  }
  return (
    <Home/>
  )}

export default App
