import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { isConfigured } from './lib/supabase'
import { AuthProvider } from './context/AuthContext'
import App from './App.jsx'
import './index.css'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isConfigured ? (
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    ) : (
      <div className="notice">
        <h2>Supabase 환경변수가 없습니다</h2>
        <p>
          <code>.env.example</code> 을 복사해 <code>.env.local</code> 을 만들고
          <code> VITE_SUPABASE_URL</code>, <code>VITE_SUPABASE_ANON_KEY</code> 를 채운 뒤
          개발 서버를 다시 시작하세요.
        </p>
      </div>
    )}
  </StrictMode>,
)
