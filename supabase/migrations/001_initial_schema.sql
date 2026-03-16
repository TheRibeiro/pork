-- ============================================================
-- BolsoCheio - Schema Completo do Banco de Dados
-- Supabase PostgreSQL + RLS (Row Level Security)
-- ============================================================

-- ============================================================
-- 1. TABELA: profiles
-- Vinculada ao auth.users via trigger automático
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  whatsapp_number text unique,
  closing_day_card integer default 25 check (closing_day_card between 1 and 31),
  due_day_card integer default 5 check (due_day_card between 1 and 31),
  is_whatsapp_verified boolean default false,
  whatsapp_verification_code text,
  whatsapp_verification_expires_at timestamptz,
  envelopes jsonb default '[]'::jsonb,
  theme text default 'system' check (theme in ('light', 'dark', 'system')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

comment on table public.profiles is 'Perfil do usuário com configurações financeiras e WhatsApp';
comment on column public.profiles.whatsapp_number is 'Formato: +5511999999999 (com código do país)';
comment on column public.profiles.closing_day_card is 'Dia do mês em que a fatura do cartão fecha (1-31)';
comment on column public.profiles.envelopes is 'Array JSON de limites por categoria: [{category, limit}]';

-- Índice para busca rápida pelo número de WhatsApp (usado pelo webhook)
create index idx_profiles_whatsapp on public.profiles(whatsapp_number)
  where whatsapp_number is not null;

-- ============================================================
-- 2. TABELA: transactions (gastos/despesas)
-- ============================================================
create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null check (amount > 0),
  category text not null default 'outros'
    check (category in (
      'alimentacao','transporte','lazer','saude',
      'educacao','moradia','vestuario','assinaturas','outros'
    )),
  description text,
  date_transaction date not null default current_date,
  payment_type text not null default 'pix'
    check (payment_type in ('dinheiro','debito','credito','pix')),
  expense_type text not null default 'variavel'
    check (expense_type in ('fixo','variavel')),
  billing_month text, -- formato YYYY-MM (mês da fatura para cartão)
  is_recurring boolean default false,
  tags text[] default '{}',
  source text default 'pwa' check (source in ('pwa','whatsapp')),
  created_at timestamptz default now()
);

comment on table public.transactions is 'Transações financeiras do usuário';
comment on column public.transactions.billing_month is 'Mês de competência da fatura (YYYY-MM). Calculado automaticamente para cartão.';
comment on column public.transactions.source is 'Origem do registro: pwa (app) ou whatsapp (bot)';

-- Índices para queries frequentes
create index idx_transactions_user on public.transactions(user_id);
create index idx_transactions_date on public.transactions(user_id, date_transaction);
create index idx_transactions_billing on public.transactions(user_id, billing_month)
  where billing_month is not null;
create index idx_transactions_category on public.transactions(user_id, category);

-- ============================================================
-- 3. TABELA: whatsapp_log (auditoria de mensagens do bot)
-- ============================================================
create table public.whatsapp_log (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  message_text text,
  ai_response jsonb,
  transaction_id uuid references public.transactions(id),
  status text default 'received' check (status in ('received','processed','error','unauthorized')),
  error_message text,
  created_at timestamptz default now()
);

comment on table public.whatsapp_log is 'Log de todas as mensagens recebidas pelo bot WhatsApp';

create index idx_whatsapp_log_phone on public.whatsapp_log(phone_number);

-- ============================================================
-- 4. ROW LEVEL SECURITY (RLS)
-- Garante isolamento total entre usuários
-- ============================================================

-- Ativar RLS em todas as tabelas
alter table public.profiles enable row level security;
alter table public.transactions enable row level security;
alter table public.whatsapp_log enable row level security;

-- PROFILES: usuário só vê/edita seu próprio perfil
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

-- TRANSACTIONS: usuário só acessa suas próprias transações
create policy "transactions_select_own"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "transactions_insert_own"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "transactions_update_own"
  on public.transactions for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "transactions_delete_own"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- WHATSAPP_LOG: acesso restrito (só via service_role, sem acesso direto do usuário)
-- Nenhuma policy de select = nenhum usuário normal acessa
-- Edge Functions usam service_role key que bypassa RLS

-- ============================================================
-- 5. FUNÇÕES E TRIGGERS
-- ============================================================

-- Trigger: criar profile automaticamente ao registrar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Trigger: atualizar updated_at automaticamente
create or replace function public.handle_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_profile_updated
  before update on public.profiles
  for each row execute function public.handle_updated_at();

-- ============================================================
-- 6. FUNÇÃO: calcular mês de fatura do cartão
-- Usada tanto pelo PWA quanto pela Edge Function
-- ============================================================
create or replace function public.calculate_billing_month(
  p_transaction_date date,
  p_closing_day integer
)
returns text
language plpgsql
as $$
declare
  v_day integer;
  v_result date;
begin
  v_day := extract(day from p_transaction_date);

  if v_day > p_closing_day then
    -- Gasto após fechamento = fatura do mês seguinte
    v_result := (date_trunc('month', p_transaction_date) + interval '1 month')::date;
  else
    -- Gasto antes/no fechamento = fatura do mês atual
    v_result := date_trunc('month', p_transaction_date)::date;
  end if;

  return to_char(v_result, 'YYYY-MM');
end;
$$;

-- ============================================================
-- 7. GRANT: permitir Edge Functions (service_role) acessar tudo
-- O service_role já tem acesso total, mas explicitamos para clareza
-- ============================================================
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert on public.whatsapp_log to service_role;
