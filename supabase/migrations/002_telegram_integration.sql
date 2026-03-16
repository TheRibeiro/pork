-- ============================================================
-- BolsoCheio - Migration: Integração com Telegram Bot
-- Adiciona suporte ao Telegram no schema existente
-- ============================================================

-- 1. Adicionar colunas do Telegram na tabela profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id bigint UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_telegram_verified boolean DEFAULT false;

-- Índice para busca rápida pelo chat_id (usado pelo webhook)
CREATE INDEX IF NOT EXISTS idx_profiles_telegram ON public.profiles(telegram_chat_id)
  WHERE telegram_chat_id IS NOT NULL;

-- 2. Atualizar check do source nas transactions para incluir 'telegram'
ALTER TABLE public.transactions DROP CONSTRAINT IF EXISTS transactions_source_check;
ALTER TABLE public.transactions ADD CONSTRAINT transactions_source_check
  CHECK (source IN ('pwa', 'whatsapp', 'telegram'));

-- 3. Tabela de log do Telegram (auditoria de mensagens do bot)
CREATE TABLE IF NOT EXISTS public.telegram_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id bigint NOT NULL,
  message_text text,
  ai_response jsonb,
  transaction_id uuid REFERENCES public.transactions(id),
  status text DEFAULT 'received' CHECK (status IN ('received','processed','error','unauthorized','pending_card_type')),
  error_message text,
  created_at timestamptz DEFAULT now()
);

COMMENT ON TABLE public.telegram_log IS 'Log de todas as mensagens recebidas pelo bot Telegram';

CREATE INDEX IF NOT EXISTS idx_telegram_log_chat ON public.telegram_log(chat_id);

-- 4. RLS para telegram_log (mesmo padrão do whatsapp_log: só service_role acessa)
ALTER TABLE public.telegram_log ENABLE ROW LEVEL SECURITY;

-- 5. GRANT para service_role acessar telegram_log
GRANT SELECT, INSERT, UPDATE ON public.telegram_log TO service_role;
