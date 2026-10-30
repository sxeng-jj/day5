import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, won } from '../lib/supabase'

function Cart() {
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [message, setMessage] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('jeju_cart_items')
      .select('id, quantity, jeju_products(id, name, emoji, price)')
      .order('id')
    if (error) setMessage(error.message)
    else setItems(data)
  }

  useEffect(() => {
    load()
  }, [])

  const changeQty = async (item, quantity) => {
    if (quantity < 1 || quantity > 99) return
    const { error } = await supabase.from('jeju_cart_items').update({ quantity }).eq('id', item.id)
    if (error) setMessage(error.message)
    else load()
  }

  const remove = async (item) => {
    await supabase.from('jeju_cart_items').delete().eq('id', item.id)
    load()
  }

  // 수량 × 가격
  const total = items.reduce((sum, i) => sum + i.jeju_products.price * i.quantity, 0)

  const order = async () => {
    const { error } = await supabase.rpc('jeju_place_order')
    if (error) setMessage(error.message)
    else navigate('/orders')
  }

  return (
    <>
      <h2>장바구니</h2>
      {message && <p className="msg">{message}</p>}
      {items.length === 0 ? (
        <p className="muted">장바구니가 비어 있어요.</p>
      ) : (
        <>
          <ul className="list">
            {items.map((i) => (
              <li className="card row between" key={i.id}>
                <span>{i.jeju_products.emoji} {i.jeju_products.name}</span>
                <span className="muted">{won(i.jeju_products.price)}</span>
                <span className="row">
                  <button className="btn small ghost" onClick={() => changeQty(i, i.quantity - 1)}>−</button>
                  <b>{i.quantity}</b>
                  <button className="btn small ghost" onClick={() => changeQty(i, i.quantity + 1)}>+</button>
                </span>
                <b>{won(i.jeju_products.price * i.quantity)}</b>
                <button className="btn small danger" onClick={() => remove(i)}>삭제</button>
              </li>
            ))}
          </ul>
          <p className="total">합계 {won(total)}</p>
          <button className="btn" onClick={order}>주문하기</button>
        </>
      )}
    </>
  )
}

export default Cart
