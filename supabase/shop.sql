-- =====================================================================
-- 제주 특산물 쇼핑몰 · 전체 테이블 SQL
-- Supabase 대시보드 → SQL Editor → New query 에 전체를 붙여넣고 Run
-- 여러 번 실행해도 안전합니다. (day4 의 products 테이블과 충돌하지 않도록 jeju_ 접두사 사용)
-- 회원 정보는 Supabase 기본 auth.users 를 사용합니다. (이름은 가입 시 user_metadata.name)
-- =====================================================================

-- 1) 상품 -----------------------------------------------------------------
create table if not exists public.jeju_products (
  id          bigint generated always as identity primary key,
  name        text        not null,
  description text,
  price       integer     not null check (price >= 0),      -- 원 단위
  emoji       text        not null default '🍊',
  category    text,
  stock       integer     not null default 100 check (stock >= 0),
  created_at  timestamptz not null default now()
);

-- 2) 장바구니 -------------------------------------------------------------
create table if not exists public.jeju_cart_items (
  id          bigint generated always as identity primary key,
  user_id     uuid    not null default auth.uid() references auth.users (id) on delete cascade,
  product_id  bigint  not null references public.jeju_products (id) on delete cascade,
  quantity    integer not null default 1 check (quantity between 1 and 99),
  created_at  timestamptz not null default now(),
  unique (user_id, product_id)
);

-- 3) 주문 / 주문 상품 -------------------------------------------------------
-- total_price = unit_price * quantity 값을 DB 에 저장한다.
create table if not exists public.jeju_orders (
  id           bigint generated always as identity primary key,
  user_id      uuid    not null references auth.users (id) on delete cascade,
  total_amount integer not null default 0,                     -- 주문 상품 total_price 의 합
  status       text    not null default 'paid' check (status in ('paid', 'returned')),
  created_at   timestamptz not null default now(),
  returned_at  timestamptz
);

create table if not exists public.jeju_order_items (
  id          bigint generated always as identity primary key,
  order_id    bigint  not null references public.jeju_orders (id) on delete cascade,
  product_id  bigint  not null references public.jeju_products (id),
  unit_price  integer not null,                                -- 주문 당시 단가
  quantity    integer not null check (quantity between 1 and 99),
  total_price integer not null                                 -- unit_price * quantity
);

create index if not exists jeju_orders_user_idx      on public.jeju_orders (user_id);
create index if not exists jeju_order_items_order_idx on public.jeju_order_items (order_id);

-- 4) 방명록 / 좋아요 --------------------------------------------------------
create table if not exists public.jeju_guestbook (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null,
  content     text not null check (char_length(content) between 1 and 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.jeju_guestbook_likes (
  guestbook_id bigint not null references public.jeju_guestbook (id) on delete cascade,
  user_id      uuid   not null default auth.uid() references auth.users (id) on delete cascade,
  created_at   timestamptz not null default now(),
  primary key (guestbook_id, user_id)                          -- 한 사람이 한 글에 1번만
);

-- 5) 행 수준 보안(RLS) -------------------------------------------------------
alter table public.jeju_products        enable row level security;
alter table public.jeju_cart_items      enable row level security;
alter table public.jeju_orders          enable row level security;
alter table public.jeju_order_items     enable row level security;
alter table public.jeju_guestbook       enable row level security;
alter table public.jeju_guestbook_likes enable row level security;

-- 상품: 누구나 읽기만
drop policy if exists "jeju_products_read" on public.jeju_products;
create policy "jeju_products_read" on public.jeju_products for select using (true);

-- 장바구니: 본인 것만 전체 권한
drop policy if exists "jeju_cart_own" on public.jeju_cart_items;
create policy "jeju_cart_own" on public.jeju_cart_items for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 주문: 본인 것만 읽기 (쓰기는 아래 함수로만 가능)
drop policy if exists "jeju_orders_read_own" on public.jeju_orders;
create policy "jeju_orders_read_own" on public.jeju_orders for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "jeju_order_items_read_own" on public.jeju_order_items;
create policy "jeju_order_items_read_own" on public.jeju_order_items for select to authenticated
  using (exists (select 1 from public.jeju_orders o
                 where o.id = order_id and o.user_id = auth.uid()));

-- 방명록: 누구나 읽기, 작성/수정/삭제는 본인만
drop policy if exists "jeju_guestbook_read" on public.jeju_guestbook;
create policy "jeju_guestbook_read" on public.jeju_guestbook for select using (true);

drop policy if exists "jeju_guestbook_insert_own" on public.jeju_guestbook;
create policy "jeju_guestbook_insert_own" on public.jeju_guestbook for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "jeju_guestbook_update_own" on public.jeju_guestbook;
create policy "jeju_guestbook_update_own" on public.jeju_guestbook for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "jeju_guestbook_delete_own" on public.jeju_guestbook;
create policy "jeju_guestbook_delete_own" on public.jeju_guestbook for delete to authenticated
  using (auth.uid() = user_id);

-- 좋아요: 누구나 읽기, 추가/취소는 본인만
drop policy if exists "jeju_likes_read" on public.jeju_guestbook_likes;
create policy "jeju_likes_read" on public.jeju_guestbook_likes for select using (true);

drop policy if exists "jeju_likes_insert_own" on public.jeju_guestbook_likes;
create policy "jeju_likes_insert_own" on public.jeju_guestbook_likes for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "jeju_likes_delete_own" on public.jeju_guestbook_likes;
create policy "jeju_likes_delete_own" on public.jeju_guestbook_likes for delete to authenticated
  using (auth.uid() = user_id);

-- 6) 주문 함수 (재고 + 금액 계산을 DB 에서 처리) ------------------------------

