-- =============================================================================
-- SplitMate — Migration 0002: Row Level Security
-- =============================================================================
-- Abilita RLS su tutte le tabelle e definisce le policy. Regola generale:
-- un utente può vedere/modificare solo i dati dei gruppi di cui è membro.
-- Le policy usano le funzioni SECURITY DEFINER definite in 0001 per evitare
-- la ricorsione infinita tipica delle policy auto-referenziali.
-- =============================================================================

alter table public.profiles       enable row level security;
alter table public.groups          enable row level security;
alter table public.group_members   enable row level security;
alter table public.expenses        enable row level security;
alter table public.expense_shares  enable row level security;

-- -----------------------------------------------------------------------------
-- profiles
-- -----------------------------------------------------------------------------
-- Lettura: il proprio profilo + i profili delle persone con cui si condivide
-- almeno un gruppo (necessario per mostrare nome/email dei membri).
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.shares_group_with(id));

-- Inserimento manuale del proprio profilo (fallback; di norma lo crea il trigger).
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  to authenticated
  with check (id = auth.uid());

-- Aggiornamento del solo proprio profilo.
drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- -----------------------------------------------------------------------------
-- groups
-- -----------------------------------------------------------------------------
-- Lettura: solo i gruppi di cui si è membri.
drop policy if exists "groups_select_member" on public.groups;
create policy "groups_select_member"
  on public.groups for select
  to authenticated
  using (public.is_member_of(id));

-- Creazione: chiunque, purché si dichiari creatore.
drop policy if exists "groups_insert_creator" on public.groups;
create policy "groups_insert_creator"
  on public.groups for insert
  to authenticated
  with check (created_by = auth.uid());

-- Modifica (es. nome): qualsiasi membro del gruppo.
drop policy if exists "groups_update_member" on public.groups;
create policy "groups_update_member"
  on public.groups for update
  to authenticated
  using (public.is_member_of(id))
  with check (public.is_member_of(id));

-- Eliminazione: solo il creatore.
drop policy if exists "groups_delete_creator" on public.groups;
create policy "groups_delete_creator"
  on public.groups for delete
  to authenticated
  using (created_by = auth.uid());

-- -----------------------------------------------------------------------------
-- group_members
-- -----------------------------------------------------------------------------
-- Lettura: i membri dei gruppi di cui si fa parte.
drop policy if exists "group_members_select" on public.group_members;
create policy "group_members_select"
  on public.group_members for select
  to authenticated
  using (public.is_member_of(group_id));

-- Inserimento: il creatore del gruppo (per aggiungere se stesso/altri) o un
-- membro esistente. Le aggiunte via email passano comunque dalla RPC dedicata.
drop policy if exists "group_members_insert" on public.group_members;
create policy "group_members_insert"
  on public.group_members for insert
  to authenticated
  with check (public.is_group_creator(group_id) or public.is_member_of(group_id));

-- Rimozione: il creatore può rimuovere chiunque; un membro può lasciare il gruppo.
drop policy if exists "group_members_delete" on public.group_members;
create policy "group_members_delete"
  on public.group_members for delete
  to authenticated
  using (public.is_group_creator(group_id) or user_id = auth.uid());

-- -----------------------------------------------------------------------------
-- expenses
-- -----------------------------------------------------------------------------
-- Lettura/scrittura: riservate ai membri del gruppo della spesa.
drop policy if exists "expenses_select" on public.expenses;
create policy "expenses_select"
  on public.expenses for select
  to authenticated
  using (public.is_member_of(group_id));

drop policy if exists "expenses_insert" on public.expenses;
create policy "expenses_insert"
  on public.expenses for insert
  to authenticated
  with check (public.is_member_of(group_id));

drop policy if exists "expenses_update" on public.expenses;
create policy "expenses_update"
  on public.expenses for update
  to authenticated
  using (public.is_member_of(group_id))
  with check (public.is_member_of(group_id));

drop policy if exists "expenses_delete" on public.expenses;
create policy "expenses_delete"
  on public.expenses for delete
  to authenticated
  using (public.is_member_of(group_id));

-- -----------------------------------------------------------------------------
-- expense_shares
-- -----------------------------------------------------------------------------
-- Accesso consentito se si è membri del gruppo a cui appartiene la spesa.
drop policy if exists "expense_shares_select" on public.expense_shares;
create policy "expense_shares_select"
  on public.expense_shares for select
  to authenticated
  using (public.can_access_expense(expense_id));

drop policy if exists "expense_shares_insert" on public.expense_shares;
create policy "expense_shares_insert"
  on public.expense_shares for insert
  to authenticated
  with check (public.can_access_expense(expense_id));

drop policy if exists "expense_shares_update" on public.expense_shares;
create policy "expense_shares_update"
  on public.expense_shares for update
  to authenticated
  using (public.can_access_expense(expense_id))
  with check (public.can_access_expense(expense_id));

drop policy if exists "expense_shares_delete" on public.expense_shares;
create policy "expense_shares_delete"
  on public.expense_shares for delete
  to authenticated
  using (public.can_access_expense(expense_id));
