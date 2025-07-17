-- Good Neighbor Listings Table
create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  price float not null,
  category text not null,
  condition text not null,
  school text not null,
  image_url text,
  user_id uuid references auth.users(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now())
); 