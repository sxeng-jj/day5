import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Guestbook() {
  const { user, name } = useAuth()
  const [posts, setPosts] = useState([])
  const [likes, setLikes] = useState([]) // [{ guestbook_id, user_id }]
  const [content, setContent] = useState('')
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')
  const [message, setMessage] = useState('')

  const load = async () => {
    const [p, l] = await Promise.all([
      supabase.from('jeju_guestbook').select('*').order('id', { ascending: false }),
      supabase.from('jeju_guestbook_likes').select('guestbook_id, user_id'),
    ])
    if (p.error) setMessage(p.error.message)
    else setPosts(p.data)
    if (l.data) setLikes(l.data)
  }

  useEffect(() => {
    load()
  }, [])

  const write = async (e) => {
    e.preventDefault()
    const text = content.trim()
    if (!text) return
    const { error } = await supabase.from('jeju_guestbook').insert({ author_name: name, content: text })
    if (error) return setMessage(error.message)
    setContent('')
    load()
  }

  const saveEdit = async (id) => {
    const { error } = await supabase
      .from('jeju_guestbook')
      .update({ content: editText.trim(), updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return setMessage(error.message)
    setEditId(null)
    load()
  }

  const remove = async (id) => {
    if (!confirm('이 글을 삭제할까요?')) return
    await supabase.from('jeju_guestbook').delete().eq('id', id)
    load()
  }

  // 좋아요 토글
  const toggleLike = async (post) => {
    if (!user) return setMessage('좋아요는 로그인 후 사용할 수 있어요')
    const liked = likes.some((l) => l.guestbook_id === post.id && l.user_id === user.id)
    const { error } = liked
      ? await supabase.from('jeju_guestbook_likes').delete()
          .eq('guestbook_id', post.id).eq('user_id', user.id)
      : await supabase.from('jeju_guestbook_likes').insert({ guestbook_id: post.id })
    if (error) setMessage(error.message)
    load()
  }

  return (
    <>
      <h2>방명록</h2>
      {message && <p className="msg">{message}</p>}

      {user ? (
        <form className="card row" onSubmit={write}>
          <input
            className="grow" maxLength={500} placeholder="제주 특산물 후기를 남겨 주세요"
            value={content} onChange={(e) => setContent(e.target.value)}
          />
          <button className="btn small">등록</button>
        </form>
      ) : (
        <p className="muted">글을 남기려면 로그인해 주세요.</p>
      )}

      <ul className="list">
        {posts.map((p) => {
          const count = likes.filter((l) => l.guestbook_id === p.id).length
          const liked = user && likes.some((l) => l.guestbook_id === p.id && l.user_id === user.id)
          const mine = user && p.user_id === user.id
          return (
            <li className="card" key={p.id}>
              <div className="row between">
                <b>{p.author_name}</b>
                <span className="muted">
                  {new Date(p.created_at).toLocaleString('ko-KR')}
                  {p.updated_at !== p.created_at && ' (수정됨)'}
                </span>
              </div>

              {editId === p.id ? (
                <div className="row">
                  <input className="grow" value={editText} onChange={(e) => setEditText(e.target.value)} />
                  <button className="btn small" onClick={() => saveEdit(p.id)}>저장</button>
                  <button className="btn small ghost" onClick={() => setEditId(null)}>취소</button>
                </div>
              ) : (
                <p>{p.content}</p>
              )}

              <div className="row">
                <button className={liked ? 'btn small liked' : 'btn small ghost'} onClick={() => toggleLike(p)}>
                  {liked ? '♥' : '♡'} {count}
                </button>
                {mine && editId !== p.id && (
                  <>
                    <button className="btn small ghost" onClick={() => { setEditId(p.id); setEditText(p.content) }}>수정</button>
                    <button className="btn small danger" onClick={() => remove(p.id)}>삭제</button>
                  </>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </>
  )
}

export default Guestbook
