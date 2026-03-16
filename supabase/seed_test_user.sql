-- ============================================================
-- BolsoCheio - Criar conta de teste COMPLETA (sem usar o app)
-- ============================================================
-- Execute no Supabase Dashboard > SQL Editor
-- ============================================================

DO $$
DECLARE
  v_user_id uuid;
BEGIN
  -- Verifica se o usuário já existe
  SELECT id INTO v_user_id FROM auth.users WHERE email = 'teste@bolsocheio.com';

  -- Se não existe, cria
  IF v_user_id IS NULL THEN
    v_user_id := gen_random_uuid();

    -- PASSO 1: Criar usuário no auth.users
    INSERT INTO auth.users (
      id, instance_id, aud, role, email,
      encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, recovery_token
    ) VALUES (
      v_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'teste@bolsocheio.com',
      crypt('teste123456', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      '{"full_name":"Usuário Teste"}'::jsonb,
      now(), now(), '', ''
    );

    -- PASSO 2: Criar identity (necessário para o login funcionar)
    INSERT INTO auth.identities (
      id, user_id, provider_id, provider,
      identity_data, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      v_user_id,
      v_user_id::text,
      'email',
      json_build_object('sub', v_user_id::text, 'email', 'teste@bolsocheio.com')::jsonb,
      now(), now(), now()
    );

    RAISE NOTICE 'Usuário criado com ID: %', v_user_id;
  ELSE
    RAISE NOTICE 'Usuário já existe com ID: %', v_user_id;
  END IF;

  -- PASSO 3: Garantir que o profile existe (o trigger pode já ter criado)
  INSERT INTO public.profiles (id, email)
  VALUES (v_user_id, 'teste@bolsocheio.com')
  ON CONFLICT (id) DO NOTHING;

  -- PASSO 4: Atualizar profile com WhatsApp e configurações
  UPDATE public.profiles
  SET
    full_name            = 'Usuário Teste',
    whatsapp_number      = '+5511999999999',
    is_whatsapp_verified = true,
    closing_day_card     = 25,
    due_day_card         = 5,
    envelopes            = '[
      {"category": "alimentacao", "limit": 800},
      {"category": "transporte", "limit": 400},
      {"category": "lazer", "limit": 300}
    ]'::jsonb,
    theme                = 'dark'
  WHERE id = v_user_id;

  RAISE NOTICE 'Profile atualizado com sucesso!';
END $$;

-- ============================================================
-- VERIFICAÇÃO: Confira se tudo foi criado
-- ============================================================
SELECT
  p.id,
  p.email,
  p.full_name,
  p.whatsapp_number,
  p.is_whatsapp_verified,
  p.closing_day_card,
  p.due_day_card,
  p.envelopes,
  p.theme
FROM public.profiles p
JOIN auth.users u ON u.id = p.id
WHERE u.email = 'teste@bolsocheio.com';

-- ============================================================
-- RESUMO:
--   Login:     teste@bolsocheio.com
--   Senha:     teste123456
--   WhatsApp:  +5511999999999 (verificado)
--   Cartão:    Fecha dia 25, vence dia 5
--
-- POSTMAN:
--   POST https://SEU-PROJETO.supabase.co/functions/v1/whatsapp-webhook
--   { "test": true, "phone": "+5511999999999", "message": "Gastei 45 no almoço" }
--
-- APP:
--   npm run dev → teste@bolsocheio.com / teste123456
--
-- LIMPAR:
--   DELETE FROM auth.users WHERE email = 'teste@bolsocheio.com';
-- ============================================================
