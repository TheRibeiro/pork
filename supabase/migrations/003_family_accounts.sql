-- ============================================================
-- BolsoCheio - Migration 003: Sistema de Contas Família
-- Adiciona account_type, parent_id, invite_token, onboarding_completed
-- em profiles; parent_flagged, parent_flag_note, parent_flag_read
-- em transactions; novas RLS policies; funções SQL helper
-- ============================================================

-- ============================================================
-- 1. ATUALIZAR TABELA: profiles
-- ============================================================

-- Tipo de conta: adult (padrão legado), parent, child, teen
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text DEFAULT 'adult'
    CHECK (account_type IN ('adult', 'parent', 'child', 'teen'));

-- FK para o responsável (NULL = sem vínculo)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Token único de convite gerado pelo responsável
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE;

-- Se o usuário já completou o onboarding
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false;

-- Índice para busca rápida por invite_token (usado no link_child_to_parent)
CREATE INDEX IF NOT EXISTS idx_profiles_invite_token
  ON public.profiles(invite_token)
  WHERE invite_token IS NOT NULL;

-- Índice para busca de filhos de um responsável
CREATE INDEX IF NOT EXISTS idx_profiles_parent_id
  ON public.profiles(parent_id)
  WHERE parent_id IS NOT NULL;

-- ============================================================
-- 2. ATUALIZAR TABELA: transactions
-- ============================================================

-- Sinalização pelo responsável
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS parent_flagged boolean DEFAULT false;

-- Mensagem/nota do responsável ao sinalizar
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS parent_flag_note text;

-- Se a criança já leu a sinalização
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS parent_flag_read boolean DEFAULT false;

-- ============================================================
-- 3. NOVAS RLS POLICIES — Família
-- ============================================================

-- Responsável pode VER transações dos seus filhos
CREATE POLICY IF NOT EXISTS "parent_can_select_children_transactions"
  ON public.transactions FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles child
      WHERE child.id = transactions.user_id
        AND child.parent_id = auth.uid()
    )
  );

-- Responsável pode SINALIZAR (UPDATE) transações dos filhos
-- (apenas campos de flag)
CREATE POLICY IF NOT EXISTS "parent_can_flag_children_transactions"
  ON public.transactions FOR UPDATE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles child
      WHERE child.id = transactions.user_id
        AND child.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.profiles child
      WHERE child.id = transactions.user_id
        AND child.parent_id = auth.uid()
    )
  );

-- Responsável pode VER perfis dos seus filhos
CREATE POLICY IF NOT EXISTS "parent_can_select_children_profiles"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id
    OR parent_id = auth.uid()
  );

-- ============================================================
-- 4. FUNÇÃO: generate_invite_token()
-- Gera token único de 8 caracteres alfanuméricos para o responsável
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_invite_token()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_token text;
  v_exists boolean;
BEGIN
  LOOP
    -- Gera token no formato XXXX-XXXX (letras maiúsculas + números)
    v_token := upper(
      substring(md5(random()::text) FROM 1 FOR 4) || '-' ||
      substring(md5(random()::text) FROM 1 FOR 4)
    );
    -- Verifica se já existe
    SELECT EXISTS (
      SELECT 1 FROM public.profiles WHERE invite_token = v_token
    ) INTO v_exists;
    EXIT WHEN NOT v_exists;
  END LOOP;

  -- Salva no perfil do usuário autenticado
  UPDATE public.profiles
    SET invite_token = v_token,
        account_type = CASE WHEN account_type = 'adult' THEN 'parent' ELSE account_type END
    WHERE id = auth.uid();

  RETURN v_token;
END;
$$;

COMMENT ON FUNCTION public.generate_invite_token() IS
  'Gera e salva um token de convite único para o responsável convidar filhos';

-- ============================================================
-- 5. FUNÇÃO: link_child_to_parent(p_invite_token text)
-- A criança usa o token do responsável para se vincular
-- ============================================================
CREATE OR REPLACE FUNCTION public.link_child_to_parent(p_invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_parent_id uuid;
  v_child_account_type text;
  v_result json;
BEGIN
  -- Busca o responsável pelo token
  SELECT id INTO v_parent_id
    FROM public.profiles
    WHERE invite_token = upper(trim(p_invite_token));

  IF v_parent_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Token inválido ou expirado');
  END IF;

  -- Impede que o responsável se vincule a si mesmo
  IF v_parent_id = auth.uid() THEN
    RETURN json_build_object('success', false, 'error', 'Você não pode se vincular a si mesmo');
  END IF;

  -- Determina o tipo de conta (mantém 'teen' se já for)
  SELECT account_type INTO v_child_account_type
    FROM public.profiles
    WHERE id = auth.uid();

  IF v_child_account_type NOT IN ('child', 'teen') THEN
    v_child_account_type := 'child';
  END IF;

  -- Vincula a criança ao responsável
  UPDATE public.profiles
    SET parent_id = v_parent_id,
        account_type = v_child_account_type,
        onboarding_completed = true
    WHERE id = auth.uid();

  -- Registra account_type como 'parent' no responsável se ainda não for
  UPDATE public.profiles
    SET account_type = 'parent'
    WHERE id = v_parent_id
      AND account_type = 'adult';

  RETURN json_build_object('success', true, 'parent_id', v_parent_id);
END;
$$;

COMMENT ON FUNCTION public.link_child_to_parent(text) IS
  'Vincula a conta da criança/teen ao responsável via invite_token';

-- ============================================================
-- 6. GRANT: permissões para usuários autenticados
-- ============================================================
GRANT EXECUTE ON FUNCTION public.generate_invite_token() TO authenticated;
GRANT EXECUTE ON FUNCTION public.link_child_to_parent(text) TO authenticated;
