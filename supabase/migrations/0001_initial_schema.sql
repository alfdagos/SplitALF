-- =============================================================================
-- SplitALF — Migration 0001: schema iniziale
-- =============================================================================
-- Crea le tabelle applicative, i vincoli, gli indici, il trigger di
-- creazione automatica del profilo e le funzioni helper SECURITY DEFINER
-- usate dalle policy RLS (vedi 0002_rls_policies.sql).
-- =============================================================================

-- Estensione per gen_random_uuid() (presente di default su Supabase).
create extension if not exists "pgcrypto";

-- -----------------------------------------------------------------------------
-- profiles : un record per ogni utente autenticato (1:1 con auth.users)
-- -----------------------------------------------------------------------------
create table if not exists public.profiles (
  id         uuid primary key references auth.users (id) on delete cascade,
  email      text not null,
  name       text not null,
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- groups : gruppo di spesa, creato da un utente
-- -----------------------------------------------------------------------------
create table if not exists public.groups (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(trim(name)) between 1 and 80),
  created_by uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists groups_created_by_idx on public.groups (created_by);

-- -----------------------------------------------------------------------------
-- group_members : relazione N:N tra utenti e gruppi
-- -----------------------------------------------------------------------------
create table if not exists public.group_members (
  group_id  uuid not null references public.groups (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  joined_at timestamptz not null default now(),
  primary key (group_id, user_id)
);

create index if not exists group_members_user_id_idx on public.group_members (user_id);

-- -----------------------------------------------------------------------------
-- expenses : una spesa appartenente a un gruppo, pagata da un membro
-- -----------------------------------------------------------------------------
create table if not exists public.expenses (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.groups (id) on delete cascade,
  description  text not null check (char_length(trim(description)) between 1 and 140),
  amount       numeric(10, 2) not null check (amount > 0),
  paid_by      uuid not null references public.profiles (id),
  expense_date date not null default current_date,
  created_at   timestamptz not null default now()
);

create index if not exists expenses_group_id_idx on public.expenses (group_id);
create index if not exists expenses_paid_by_idx on public.expenses (paid_by);

-- -----------------------------------------------------------------------------
-- expense_shares : quota dovuta da ciascun membro per una spesa
-- -----------------------------------------------------------------------------
create table if not exists public.expense_shares (
  expense_id uuid not null references public.expenses (id) on delete cascade,
  user_id    uuid not null references public.profiles (id),
  amount_due numeric(10, 2) not null check (amount_due >= 0),
  primary key (expense_id, user_id)
);

create index if not exists expense_shares_user_id_idx on public.expense_shares (user_id);

-- =============================================================================
-- Trigger: crea automaticamente il profilo alla registrazione di un utente.
-- =============================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, name)
  values (
    new.id,
    new.email,
    coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- =============================================================================
-- Funzioni helper SECURITY DEFINER
-- -----------------------------------------------------------------------------
-- Usate dalle policy RLS. Girano con i privilegi del proprietario della
-- funzione e quindi *bypassano* RLS: questo evita la ricorsione infinita che
-- si verificherebbe se una policy su group_members interrogasse group_members.
-- =============================================================================

-- L'utente corrente è membro del gruppo indicato?
create or replace function public.is_member_of(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members
    where group_id = _group_id
      and user_id = auth.uid()
  );
$$;

-- L'utente corrente è il creatore del gruppo indicato?
create or replace function public.is_group_creator(_group_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.groups
    where id = _group_id
      and created_by = auth.uid()
  );
$$;

-- L'utente corrente condivide almeno un gruppo con l'utente indicato?
create or replace function public.shares_group_with(_other uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.group_members me
    join public.group_members other on me.group_id = other.group_id
    where me.user_id = auth.uid()
      and other.user_id = _other
  );
$$;

-- L'utente corrente può accedere alla spesa indicata (è membro del suo gruppo)?
create or replace function public.can_access_expense(_expense_id uuid)
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.expenses e
    where e.id = _expense_id
      and public.is_member_of(e.group_id)
  );
$$;

-- =============================================================================
-- RPC: aggiungi un membro a un gruppo tramite email.
-- -----------------------------------------------------------------------------
-- Il client non può interrogare auth.users né i profili altrui: questa RPC
-- (SECURITY DEFINER) effettua il lookup dell'email e l'inserimento, dopo aver
-- verificato che il chiamante sia membro del gruppo.
-- L'utente invitato deve essersi già registrato a SplitALF.
-- =============================================================================
create or replace function public.add_member_by_email(_group_id uuid, _email text)
returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  _profile public.profiles;
begin
  if not public.is_member_of(_group_id) then
    raise exception 'Non sei autorizzato ad aggiungere membri a questo gruppo'
      using errcode = '42501';
  end if;

  select * into _profile
  from public.profiles
  where lower(email) = lower(trim(_email));

  if _profile.id is null then
    raise exception 'Nessun utente registrato con questa email: %', _email
      using errcode = 'P0002';
  end if;

  insert into public.group_members (group_id, user_id)
  values (_group_id, _profile.id)
  on conflict (group_id, user_id) do nothing;

  return _profile;
end;
$$;

-- =============================================================================
-- RPC: crea una spesa con le relative quote in un'unica transazione atomica.
-- -----------------------------------------------------------------------------
-- _shares è un array JSON: [{ "user_id": "uuid", "amount_due": 12.50 }, ...]
-- La somma delle quote deve coincidere (entro 1 centesimo) con l'importo.
-- =============================================================================
create or replace function public.create_expense_with_shares(
  _group_id     uuid,
  _description  text,
  _amount       numeric,
  _paid_by      uuid,
  _expense_date date,
  _shares       jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  _expense_id   uuid;
  _share        jsonb;
  _shares_total numeric(12, 2) := 0;
begin
  if not public.is_member_of(_group_id) then
    raise exception 'Non sei autorizzato a inserire spese in questo gruppo'
      using errcode = '42501';
  end if;

  if jsonb_typeof(_shares) <> 'array' or jsonb_array_length(_shares) = 0 then
    raise exception 'Devi specificare almeno una quota';
  end if;

  for _share in select * from jsonb_array_elements(_shares)
  loop
    _shares_total := _shares_total + (_share ->> 'amount_due')::numeric;
  end loop;

  if abs(_shares_total - _amount) > 0.01 then
    raise exception 'La somma delle quote (%) non corrisponde all''importo (%)',
      _shares_total, _amount;
  end if;

  insert into public.expenses (group_id, description, amount, paid_by, expense_date)
  values (_group_id, _description, _amount, _paid_by, _expense_date)
  returning id into _expense_id;

  for _share in select * from jsonb_array_elements(_shares)
  loop
    insert into public.expense_shares (expense_id, user_id, amount_due)
    values (
      _expense_id,
      (_share ->> 'user_id')::uuid,
      (_share ->> 'amount_due')::numeric
    );
  end loop;

  return _expense_id;
end;
$$;

-- =============================================================================
-- RPC: crea un gruppo e iscrive il creatore come membro, atomicamente.
-- -----------------------------------------------------------------------------
-- SECURITY DEFINER: imposta created_by = auth.uid() lato server ed esegue
-- entrambi gli insert bypassando RLS, evitando il problema "uovo e gallina"
-- (il creatore non è ancora membro, quindi non vedrebbe la riga appena creata).
-- =============================================================================
create or replace function public.create_group(_name text)
returns public.groups
language plpgsql
security definer
set search_path = public
as $$
declare
  _uid   uuid := auth.uid();
  _group public.groups;
begin
  if _uid is null then
    raise exception 'Devi essere autenticato per creare un gruppo'
      using errcode = '42501';
  end if;

  insert into public.groups (name, created_by)
  values (trim(_name), _uid)
  returning * into _group;

  insert into public.group_members (group_id, user_id)
  values (_group.id, _uid)
  on conflict (group_id, user_id) do nothing;

  return _group;
end;
$$;
