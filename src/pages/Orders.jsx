import { useEffect, useState } from 'react'
import { supabase, won } from '../lib/supabase'

function Orders() {
  const [orders, setOrders] = useState([])
  const [message, setMessage] = useState('')

  const load = async () => {
    const { data, error } = await supabase
      .from('jeju_orders')
      .select('*, jeju_order_items(id, quantity, unit_price, total_price, jeju_products(name, emoji))')
      .order('id', { ascending: false })
    if (error) setMessage(error.message)
    else setOrders(data)
  }

  useEffect(() => {
    load()
  }, [])

  // 수정: 주문 상품 수량 변경 (금액은 DB 함수가 다시 계산)
  const changeQty = async (item, quantity) => {
    const { error } = await supabase.rpc('jeju_update_order_item', {
      p_item_id: item.id,
      p_quantity: quantity,
    })
    setMessage(error ? error.message : '')
    load()
  }

  // 반환: 주문 전체 반품
  const returnOrder = async (order) => {
    if (!confirm(`주문 #${order.id} 을(를) 반품할까요?`)) return
    const { error } = await supabase.rpc('jeju_return_order', { p_order_id: order.id })
    setMessage(error ? error.message : '')
    load()
  }

  return (
    <>
      <h2>주문내역</h2>
      {message && <p className="msg">{message}</p>}
      {orders.length === 0 && <p className="muted">주문 내역이 없어요.</p>}

      {orders.map((o) => (
        <section className="card order" key={o.id}>
          <div className="row between">
            <b>주문 #{o.id}</b>
            <span className={o.status === 'paid' ? 'badge ok' : 'badge off'}>
              {o.status === 'paid' ? '결제완료' : '반품됨'}
            </span>
            <span className="muted">{new Date(o.created_at).toLocaleString('ko-KR')}</span>
          </div>

          <ul className="list">
            {o.jeju_order_items.map((i) => (
              <li className="row between" key={i.id}>
                <span>{i.jeju_products.emoji} {i.jeju_products.name}</span>
                <span className="muted">{won(i.unit_price)} × {i.quantity}</span>
                {o.status === 'paid' ? (
                  <input
                    type="number" min="1" max="99" className="qty"
                    defaultValue={i.quantity}
                    onBlur={(e) => {
                      const q = Number(e.target.value)
                      if (q !== i.quantity) changeQty(i, q)
                    }}
                  />
                ) : (
                  <span>{i.quantity}개</span>
                )}
                <b>{won(i.total_price)}</b>
              </li>
            ))}
          </ul>

          <div className="row between">
            <b className="total">합계 {won(o.total_amount)}</b>
            {o.status === 'paid' && (
              <button className="btn small danger" onClick={() => returnOrder(o)}>반품하기</button>
            )}
          </div>
        </section>
      ))}
      <p className="muted">수량을 바꾼 뒤 입력칸 밖을 클릭하면 저장됩니다.</p>
    </>
  )
}

export default Orders
