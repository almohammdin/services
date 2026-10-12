create or replace function private.rb_can_read_agreement(p_id uuid) returns boolean
language sql stable security definer set search_path='' as $$
 select (select auth.uid()) is not null and exists(
   select 1 from public.rb_success_agreements a where a.id=p_id and (
     exists(select 1 from public.rb_circles c where c.id in(a.circle_id,a.counterparty_circle_id) and c.created_by=(select auth.uid()))
     or exists(select 1 from public.rb_platform_bootstrap b where b.id=1 and b.owner_user_id=(select auth.uid()))
   )
 );
$$;
alter policy rb_success_agreement_member_select on public.rb_success_agreements using((select private.rb_can_read_agreement(id)));
alter policy rb_success_splits_member_select on public.rb_success_splits using((select private.rb_can_read_agreement(agreement_id)));
alter policy rb_success_events_member_select on public.rb_success_events using((select private.rb_can_read_agreement(agreement_id)));
