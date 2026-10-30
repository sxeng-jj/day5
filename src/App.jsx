import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Shop from './pages/Shop.jsx'
import Cart from './pages/Cart.jsx'
import Orders from './pages/Orders.jsx'
import Guestbook from './pages/Guestbook.jsx'
import Login from './pages/Login.jsx'
import Signup from './pages/Signup.jsx'

function App() {
  return (
    <>
      <Navbar />
      <main className="page">
        <Routes>
          <Route path="/" element={<Shop />} />
          <Route path="/guestbook" element={<Guestbook />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/cart" element={<ProtectedRoute><Cart /></ProtectedRoute>} />
          <Route path="/orders" element={<ProtectedRoute><Orders /></ProtectedRoute>} />
        </Routes>
      </main>
      <footer className="footer">© 2026 제주 특산물 마켓</footer>
    </>
  )
}

export default App
