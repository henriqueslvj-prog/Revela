-- Revela V0.1 | Banco de dados completo (Supabase / PostgreSQL)
-- Execute este arquivo inteiro no SQL Editor do Supabase. Pode ser executado mais de uma vez.
--
-- Depois de executar:
--   1. Crie o primeiro usuário em Authentication > Users.
--   2. Torne-o administrador (troque o e-mail):
--        update public.profiles set role = 'administrador', full_name = 'Seu Nome'
--        where email = 'seu@email.com';
--   3. Publique a função supabase/functions/admin-create-user (veja o README).

create extension if not exists "pgcrypto";

-- ============================================================
-- 1. Perfis e permissões (base herdada do ELO, perfis do estúdio)
-- ============================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  role text not null default 'atendimento'
    check (role in ('administrador','fotografo','editor','atendimento')),
  status text not null default 'ativo' check (status in ('ativo','inativo')),
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_permissions (
  user_id uuid not null references public.profiles(id) on delete cascade,
  module text not null,
  can_view boolean not null default false,
  can_create boolean not null default false,
  can_edit boolean not null default false,
  can_delete boolean not null default false,
  primary key (user_id, module)
);

-- Se você já usou uma versão anterior com outros perfis, esta linha atualiza a regra.
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check
  check (role in ('administrador','fotografo','editor','atendimento'));

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid() and role = 'administrador' and status = 'ativo'
  );
$$;

-- Regra central de acesso: administrador ativo pode tudo; os demais, conforme user_permissions.
create or replace function public.has_permission(p_module text, p_action text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists(
    select 1 from public.profiles p
    where p.id = auth.uid() and p.status = 'ativo'
      and (
        p.role = 'administrador'
        or exists(
          select 1 from public.user_permissions up
          where up.user_id = p.id and up.module = p_module
            and case p_action
                  when 'view'   then up.can_view
                  when 'create' then up.can_create
                  when 'edit'   then up.can_edit
                  when 'delete' then up.can_delete
                  else false
                end
        )
      )
  );
$$;

-- Lista segura da equipe ativa (para escolher responsáveis). Não expõe e-mail nem telefone.
create or replace function public.get_active_team_members()
returns table (id uuid, full_name text, role text)
language sql stable security definer set search_path = public as $$
  select p.id, p.full_name, p.role
  from public.profiles p
  where p.status = 'ativo'
    and exists(select 1 from public.profiles me where me.id = auth.uid() and me.status = 'ativo')
  order by p.full_name;
$$;

revoke all on function public.is_admin() from public, anon;
revoke all on function public.has_permission(text, text) from public, anon;
revoke all on function public.get_active_team_members() from public, anon;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.has_permission(text, text) to authenticated;
grant execute on function public.get_active_team_members() to authenticated;

alter table public.profiles enable row level security;
alter table public.user_permissions enable row level security;

drop policy if exists "users can read own profile" on public.profiles;
drop policy if exists "admins can insert profiles" on public.profiles;
drop policy if exists "admins can update profiles" on public.profiles;
drop policy if exists "admins can read permissions" on public.user_permissions;
drop policy if exists "users can read own permissions" on public.user_permissions;
drop policy if exists "admins can insert permissions" on public.user_permissions;
drop policy if exists "admins can update permissions" on public.user_permissions;
drop policy if exists "admins can delete permissions" on public.user_permissions;

create policy "users can read own profile" on public.profiles
  for select to authenticated using (id = auth.uid() or public.is_admin());
create policy "admins can insert profiles" on public.profiles
  for insert to authenticated with check (public.is_admin());
create policy "admins can update profiles" on public.profiles
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy "admins can read permissions" on public.user_permissions
  for select to authenticated using (public.is_admin());
create policy "users can read own permissions" on public.user_permissions
  for select to authenticated using (user_id = auth.uid());
create policy "admins can insert permissions" on public.user_permissions
  for insert to authenticated with check (public.is_admin());
create policy "admins can update permissions" on public.user_permissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());
create policy "admins can delete permissions" on public.user_permissions
  for delete to authenticated using (public.is_admin());

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.user_permissions to authenticated;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', 'Usuário'), new.email)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 2. Clientes
-- ============================================================

