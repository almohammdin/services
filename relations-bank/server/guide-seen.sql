alter table public.rb_example_preferences add column guide_seen boolean not null default false;
insert into public.rb_example_preferences(user_id,hidden,guide_seen)
  select user_id,false,true from public.rb_profiles
  on conflict(user_id) do update set guide_seen=true;
