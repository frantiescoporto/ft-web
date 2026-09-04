-- ============================================================
--  Frantiesco Trader · Cadastro de clientes
--  Cole no SQL Editor do Supabase e clique RUN
-- ============================================================

create table if not exists public.clientes (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  nome               text not null,
  telefone           text not null,
  tempo_cliente      text,
  produtos           text[] not null default '{}',
  corretora          text,
  assessoria         text,
  profit             text,
  modulo             text,
  portfolio_mentoria text
);

alter table public.clientes enable row level security;

-- Qualquer visitante pode ENVIAR o cadastro
drop policy if exists "publico envia cadastro" on public.clientes;
create policy "publico envia cadastro"
  on public.clientes
  for insert
  to anon
  with check (true);

-- Nenhum acesso público de LEITURA: são dados privados dos clientes.
-- Você consulta e exporta pelo painel do Supabase (Table Editor).

-- Se você JÁ tinha criado a tabela antes, rode também esta linha:
alter table public.clientes add column if not exists assessoria text;
