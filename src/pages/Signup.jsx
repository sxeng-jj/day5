import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Signup() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setMessage('')
    const { data, error } = await signUp(email, password, name)
    setBusy(false)
    if (error) return setMessage(error.message)
    // 이메일 인증을 켜 둔 프로젝트는 session 이 없다
    if (data.session) navigate('/')
    else setMessage('가입 완료! 이메일 인증 메일을 확인한 뒤 로그인해 주세요.')
  }

  return (
    <form className="auth card" onSubmit={handleSubmit}>
      <h2>회원가입</h2>
      <input placeholder="이름" value={name} onChange={(e) => setName(e.target.value)} required />
      <input type="email" placeholder="이메일" value={email} onChange={(e) => setEmail(e.target.value)} required />
      <input type="password" placeholder="비밀번호 (6자 이상)" minLength={6}
        value={password} onChange={(e) => setPassword(e.target.value)} required />
      <button className="btn" disabled={busy}>{busy ? '처리 중...' : '가입하기'}</button>
      {message && <p className="msg">{message}</p>}
      <p className="muted">이미 계정이 있나요? <Link to="/login">로그인</Link></p>
    </form>
  )
}

export default Signup
