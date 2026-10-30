import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const { error } = await signIn(email, password)
    setBusy(false)
    if (error) return setMessage(error.message)
    navigate('/')
  }

  return (
    <form className="auth card" onSubmit={handleSubmit}>
      <h2>로그인</h2>
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className="btn" disabled={busy}>{busy ? '처리 중...' : '로그인'}</button>
      {message && <p className="msg">{message}</p>}
      <p className="muted">계정이 없나요? <Link to="/signup">회원가입</Link></p>
    </form>
  )
}

export default Login