create table if not exists public.clientes (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  tipo text not null default 'pessoa' check (tipo in ('pessoa','empresa')),
  documento text,
  email text,
  telefone text,
  endereco text,
  origem text,
  observacoes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists clientes_nome_idx on public.clientes (nome);

-- ============================================================
-- 3. Projetos (ensaios e trabalhos)
-- ============================================================

create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  tipo text,
  status text not null default 'orcamento'
    check (status in ('orcamento','agendado','em_andamento','entregue','concluido','cancelado')),
  data_inicio date,
  data_entrega date,
  local text,
  responsavel_id uuid references public.profiles(id) on delete set null,
  observacoes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists projetos_cliente_idx on public.projetos (cliente_id);
create index if not exists projetos_status_idx on public.projetos (status);

-- ============================================================
-- 4. Contratos
-- ============================================================

create sequence if not exists public.contratos_numero_seq;

create table if not exists public.contratos (
  id uuid primary key default gen_random_uuid(),
  numero text not null unique
    default ('CT-' || lpad(nextval('public.contratos_numero_seq')::text, 4, '0')),
  cliente_id uuid not null references public.clientes(id) on delete restrict,
  projeto_id uuid references public.projetos(id) on delete set null,
  servico text not null,
  valor numeric(12,2) check (valor is null or valor >= 0),
  forma_pagamento text,
  uso_imagem text,
  data_emissao date default current_date,
  data_assinatura date,
  status text not null default 'rascunho'
    check (status in ('rascunho','enviado','assinado','encerrado','cancelado')),
  observacoes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists contratos_cliente_idx on public.contratos (cliente_id);
create index if not exists contratos_status_idx on public.contratos (status);

-- ============================================================
-- 5. Prazos e entregas
-- ============================================================

create table if not exists public.prazos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  projeto_id uuid references public.projetos(id) on delete set null,
  etapa text not null default 'edicao'
    check (etapa in ('captacao','selecao','edicao','entrega','outro')),
  responsavel_id uuid references public.profiles(id) on delete set null,
  prioridade text not null default 'media' check (prioridade in ('baixa','media','alta','urgente')),
  status text not null default 'pendente'
    check (status in ('pendente','em_andamento','concluido','cancelado')),
  data_limite date not null,
  observacoes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prazos_data_idx on public.prazos (data_limite);
create index if not exists prazos_status_idx on public.prazos (status);
create index if not exists prazos_responsavel_idx on public.prazos (responsavel_id);

-- ============================================================
-- 6. Agenda de sessões
-- ============================================================

create table if not exists public.sessoes (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  projeto_id uuid references public.projetos(id) on delete set null,
  inicio timestamptz not null,
  fim timestamptz,
  local text,
  equipe text,
  status text not null default 'agendada' check (status in ('agendada','realizada','cancelada')),
  observacoes text,
  created_by uuid default auth.uid() references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (fim is null or fim >= inicio)
);
create index if not exists sessoes_inicio_idx on public.sessoes (inicio);

-- ============================================================
-- 7. Gatilhos, segurança por linha (RLS) e permissões de acesso
-- ============================================================

grant usage on sequence public.contratos_numero_seq to authenticated;

do $$
declare
  t record;
begin
  for t in
    select * from (values
      ('clientes',  'clientes'),
      ('projetos',  'projetos'),
      ('contratos', 'contratos'),
      ('prazos',    'prazos'),
      ('sessoes',   'agenda')
    ) as v(tbl, modulo)
  loop
    execute format('drop trigger if exists %I on public.%I', t.tbl || '_set_updated_at', t.tbl);
    execute format(
      'create trigger %I before update on public.%I for each row execute function public.set_updated_at()',
      t.tbl || '_set_updated_at', t.tbl);

    execute format('alter table public.%I enable row level security', t.tbl);

    execute format('drop policy if exists "revela select" on public.%I', t.tbl);
    execute format('drop policy if exists "revela insert" on public.%I', t.tbl);
    execute format('drop policy if exists "revela update" on public.%I', t.tbl);
    execute format('drop policy if exists "revela delete" on public.%I', t.tbl);

    execute format(
      'create policy "revela select" on public.%I for select to authenticated using (public.has_permission(%L, ''view''))',
      t.tbl, t.modulo);
    execute format(
      'create policy "revela insert" on public.%I for insert to authenticated with check (public.has_permission(%L, ''create''))',
      t.tbl, t.modulo);
    execute format(
      'create policy "revela update" on public.%I for update to authenticated using (public.has_permission(%L, ''edit'')) with check (public.has_permission(%L, ''edit''))',
      t.tbl, t.modulo, t.modulo);
    execute format(
      'create policy "revela delete" on public.%I for delete to authenticated using (public.has_permission(%L, ''delete''))',
      t.tbl, t.modulo);

    execute format('grant select, insert, update, delete on public.%I to authenticated', t.tbl);
  end loop;
end $$;
