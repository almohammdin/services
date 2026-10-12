create table public.rb_leader_approvals (
  user_id uuid primary key references auth.users(id) on delete cascade,
  approved boolean not null default false,
  approved_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);
alter table public.rb_leader_approvals enable row level security;
revoke all on public.rb_leader_approvals from anon, authenticated;
grant select on public.rb_leader_approvals to authenticated;
grant all on public.rb_leader_approvals to service_role;

create function private.rb_is_platform_owner() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.rb_platform_bootstrap where id=1 and owner_user_id=(select auth.uid())
  );
$$;
create function private.rb_is_approved_leader() returns boolean
language sql stable security definer set search_path = '' as $$
  select (select auth.uid()) is not null and (
    exists(select 1 from public.rb_platform_bootstrap where id=1 and owner_user_id=(select auth.uid()))
    or exists(select 1 from public.rb_leader_approvals where user_id=(select auth.uid()) and approved)
  );
$$;
revoke all on function private.rb_is_platform_owner(), private.rb_is_approved_leader() from public, anon;
grant execute on function private.rb_is_platform_owner(), private.rb_is_approved_leader() to authenticated;
create policy rb_leader_approval_read on public.rb_leader_approvals for select to authenticated
  using (user_id=(select auth.uid()) or (select private.rb_is_platform_owner()));
insert into public.rb_leader_approvals(user_id,approved,approved_by)
  select distinct c.created_by,true,b.owner_user_id from public.rb_circles c cross join public.rb_platform_bootstrap b where b.id=1
  on conflict(user_id) do nothing;
alter table public.rb_circles add column partnerships_enabled boolean not null default false;
update public.rb_circles set partnerships_enabled=true where is_example;
revoke insert on public.rb_platform_bootstrap from authenticated;
revoke insert on public.rb_circles from authenticated;
revoke insert,update,delete on public.rb_circle_members from authenticated;
drop policy rb_circles_insert_platform_owner on public.rb_circles;

create table public.rb_person_account_invites (
  id uuid primary key default gen_random_uuid(),
  circle_id uuid not null references public.rb_circles(id) on delete cascade,
  person_id uuid not null references public.rb_people(id) on delete cascade,
  invited_by uuid not null references auth.users(id),
  token_hash text not null unique,
  expires_at timestamptz not null default now()+interval '7 days',
  accepted_by uuid references auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz not null default now()
);
create index rb_person_invites_person_idx on public.rb_person_account_invites(person_id);
create index rb_person_invites_circle_idx on public.rb_person_account_invites(circle_id);
alter table public.rb_person_account_invites enable row level security;
revoke all on public.rb_person_account_invites from anon, authenticated;
grant all on public.rb_person_account_invites to service_role;
create policy rb_person_invites_service on public.rb_person_account_invites for all to service_role using(true) with check(true);
create unique index rb_people_circle_account_unique on public.rb_people(circle_id,auth_user_id) where auth_user_id is not null;
create policy rb_people_read_linked_self on public.rb_people for select to authenticated using(auth_user_id=(select auth.uid()));
alter policy rb_people_owner_identity_restrict on public.rb_people using (
  created_by=(select auth.uid()) or auth_user_id=(select auth.uid()) or scope='circle'
);
create policy rb_people_update_linked_self on public.rb_people for update to authenticated
  using(auth_user_id=(select auth.uid())) with check(auth_user_id=(select auth.uid()) and (select private.rb_is_circle_member(circle_id)));
create function private.rb_guard_person_identity() returns trigger language plpgsql set search_path='' as $$
begin
  if current_user='authenticated' then
    if tg_op='INSERT' and new.auth_user_id is not null and new.auth_user_id<>(select auth.uid()) then raise exception 'Person identity is managed through invitations' using errcode='42501'; end if;
    if tg_op='UPDATE' and (new.created_by<>old.created_by or new.circle_id<>old.circle_id or new.auth_user_id is distinct from old.auth_user_id) then raise exception 'Person identity is managed through invitations' using errcode='42501'; end if;
  end if;
  return new;
