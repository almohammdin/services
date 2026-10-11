create table public.rb_login_handles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  username text not null unique check (username = lower(username) and username ~ '^[a-z][a-z0-9_]{2,29}$'),
  contact_email text not null default '' check (length(contact_email) <= 320),
  updated_at timestamptz not null default now()
);
alter table public.rb_login_handles enable row level security;
revoke all on public.rb_login_handles from anon, authenticated;
grant select on public.rb_login_handles to authenticated;
grant all on public.rb_login_handles to service_role;
create policy rb_login_handles_read_own on public.rb_login_handles for select to authenticated using (user_id = (select auth.uid()));

create table public.rb_example_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  hidden boolean not null default false
);
alter table public.rb_example_preferences enable row level security;
revoke all on public.rb_example_preferences from anon;
grant select, insert, update on public.rb_example_preferences to authenticated;
grant all on public.rb_example_preferences to service_role;
create policy rb_example_preferences_read_own on public.rb_example_preferences for select to authenticated using (user_id = (select auth.uid()));
create policy rb_example_preferences_insert_own on public.rb_example_preferences for insert to authenticated with check (user_id = (select auth.uid()));
create policy rb_example_preferences_update_own on public.rb_example_preferences for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create table public.rb_login_limits (
  bucket text primary key,
  started_at timestamptz not null default now(),
  attempts integer not null default 1
);
alter table public.rb_login_limits enable row level security;
revoke all on public.rb_login_limits from anon, authenticated;
grant all on public.rb_login_limits to service_role;
create policy rb_login_limits_service_only on public.rb_login_limits for all to service_role using (true) with check (true);
create function public.rb_allow_login(p_bucket text) returns boolean
language plpgsql security invoker set search_path = '' as $$
declare allowed boolean;
begin
  insert into public.rb_login_limits as l (bucket) values (p_bucket)
  on conflict (bucket) do update set
    attempts = case when l.started_at < now() - interval '10 minutes' then 1 else l.attempts + 1 end,
    started_at = case when l.started_at < now() - interval '10 minutes' then now() else l.started_at end
  returning attempts <= 12 into allowed;
  return allowed;
end;
$$;
revoke all on function public.rb_allow_login(text) from public, anon, authenticated;
grant execute on function public.rb_allow_login(text) to service_role;

alter table public.rb_circles add column is_example boolean not null default false;
alter table public.rb_people add column is_example boolean not null default false;
alter table public.rb_knowledge add column is_example boolean not null default false;
alter table public.rb_introductions add column is_example boolean not null default false;
alter table public.rb_requests add column is_example boolean not null default false;
alter table public.rb_relationship_evidence add column is_example boolean not null default false;
alter table public.rb_profile_answers add column is_example boolean not null default false;
alter table public.rb_opportunities add column is_example boolean not null default false;

create function public.rb_circles_with_real_data() returns table(circle_id uuid)
language sql stable security invoker set search_path = '' as $$
  select circle_id from public.rb_people where not is_example
  union select circle_id from public.rb_knowledge where not is_example
  union select circle_id from public.rb_introductions where not is_example
  union select circle_id from public.rb_requests where not is_example
  union select circle_id from public.rb_relationship_evidence where not is_example
  union select circle_id from public.rb_profile_answers where not is_example
  union select circle_id from public.rb_opportunities where not is_example;
$$;
revoke all on function public.rb_circles_with_real_data() from public, anon;
grant execute on function public.rb_circles_with_real_data() to authenticated;