-- 6-1) 구매: 장바구니 전체 → 주문. 금액 = 단가 × 수량
create or replace function public.jeju_place_order()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user  uuid := auth.uid();
  v_order bigint;
begin
  if v_user is null then raise exception '로그인이 필요합니다'; end if;
  if not exists (select 1 from jeju_cart_items where user_id = v_user) then
    raise exception '장바구니가 비어 있습니다';
  end if;

  -- 재고 확인
  if exists (
    select 1 from jeju_cart_items c join jeju_products p on p.id = c.product_id
    where c.user_id = v_user and p.stock < c.quantity
  ) then
    raise exception '재고가 부족한 상품이 있습니다';
  end if;

  insert into jeju_orders (user_id) values (v_user) returning id into v_order;

  insert into jeju_order_items (order_id, product_id, unit_price, quantity, total_price)
  select v_order, p.id, p.price, c.quantity, p.price * c.quantity
  from jeju_cart_items c join jeju_products p on p.id = c.product_id
  where c.user_id = v_user;

  update jeju_products p set stock = p.stock - c.quantity
  from jeju_cart_items c where c.product_id = p.id and c.user_id = v_user;

  update jeju_orders
     set total_amount = (select sum(total_price) from jeju_order_items where order_id = v_order)
   where id = v_order;

  delete from jeju_cart_items where user_id = v_user;
  return v_order;
end;
$$;

-- 6-2) 수정: 주문 상품 수량 변경 (total_price, total_amount, 재고 재계산)
create or replace function public.jeju_update_order_item(p_item_id bigint, p_quantity integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_item jeju_order_items;
  v_order jeju_orders;
begin
  if p_quantity < 1 or p_quantity > 99 then raise exception '수량은 1~99 입니다'; end if;

  select * into v_item from jeju_order_items where id = p_item_id;
  if not found then raise exception '주문 상품이 없습니다'; end if;

  select * into v_order from jeju_orders where id = v_item.order_id;
  if v_order.user_id is distinct from auth.uid() then raise exception '권한이 없습니다'; end if;
  if v_order.status <> 'paid' then raise exception '반품된 주문은 수정할 수 없습니다'; end if;

  if (select stock from jeju_products where id = v_item.product_id) < p_quantity - v_item.quantity then
    raise exception '재고가 부족합니다';
  end if;

  update jeju_products set stock = stock - (p_quantity - v_item.quantity)
   where id = v_item.product_id;

  update jeju_order_items
     set quantity = p_quantity, total_price = unit_price * p_quantity
   where id = p_item_id;

  update jeju_orders
     set total_amount = (select sum(total_price) from jeju_order_items where order_id = v_order.id)
   where id = v_order.id;
end;
$$;

-- 6-3) 반환(반품): 주문 상태를 returned 로, 재고 복구
create or replace function public.jeju_return_order(p_order_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order jeju_orders;
begin
  select * into v_order from jeju_orders where id = p_order_id;
  if not found or v_order.user_id is distinct from auth.uid() then
    raise exception '주문을 찾을 수 없습니다';
  end if;
  if v_order.status = 'returned' then raise exception '이미 반품된 주문입니다'; end if;

  update jeju_products p set stock = p.stock + i.quantity
  from jeju_order_items i where i.order_id = p_order_id and i.product_id = p.id;

  update jeju_orders set status = 'returned', returned_at = now() where id = p_order_id;
end;
$$;

revoke all on function public.jeju_place_order()                    from public, anon;
revoke all on function public.jeju_update_order_item(bigint, integer) from public, anon;
revoke all on function public.jeju_return_order(bigint)             from public, anon;
grant execute on function public.jeju_place_order()                    to authenticated;
grant execute on function public.jeju_update_order_item(bigint, integer) to authenticated;
grant execute on function public.jeju_return_order(bigint)             to authenticated;

-- 7) 샘플 상품 (비어 있을 때만) ----------------------------------------------
insert into public.jeju_products (name, description, price, emoji, category, stock)
select v.name, v.description, v.price, v.emoji, v.category, v.stock
from (values
  ('제주 노지 감귤 3kg',     '햇살 가득 받고 자란 달콤새콤 노지 감귤',          13900, '🍊', '과일', 120),
  ('한라봉 선물세트 2kg',    '머리에 혹이 달린 향긋한 한라봉, 정성 포장',       27500, '🍋', '과일',  80),
  ('천혜향 1.5kg',           '향이 하늘까지 닿는다는 프리미엄 만감류',          21800, '🍑', '과일',  60),
  ('제주 흑돼지 오겹살 500g','쫄깃하고 고소한 제주 흑돼지, 멜젓 포함',        32900, '🐖', '정육',  50),
  ('은갈치 2미 (손질)',      '은빛 비늘이 살아있는 제주 은갈치',                39000, '🐟', '수산',  40),
  ('제주 옥돔 3미',          '담백하고 부드러운 제주 대표 생선, 반건조',        45000, '🐠', '수산',  30),
  ('제주 녹차 티백 20입',    '초록빛 녹차밭의 향을 담은 티백',                   9700, '🍵', '차',   150),
  ('감귤 초콜릿 10개입',     '새콤한 감귤 필링이 들어간 초콜릿',                 8200, '🍫', '간식', 200),
  ('우도 땅콩 막걸리 750ml', '고소한 우도 땅콩이 들어간 제주 막걸리',           6400, '🥜', '주류', 100),
  ('제주 한라산 오메기떡 12입','쫀득한 팥고물 오메기떡 세트',                    15300, '🍡', '간식',  70)
) as v(name, description, price, emoji, category, stock)
where not exists (select 1 from public.jeju_products);