end;
$$;
create trigger rb_person_identity_guard before insert or update on public.rb_people for each row execute function private.rb_guard_person_identity();

create table public.rb_collaboration_profiles (
  person_id uuid primary key references public.rb_people(id) on delete cascade,
  circle_id uuid not null references public.rb_circles(id) on delete cascade,
  created_by uuid not null references auth.users(id),
  preferences jsonb not null default '{}'::jsonb,
  scope text not null default 'private' check(scope in('private','circle')),
  updated_at timestamptz not null default now()
);
create index rb_collaboration_circle_idx on public.rb_collaboration_profiles(circle_id);
alter table public.rb_collaboration_profiles enable row level security;
revoke all on public.rb_collaboration_profiles from anon, authenticated;
grant select on public.rb_collaboration_profiles to authenticated;
grant all on public.rb_collaboration_profiles to service_role;
create policy rb_collaboration_read on public.rb_collaboration_profiles for select to authenticated using (
  created_by=(select auth.uid())
  or exists(select 1 from public.rb_people p where p.id=person_id and p.auth_user_id=(select auth.uid()))
  or (scope='circle' and (select private.rb_is_circle_member(circle_id)))
);

alter table public.rb_success_agreements add column counterparty_circle_id uuid references public.rb_circles(id);
alter table public.rb_success_agreements add column approval_version integer not null default 1 check(approval_version>0);
alter table public.rb_success_agreements add constraint rb_agreement_distinct_circles check(counterparty_circle_id is null or counterparty_circle_id<>circle_id);
alter table public.rb_success_events drop constraint rb_success_events_event_type_check;
alter table public.rb_success_events add constraint rb_success_events_event_type_check check(event_type in('meeting','proposal','signed','invoice','collected','closed','custom'));
create unique index rb_one_agreement_per_opportunity on public.rb_success_agreements(opportunity_id);
create index rb_agreement_counterparty_idx on public.rb_success_agreements(counterparty_circle_id);
alter table public.rb_success_splits add column beneficiary_circle_id uuid references public.rb_circles(id);
alter table public.rb_success_splits drop constraint rb_success_splits_beneficiary_type_check;
alter table public.rb_success_splits add constraint rb_success_splits_beneficiary_type_check check(beneficiary_type in('circle_leader','relationship_owner','request_source','information_source','introducer','platform','other'));
create table public.rb_agreement_approvals (
  agreement_id uuid not null references public.rb_success_agreements(id) on delete cascade,
  circle_id uuid not null references public.rb_circles(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  approval_version integer not null,
  approved_at timestamptz not null default now(),
  primary key(agreement_id,circle_id)
);
create index rb_approval_circle_idx on public.rb_agreement_approvals(circle_id);
alter table public.rb_agreement_approvals enable row level security;
revoke all on public.rb_agreement_approvals from anon, authenticated;
grant select on public.rb_agreement_approvals to authenticated;
grant all on public.rb_agreement_approvals to service_role;
create function private.rb_can_read_agreement(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
  select (select auth.uid()) is not null and exists (
    select 1 from public.rb_success_agreements a where a.id=p_id and (
      exists(select 1 from public.rb_circle_members m where m.circle_id=a.circle_id and m.user_id=(select auth.uid()))
      or exists(select 1 from public.rb_circles c where c.id=a.counterparty_circle_id and c.created_by=(select auth.uid()))
    )
  );
$$;
revoke all on function private.rb_can_read_agreement(uuid) from public,anon;
grant execute on function private.rb_can_read_agreement(uuid) to authenticated;
create policy rb_agreement_counterparty_read on public.rb_success_agreements for select to authenticated
  using(counterparty_circle_id is not null and (select private.rb_is_circle_owner(counterparty_circle_id)));
create policy rb_approval_read on public.rb_agreement_approvals for select to authenticated using((select private.rb_can_read_agreement(agreement_id)));
create policy rb_splits_counterparty_read on public.rb_success_splits for select to authenticated using((select private.rb_can_read_agreement(agreement_id)));
create policy rb_events_counterparty_read on public.rb_success_events for select to authenticated using((select private.rb_can_read_agreement(agreement_id)));
revoke insert,update,delete on public.rb_success_agreements,public.rb_success_splits,public.rb_success_events from authenticated;

create function public.rb_set_leader_approval(p_actor uuid,p_user uuid,p_approved boolean) returns jsonb
language plpgsql security invoker set search_path='' as $$
begin
  if not exists(select 1 from public.rb_platform_bootstrap where id=1 and owner_user_id=p_actor) then raise exception 'platform_owner_required' using errcode='42501'; end if;
  if not exists(select 1 from public.rb_profiles where user_id=p_user) then raise exception 'user_not_found'; end if;
  insert into public.rb_leader_approvals(user_id,approved,approved_by) values(p_user,p_approved,p_actor)
    on conflict(user_id) do update set approved=excluded.approved,approved_by=excluded.approved_by,updated_at=now();
  return jsonb_build_object('ok',true);
end;
$$;
create function public.rb_create_owned_circle(p_user uuid,p_name text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare c public.rb_circles;
begin
  if not exists(select 1 from public.rb_leader_approvals where user_id=p_user and approved)
     and not exists(select 1 from public.rb_platform_bootstrap where id=1 and owner_user_id=p_user) then raise exception 'approved_leader_required' using errcode='42501'; end if;
  if length(trim(p_name)) not between 2 and 120 then raise exception 'circle_name'; end if;
  insert into public.rb_circles(name,created_by) values(trim(p_name),p_user) returning * into c;
  insert into public.rb_circle_members(circle_id,user_id,role) values(c.id,p_user,'owner');
  return to_jsonb(c);
end;
$$;
create function public.rb_accept_person_account_invite(p_user uuid,p_hash text) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare inv public.rb_person_account_invites; person public.rb_people;
begin
  select * into inv from public.rb_person_account_invites where token_hash=p_hash for update;
  if inv.id is null or inv.accepted_at is not null or inv.expires_at<now() then raise exception 'person_invite_invalid'; end if;
  select * into person from public.rb_people where id=inv.person_id and circle_id=inv.circle_id for update;
  if person.id is null or (person.auth_user_id is not null and person.auth_user_id<>p_user) then raise exception 'person_already_linked'; end if;
  if exists(select 1 from public.rb_people where circle_id=inv.circle_id and auth_user_id=p_user and id<>person.id) then raise exception 'account_has_profile'; end if;
  insert into public.rb_circle_members(circle_id,user_id,role) values(inv.circle_id,p_user,'member') on conflict(circle_id,user_id) do nothing;
  update public.rb_people set auth_user_id=p_user where id=person.id;
  update public.rb_person_account_invites set accepted_by=p_user,accepted_at=now() where id=inv.id;
  return jsonb_build_object('ok',true,'circle_id',inv.circle_id,'person_id',person.id,'name',person.name);
end;
$$;

create function public.rb_save_named_agreement(p_user uuid,p_opportunity uuid,p_values jsonb,p_shares jsonb,p_submit boolean) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare
  opp public.rb_opportunities; a public.rb_success_agreements;
  primary_c public.rb_circles; second_c public.rb_circles; platform_id uuid;
  second_id uuid:=nullif(p_values->>'counterparty_circle_id','')::uuid;
  r_type text:=p_values->>'reward_type'; amount numeric:=nullif(p_values->>'fixed_amount','')::numeric;
  pct numeric:=nullif(p_values->>'percentage','')::numeric;
  primary_share numeric:=(p_shares->>'primary')::numeric;
  second_share numeric:=coalesce((p_shares->>'secondary')::numeric,0);
  platform_share numeric:=(p_shares->>'platform')::numeric;
  trigger_value text:=p_values->>'trigger_event'; new_version integer:=1;
begin
  select * into opp from public.rb_opportunities where id=p_opportunity for update;
  select * into primary_c from public.rb_circles where id=opp.circle_id and active;
  if primary_c.id is null or primary_c.created_by<>p_user then raise exception 'circle_leader_required' using errcode='42501'; end if;
  if second_id is not null then
    select * into second_c from public.rb_circles where id=second_id and active and partnerships_enabled;
    if second_c.id is null or second_id=primary_c.id then raise exception 'partner_circle_invalid'; end if;
  end if;
  if r_type not in('none','fixed','collected_revenue_percent','revenue_percent','margin_percent','custom') or trigger_value not in('collected','signed','first_invoice','custom') then raise exception 'reward_invalid'; end if;
  if r_type='fixed' and (amount is null or amount<=0 or amount>1000000000000) then raise exception 'reward_amount'; end if;
  if r_type in('collected_revenue_percent','revenue_percent','margin_percent') and (pct is null or pct<=0 or pct>100) then raise exception 'reward_percentage'; end if;
  if r_type<>'none' and (primary_share is null or platform_share is null or least(primary_share,second_share,platform_share)<0 or greatest(primary_share,second_share,platform_share)>100 or primary_share+second_share+platform_share<>100 or (second_id is null and second_share<>0)) then raise exception 'shares_total'; end if;
  if r_type='custom' and length(trim(coalesce(p_values->>'terms_note','')))<5 then raise exception 'custom_terms'; end if;
  select * into a from public.rb_success_agreements where opportunity_id=p_opportunity for update;
  if a.id is not null and a.status not in('draft','proposed') then raise exception 'agreement_locked'; end if;
  if a.id is not null then new_version:=a.approval_version+1; end if;
  insert into public.rb_success_agreements(opportunity_id,circle_id,created_by,counterparty_circle_id,reward_type,currency,fixed_amount,percentage,reward_base_note,trigger_event,attribution_days,status,terms_note,approval_version,accepted_at)
    values(opp.id,opp.circle_id,p_user,second_id,r_type,'SAR',case when r_type='fixed' then amount else null end,case when r_type in('collected_revenue_percent','revenue_percent','margin_percent') then pct else null end,coalesce(p_values->>'reward_base_note',''),trigger_value,coalesce((p_values->>'attribution_days')::integer,180),case when p_submit then 'proposed' else 'draft' end,left(coalesce(p_values->>'terms_note',''),3000),new_version,null)
    on conflict(opportunity_id) do update set counterparty_circle_id=excluded.counterparty_circle_id,reward_type=excluded.reward_type,currency=excluded.currency,fixed_amount=excluded.fixed_amount,percentage=excluded.percentage,reward_base_note=excluded.reward_base_note,trigger_event=excluded.trigger_event,attribution_days=excluded.attribution_days,status=excluded.status,terms_note=excluded.terms_note,approval_version=excluded.approval_version,accepted_at=null
    returning * into a;
  delete from public.rb_success_splits where agreement_id=a.id;
  delete from public.rb_agreement_approvals where agreement_id=a.id;
  select owner_user_id into platform_id from public.rb_platform_bootstrap where id=1;
  if r_type<>'none' then
    insert into public.rb_success_splits(agreement_id,circle_id,beneficiary_type,beneficiary_user_id,beneficiary_circle_id,beneficiary_name,pool_share_percent)
      values(a.id,a.circle_id,'circle_leader',primary_c.created_by,primary_c.id,'رئيس دائرة '||primary_c.name,primary_share),
            (a.id,a.circle_id,'platform',platform_id,null,'المنصة',platform_share);
    if second_id is not null then
      insert into public.rb_success_splits(agreement_id,circle_id,beneficiary_type,beneficiary_user_id,beneficiary_circle_id,beneficiary_name,pool_share_percent)
        values(a.id,a.circle_id,'circle_leader',second_c.created_by,second_c.id,'رئيس دائرة '||second_c.name,second_share);
    end if;
  end if;
  if p_submit then
    insert into public.rb_agreement_approvals(agreement_id,circle_id,user_id,approval_version) values(a.id,a.circle_id,p_user,a.approval_version);
    if second_id is null then update public.rb_success_agreements set status='accepted',accepted_at=now() where id=a.id returning * into a; end if;
  end if;
  return to_jsonb(a);
end;
$$;
create function public.rb_approve_named_agreement(p_user uuid,p_agreement uuid,p_version integer) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare a public.rb_success_agreements; c record; permitted boolean:=false;
begin
  select * into a from public.rb_success_agreements where id=p_agreement for update;
  if a.id is null or a.status<>'proposed' or a.approval_version<>p_version then raise exception 'agreement_version'; end if;
  for c in select id from public.rb_circles where id in(a.circle_id,a.counterparty_circle_id) and created_by=p_user and active loop
    permitted:=true;
    insert into public.rb_agreement_approvals(agreement_id,circle_id,user_id,approval_version) values(a.id,c.id,p_user,a.approval_version)
      on conflict(agreement_id,circle_id) do update set user_id=excluded.user_id,approval_version=excluded.approval_version,approved_at=now();
  end loop;
  if not permitted then raise exception 'circle_leader_required' using errcode='42501'; end if;
  if exists(select 1 from public.rb_agreement_approvals where agreement_id=a.id and circle_id=a.circle_id and approval_version=a.approval_version)
     and (a.counterparty_circle_id is null or exists(select 1 from public.rb_agreement_approvals where agreement_id=a.id and circle_id=a.counterparty_circle_id and approval_version=a.approval_version)) then
    update public.rb_success_agreements set status='accepted',accepted_at=now() where id=a.id returning * into a;
  end if;
  return to_jsonb(a);
end;
$$;
create function public.rb_record_approved_event(p_user uuid,p_agreement uuid,p_event jsonb) returns jsonb
language plpgsql security invoker set search_path='' as $$
declare a public.rb_success_agreements; e public.rb_success_events; kind text:=p_event->>'event_type'; amount numeric:=nullif(p_event->>'event_value','')::numeric;
begin
  select * into a from public.rb_success_agreements where id=p_agreement for update;
  if a.id is null or a.status not in('accepted','active','earned') then raise exception 'agreement_not_approved'; end if;
  if not exists(select 1 from public.rb_circles where id in(a.circle_id,a.counterparty_circle_id) and created_by=p_user and active) then raise exception 'circle_leader_required' using errcode='42501'; end if;
  if kind not in('meeting','proposal','signed','invoice','collected','closed','custom') then raise exception 'event_invalid'; end if;
  if (kind in('collected','invoice') or (kind=a.trigger_event and a.reward_type in('collected_revenue_percent','revenue_percent','margin_percent'))) and (amount is null or amount<=0 or amount>1000000000000) then raise exception 'event_value_required'; end if;
  insert into public.rb_success_events(agreement_id,circle_id,created_by,event_type,event_value,note,occurred_at)
    values(a.id,a.circle_id,p_user,kind,nullif(p_event->>'event_value','')::numeric,left(coalesce(p_event->>'note',''),2000),now()) returning * into e;
  if (kind=a.trigger_event or (kind='invoice' and a.trigger_event='first_invoice')) and a.reward_type<>'none' then update public.rb_success_agreements set status='earned' where id=a.id; end if;
  return to_jsonb(e);
end;
$$;
revoke all on function public.rb_set_leader_approval(uuid,uuid,boolean),public.rb_create_owned_circle(uuid,text),public.rb_accept_person_account_invite(uuid,text),public.rb_save_named_agreement(uuid,uuid,jsonb,jsonb,boolean),public.rb_approve_named_agreement(uuid,uuid,integer),public.rb_record_approved_event(uuid,uuid,jsonb) from public,anon,authenticated;
grant execute on function public.rb_set_leader_approval(uuid,uuid,boolean),public.rb_create_owned_circle(uuid,text),public.rb_accept_person_account_invite(uuid,text),public.rb_save_named_agreement(uuid,uuid,jsonb,jsonb,boolean),public.rb_approve_named_agreement(uuid,uuid,integer),public.rb_record_approved_event(uuid,uuid,jsonb) to service_role;

update public.rb_circles set name=replace(replace(name,' — ',' '),' – ',' ') where is_example;
update public.rb_people set relationship_owner=replace(replace(relationship_owner,' — ',' '),' – ',' ') where is_example;
