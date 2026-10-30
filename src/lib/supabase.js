import { createClient } from '@supabase/supabase-js'

// Vite 는 VITE_ 로 시작하는 환경변수만 브라우저 코드에 넣어준다.
// anon 키는 공개되어도 되며, 실제 보호는 Supabase 의 RLS 정책이 담당한다.
const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_ANON_KEY

export const isConfigured = Boolean(url && key)
export const supabase = isConfigured ? createClient(url, key) : null

export const won = (n) => `${Number(n).toLocaleString('ko-KR')}원`
