-- PREPARED, NOT APPLIED. Apply to an isolated Supabase project after consent.
-- Owner-only foundation. Cross-member sharing is intentionally not enabled.
begin;
create table public.kb_records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check(length(name) between 1 and 160),
  kind text not null default 'company' check(kind in ('person','company')),
  role text not null default '', sector text not null default '', city text not null default '',
  connector text not null default '', offers text not null default '', needs text not null default '',
  constraints_note text not null default '', source text not null default '', source_date date,
  review_date date, verification text not null default 'followup' check(verification in ('confirmed','followup','heard')),
  sharing_intent text not null default 'private' check(sharing_intent in ('private','intro','circle')),
  can_introduce boolean not null default false, private_notes text not null default '',
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(id,owner_id), check(length(offers)>0 or length(needs)>0)
);
create table public.kb_opportunities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  needer_id uuid not null, provider_id uuid not null, title text not null,
  reasons jsonb not null default '[]', checks jsonb not null default '[]',
  created_at timestamptz not null default now(), unique(id,owner_id),
  foreign key (needer_id,owner_id) references public.kb_records(id,owner_id) on delete cascade,
  foreign key (provider_id,owner_id) references public.kb_records(id,owner_id) on delete cascade,
  unique(owner_id,needer_id,provider_id), check(needer_id<>provider_id)
);
create table public.kb_introductions (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  opportunity_id uuid not null, stage text not null default 'review'
    check(stage in ('review','consent','introduced','meeting','followup','completed','paused')),
  consent_a boolean not null default false, consent_b boolean not null default false,
  consent_evidence text not null default '', owner_label text not null default '',
  due date, next_step text not null default '', outcome text not null default '',
  updated_at timestamptz not null default now(),
  foreign key (opportunity_id,owner_id) references public.kb_opportunities(id,owner_id) on delete cascade,
  check(stage in ('review','consent','paused') or (consent_a and consent_b and length(trim(consent_evidence))>0)),
  check(stage<>'completed' or length(trim(outcome))>0)
);
create table public.kb_tasks (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null check(length(title) between 1 and 250), owner_label text not null default '',
  due date, notes text not null default '', done boolean not null default false,
  updated_at timestamptz not null default now()
);
do $$ declare t text; begin
 foreach t in array array['kb_records','kb_opportunities','kb_introductions','kb_tasks'] loop
  execute format('alter table public.%I enable row level security', t);
  execute format('alter table public.%I force row level security', t);
  execute format('revoke all on public.%I from anon',t);
  execute format('grant select,insert,update,delete on public.%I to authenticated',t);
  execute format('create policy owner_only on public.%I for all to authenticated using ((select auth.uid())=owner_id) with check ((select auth.uid())=owner_id)',t);
  execute format('create index %I on public.%I(owner_id)', t||'_owner_idx',t);
 end loop;
end $$;
commit;
-- Before enabling sharing: separate publishable projections from private notes;
-- design circle/member policies and revocation, and test authenticated A vs B.
-- Never enable AI or a service-role client in the public browser bundle.
