import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, won } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

function Shop() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [products, setProducts] = useState([])
  const [qty, setQty] = useState({}) // { [productId]: 수량 }
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase
      .from('jeju_products')
      .select('*')
      .order('id')
      .then(({ data, error }) => {
        if (error) setMessage(error.message)
        else setProducts(data)
      })
  }, [])

  // 장바구니에 담기 (이미 있으면 수량 합산)
  const addToCart = async (product) => {
    if (!user) return navigate('/login')
    const q = qty[product.id] || 1
    const { data: existing } = await supabase
      .from('jeju_cart_items')
      .select('id, quantity')
      .eq('product_id', product.id)
      .maybeSingle()

    const { error } = existing
      ? await supabase
          .from('jeju_cart_items')
          .update({ quantity: Math.min(existing.quantity + q, 99) })
          .eq('id', existing.id)
      : await supabase.from('jeju_cart_items').insert({ product_id: product.id, quantity: q })

    if (error) setMessage(error.message)
    else setMessage(`${product.name} ${q}개를 장바구니에 담았어요`)
    return !error
  }

  const buyNow = async (product) => {
    if (await addToCart(product)) navigate('/cart')
  }

  return (
    <>
      <header className="hero">
        <h1>🍊 제주 특산물 마켓</h1>
        <p>제주의 바다와 햇살을 집 앞까지. 오늘의 특산물을 만나보세요.</p>
      </header>

      {message && <p className="msg">{message}</p>}

      <section className="grid">
        {products.map((p) => (
          <article className="card product" key={p.id}>
            <div className="emoji">{p.emoji}</div>
            <span className="tag">{p.category}</span>
            <h3>{p.name}</h3>
            <p className="muted">{p.description}</p>
            <p className="price">{won(p.price)}</p>
            <p className="muted">재고 {p.stock}개</p>
            <div className="row">
              <input
                type="number" min="1" max="99" className="qty"
                value={qty[p.id] || 1}
                onChange={(e) => setQty({ ...qty, [p.id]: Number(e.target.value) || 1 })}
              />
              <button className="btn small ghost" onClick={() => addToCart(p)}>담기</button>
              <button className="btn small" onClick={() => buyNow(p)}>바로 구매</button>
            </div>
          </article>
        ))}
      </section>
    </>
  )
}

export default Shop
