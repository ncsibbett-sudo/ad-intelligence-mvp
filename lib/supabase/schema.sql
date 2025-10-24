-- Ad Intelligence Database Schema
-- Run this in your Supabase SQL Editor

-- Users table (extends Supabase auth.users)
create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  stripe_customer_id text,
  payment_status text default 'free' check (payment_status in ('free', 'paid')),
  analysis_count integer default 0,
  meta_access_token text,
  meta_token_expires_at timestamp with time zone,
  meta_ad_account_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable Row Level Security
alter table public.users enable row level security;

-- Policies for users table
create policy "Users can view own data"
  on public.users for select
  using (auth.uid() = id);

create policy "Users can update own data"
  on public.users for update
  using (auth.uid() = id);

create policy "Allow service role to insert users"
  on public.users for insert
  with check (true);

-- Creatives table
create table public.creatives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  source_type text not null check (source_type in ('own', 'competitor')),
  brand_name text,
  ad_id text,
  ad_image_url text,
  ad_copy text,
  cta text,
  performance jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.creatives enable row level security;

-- Policies for creatives
create policy "Users can view own creatives"
  on public.creatives for select
  using (auth.uid() = user_id);

create policy "Users can insert own creatives"
  on public.creatives for insert
  with check (auth.uid() = user_id);

create policy "Users can delete own creatives"
  on public.creatives for delete
  using (auth.uid() = user_id);

-- Analysis table
create table public.analysis (
  id uuid primary key default gen_random_uuid(),
  creative_id uuid references public.creatives(id) on delete cascade not null,
  analysis_result jsonb not null default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.analysis enable row level security;

-- Policies for analysis
create policy "Users can view own analysis"
  on public.analysis for select
  using (
    auth.uid() in (
      select user_id from public.creatives where id = analysis.creative_id
    )
  );

create policy "Users can insert own analysis"
  on public.analysis for insert
  with check (
    auth.uid() in (
      select user_id from public.creatives where id = creative_id
    )
  );

-- Payments table
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade not null,
  stripe_session_id text unique,
  stripe_payment_intent text,
  status text default 'pending' check (status in ('pending', 'succeeded', 'failed')),
  amount integer,
  currency text default 'usd',
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table public.payments enable row level security;

-- Policies for payments
create policy "Users can view own payments"
  on public.payments for select
  using (auth.uid() = user_id);

-- Function to create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email);
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to automatically create profile
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for users table
create trigger on_users_updated
  before update on public.users
  for each row execute procedure public.handle_updated_at();

-- Indexes for performance
create index creatives_user_id_idx on public.creatives(user_id);
create index creatives_source_type_idx on public.creatives(source_type);
create index analysis_creative_id_idx on public.analysis(creative_id);
create index payments_user_id_idx on public.payments(user_id);
create index payments_stripe_session_id_idx on public.payments(stripe_session_id);
