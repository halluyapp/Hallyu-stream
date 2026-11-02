-- HALLYU-STREAM pairing backend — signalling only (ADR 002, `06`, `07`, `08`, `09`).
-- No table, function, or policy in this file stores or returns media URLs or video bytes.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'pairing_status') then
    create type public.pairing_status as enum ('pending', 'approved', 'expired', 'rejected', 'revoked');
  end if;
  if not exists (select 1 from pg_type where typname = 'device_type') then
    create type public.device_type as enum ('tv', 'mobile');
  end if;
end $$;

-- ── Tables ────────────────────────────────────────────────────────────────

create table if not exists public.pairing_sessions (
  id uuid primary key default gen_random_uuid(),
  short_code_hash text not null,
  status public.pairing_status not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  tv_name text,
  tv_model text,
  approved_by text,
  approved_at timestamptz,
  consumed_at timestamptz,
  rejected_at timestamptz,
  device_id uuid,
  token_delivered_at timestamptz
);

create unique index if not exists pairing_sessions_pending_code_idx
  on public.pairing_sessions (short_code_hash) where status = 'pending';
create index if not exists pairing_sessions_status_expiry_idx
  on public.pairing_sessions (status, expires_at);

create table if not exists public.devices (
  id uuid primary key default gen_random_uuid(),
  owner_installation_id text not null,
  display_name text not null,
  model text,
  type public.device_type not null default 'tv',
  credential_hash text not null unique,
  last_seen_at timestamptz,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

create index if not exists devices_owner_idx on public.devices (owner_installation_id, revoked_at);
create index if not exists devices_credential_idx on public.devices (credential_hash);

create table if not exists public.pairing_rate_limits (
  subject text not null,
  action text not null,
  window_start timestamptz not null default now(),
  count integer not null default 0,
  primary key (subject, action)
);

alter table public.pairing_sessions enable row level security;
alter table public.devices enable row level security;
alter table public.pairing_rate_limits enable row level security;

-- No public/anon policies: only the service-role Edge Function may read or write.
grant all on public.pairing_sessions, public.devices, public.pairing_rate_limits to service_role;

-- ── Rate limiting ─────────────────────────────────────────────────────────

create or replace function public.pairing_rate_limit(
  p_subject text,
  p_action text,
  p_max integer,
  p_window_seconds integer
) returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_count integer;
begin
  insert into public.pairing_rate_limits as r (subject, action, window_start, count)
  values (p_subject, p_action, now(), 1)
  on conflict (subject, action) do update
    set window_start = case
          when r.window_start < now() - (p_window_seconds || ' seconds')::interval then now()
          else r.window_start
        end,
        count = case
          when r.window_start < now() - (p_window_seconds || ' seconds')::interval then 1
          else r.count + 1
        end
  returning r.count into v_count;
  return coalesce(v_count, 1) <= p_max;
end $$;

-- ── Session lifecycle ─────────────────────────────────────────────────────

create or replace function public.create_pairing_session(
  p_short_code_hash text,
  p_ttl_seconds integer,
  p_tv_name text default null,
  p_tv_model text default null
) returns table (id uuid, expires_at timestamptz)
language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.pairing_sessions
     set status = 'expired'
   where status = 'pending' and expires_at <= now();

  insert into public.pairing_sessions (short_code_hash, expires_at, tv_name, tv_model)
  values (p_short_code_hash, now() + (p_ttl_seconds || ' seconds')::interval, p_tv_name, p_tv_model)
  returning pairing_sessions.id, pairing_sessions.expires_at into id, expires_at;

  return next;
end $$;

create or replace function public.approve_pairing_session(
  p_challenge_id uuid,
  p_installation_id text,
  p_credential_hash text,
  p_display_name text default 'Android TV',
  p_model text default null
) returns table (device_id uuid, status text)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_session public.pairing_sessions%rowtype;
  v_device_id uuid;
begin
  select * into v_session from public.pairing_sessions where id = p_challenge_id for update;

  if not found then
    device_id := null; status := 'not_found'; return next; return;
  end if;

  if v_session.status <> 'pending' then
    device_id := v_session.device_id; status := v_session.status::text; return next; return;
  end if;

  if v_session.expires_at <= now() then
    update public.pairing_sessions set status = 'expired' where id = p_challenge_id;
    device_id := null; status := 'expired'; return next; return;
  end if;

  insert into public.devices (owner_installation_id, display_name, model, type, credential_hash)
  values (
    p_installation_id,
    coalesce(nullif(p_display_name, ''), v_session.tv_name, 'Android TV'),
    coalesce(p_model, v_session.tv_model),
    'tv',
    p_credential_hash
  )
  returning devices.id into v_device_id;

  update public.pairing_sessions
     set status = 'approved',
         approved_by = p_installation_id,
         approved_at = now(),
         consumed_at = now(),
         device_id = v_device_id
   where id = p_challenge_id;

  device_id := v_device_id;
  status := 'approved';
  return next;
end $$;

create or replace function public.reject_pairing_session(p_challenge_id uuid)
returns table (status text)
language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.pairing_sessions
     set status = 'rejected', rejected_at = now()
   where id = p_challenge_id and status = 'pending';

  if found then
    status := 'rejected';
  else
    select coalesce(pairing_sessions.status::text, 'not_found') into status
      from public.pairing_sessions where id = p_challenge_id;
    status := coalesce(status, 'not_found');
  end if;
  return next;
end $$;

-- A device token is delivered to the TV exactly once; replay gets no token.
create or replace function public.claim_device_token(p_challenge_id uuid)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_count integer;
begin
  update public.pairing_sessions
     set token_delivered_at = now()
   where id = p_challenge_id
     and status = 'approved'
     and token_delivered_at is null;
  get diagnostics v_count = row_count;
  return v_count > 0;
end $$;

-- ── Devices ───────────────────────────────────────────────────────────────

create or replace function public.list_devices(p_installation_id text)
returns table (
  id uuid,
  display_name text,
  model text,
  last_seen_at timestamptz,
  created_at timestamptz,
  revoked_at timestamptz
)
language sql security definer set search_path = public, extensions as $$
  select d.id, d.display_name, d.model, d.last_seen_at, d.created_at, d.revoked_at
    from public.devices d
   where d.owner_installation_id = p_installation_id
   order by d.created_at desc;
$$;

create or replace function public.revoke_device(p_device_id uuid, p_installation_id text)
returns boolean
language plpgsql security definer set search_path = public, extensions as $$
begin
  update public.devices
     set revoked_at = now()
   where id = p_device_id
     and owner_installation_id = p_installation_id
     and revoked_at is null;
  return found;
end $$;

create or replace function public.heartbeat_device(p_credential_hash text)
returns table (device_id uuid, revoked boolean)
language plpgsql security definer set search_path = public, extensions as $$
declare
  v_row public.devices%rowtype;
begin
  select * into v_row from public.devices where credential_hash = p_credential_hash;
  if not found then
    device_id := null; revoked := true; return next; return;
  end if;
  if v_row.revoked_at is not null then
    device_id := v_row.id; revoked := true; return next; return;
  end if;
  update public.devices set last_seen_at = now() where id = v_row.id;
  device_id := v_row.id; revoked := false; return next;
end $$;

-- ── Privileges ────────────────────────────────────────────────────────────

revoke all on function public.pairing_rate_limit(text, text, integer, integer) from public;
revoke all on function public.create_pairing_session(text, integer, text, text) from public;
revoke all on function public.approve_pairing_session(uuid, text, text, text, text) from public;
revoke all on function public.reject_pairing_session(uuid) from public;
revoke all on function public.claim_device_token(uuid) from public;
revoke all on function public.list_devices(text) from public;
revoke all on function public.revoke_device(uuid, text) from public;
revoke all on function public.heartbeat_device(text) from public;

grant execute on function public.pairing_rate_limit(text, text, integer, integer) to service_role;
grant execute on function public.create_pairing_session(text, integer, text, text) to service_role;
grant execute on function public.approve_pairing_session(uuid, text, text, text, text) to service_role;
grant execute on function public.reject_pairing_session(uuid) to service_role;
grant execute on function public.claim_device_token(uuid) to service_role;
grant execute on function public.list_devices(text) to service_role;
grant execute on function public.revoke_device(uuid, text) to service_role;
grant execute on function public.heartbeat_device(text) to service_role;

comment on table public.pairing_sessions is 'Short-lived QR/short-code pairing challenges. Never contains media URLs.';
comment on table public.devices is 'Paired TVs owned by an anonymous local installation id. Revocation is permanent.';
