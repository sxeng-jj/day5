import { NavLink, Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Navbar() {
  const { user, name, signOut } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <nav className="navbar">
      <Link to="/" className="brand">🍊 제주 특산물 마켓</Link>
      <div className="links">
        <NavLink to="/" end>상품</NavLink>
        <NavLink to="/guestbook">방명록</NavLink>
        {user ? (
          <>
            <NavLink to="/cart">장바구니</NavLink>
            <NavLink to="/orders">주문내역</NavLink>
            <span className="who">{name}님</span>
            <button className="btn small ghost" onClick={handleLogout}>로그아웃</button>
          </>
        ) : (
          <>
            <NavLink to="/login">로그인</NavLink>
            <NavLink to="/signup">회원가입</NavLink>
          </>
        )}
      </div>
    </nav>
  )
}

export default Navbar
