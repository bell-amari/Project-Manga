
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by owner"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Updated_at trigger function
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Bookshelf
create type public.shelf_status as enum ('owned', 'reading', 'finished', 'wishlist');

create table public.bookshelf_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  author text,
  cover_url text,
  status public.shelf_status not null default 'owned',
  rating smallint check (rating between 1 and 5),
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bookshelf_items_user_id_idx on public.bookshelf_items(user_id);

alter table public.bookshelf_items enable row level security;

create policy "Users can view their own shelf"
  on public.bookshelf_items for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can add to their own shelf"
  on public.bookshelf_items for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can update their own shelf"
  on public.bookshelf_items for update
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can delete from their own shelf"
  on public.bookshelf_items for delete
  to authenticated
  using (auth.uid() = user_id);

create trigger bookshelf_items_set_updated_at
  before update on public.bookshelf_items
  for each row execute function public.set_updated_at();
