-- =======================================================
-- DROP ancienne table si tu veux repartir clean (⚠️ ça supprime les données)
-- DROP TABLE IF EXISTS public.profiles CASCADE;
-- =======================================================

create table public.profiles (
  id uuid not null primary key,  -- = auth.users.id
  username text unique,
  created_at timestamp without time zone default now(),
  balance numeric default 0.00 check (balance >= 0),
  display_name text,
  elo_rating integer default 1200,
  r6_username text,
  r6_rank text default 'Unranked',
  r6_mmr integer default 0,
  verification_status text default 'unverified' check (
    verification_status in ('unverified','pending','verified','failed')
  ),
  r6_platform text check (r6_platform in ('ubi','xbl','psn')),
  r6_verified boolean default false,
  r6_last_synced_at timestamp with time zone,

  -- 🔑 Lien direct avec auth.users
  constraint profiles_id_fkey foreign key (id) references auth.users (id) on delete cascade
);

-- =======================================================
-- Triggers financiers
-- =======================================================

create trigger audit_profile_balance_changes
after update on profiles
for each row
execute function audit_financial_transaction();

create trigger prevent_balance_manipulation_trigger
before update on profiles
for each row
execute function prevent_balance_manipulation();

create trigger validate_balance_trigger
after update on profiles
for each row
execute function validate_balance_update();

-- =======================================================
-- Auto-create profile when a new auth.users row is created
-- =======================================================

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, username)
  values (new.id, new.email, split_part(new.email, '@', 1));
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();