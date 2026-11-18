-- Building Fit Audit — schéma Supabase
-- À exécuter une fois dans Supabase > SQL Editor. Ré-exécutable sans risque.

create table if not exists public.audits (
  id             uuid primary key default gen_random_uuid(),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by     uuid default auth.uid() references auth.users (id) on delete set null,
  form_id        text not null,
  form_version   text not null,
  gym_name       text not null,
  governorate    text,
  city           text,
  audit_date     date,
  auditor_name   text,
  answers        jsonb not null default '{}'::jsonb,
  score          numeric(5,1) not null check (score >= 0 and score <= 100),
  grade          text not null check (grade in ('A', 'B', 'C', 'D', 'E')),
  critical_count integer not null default 0,
  score_details  jsonb not null default '{}'::jsonb
);

create index if not exists audits_audit_date_idx on public.audits (audit_date desc, created_at desc);

-- Horodatage et auteur de la dernière modification ; création non modifiable.
create or replace function public.audits_touch()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  new.created_at := old.created_at;
  new.created_by := old.created_by;
  return new;
end;
$$;

drop trigger if exists audits_touch on public.audits;
create trigger audits_touch
  before update on public.audits
  for each row execute function public.audits_touch();

-- Accès : uniquement les utilisateurs connectés.
alter table public.audits enable row level security;
revoke all on public.audits from anon;
grant select, insert, update, delete on public.audits to authenticated;

drop policy if exists audits_select on public.audits;
drop policy if exists audits_insert on public.audits;
drop policy if exists audits_update on public.audits;
drop policy if exists audits_delete on public.audits;

create policy audits_select on public.audits for select to authenticated using (true);
create policy audits_insert on public.audits for insert to authenticated with check (created_by = (select auth.uid()));
create policy audits_update on public.audits for update to authenticated using (true) with check (true);
create policy audits_delete on public.audits for delete to authenticated using (true);
