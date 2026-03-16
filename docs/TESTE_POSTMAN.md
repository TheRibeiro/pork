# Testando o Webhook Telegram via Postman

## Pré-requisitos

1. Projeto Supabase criado com as migrations executadas (`001_initial_schema.sql` + `002_telegram_integration.sql`)
2. Conta criada no app (Supabase Auth)
3. API Key do Gemini ([Google AI Studio](https://aistudio.google.com/apikey))
4. Bot do Telegram criado via [@BotFather](https://t.me/BotFather)

---

## PASSO 1: Rodar a Migration do Telegram

No **Supabase Dashboard > SQL Editor**, execute o conteúdo de `supabase/migrations/002_telegram_integration.sql`.

---

## PASSO 2: Preparar o Usuário de Teste

No **Supabase Dashboard > SQL Editor**, execute:

```sql
-- Primeiro, descubra seu UUID
SELECT id, email FROM auth.users;

-- Vincule o Telegram (troque os valores)
UPDATE public.profiles
SET
  telegram_chat_id = 123456789,  -- Seu chat_id do Telegram
  is_telegram_verified = true,
  closing_day_card = 25,
  full_name = 'Seu Nome'
WHERE id = 'cole-seu-uuid-aqui';
```

> **Como descobrir seu chat_id:** Envie qualquer mensagem ao bot [@userinfobot](https://t.me/userinfobot) no Telegram. Ele responde com seu ID numérico.

Verifique:
```sql
SELECT id, full_name, telegram_chat_id, is_telegram_verified, closing_day_card
FROM public.profiles
WHERE telegram_chat_id IS NOT NULL;
```

---

## PASSO 3: Deploy da Edge Function

```bash
# Na raiz do projeto, configure as variáveis
set SUPABASE_ACCESS_TOKEN=seu-token-aqui

# Linke ao seu projeto
npx supabase link --project-ref jqofpqlskzryybtwsvxr

# Defina os secrets (env vars da Edge Function)
npx supabase secrets set GEMINI_API_KEY=sua-chave-gemini
npx supabase secrets set TELEGRAM_BOT_TOKEN=8605052034:AAHNxQgmK6U9L3azhsxBDdjm2qaiM1vD7JQ

# Deploy
npx supabase functions deploy telegram-webhook --no-verify-jwt
```

A URL da função será:
```
https://jqofpqlskzryybtwsvxr.supabase.co/functions/v1/telegram-webhook
```

---

## PASSO 4: Registrar o Webhook no Telegram

```bash
curl "https://api.telegram.org/bot8605052034:AAHNxQgmK6U9L3azhsxBDdjm2qaiM1vD7JQ/setWebhook?url=https://jqofpqlskzryybtwsvxr.supabase.co/functions/v1/telegram-webhook"
```

Resposta esperada:
```json
{"ok": true, "result": true, "description": "Webhook was set"}
```

---

## PASSO 5: Testar no Postman

### Teste 1 - Endpoint simplificado (RECOMENDADO)

Usa o modo de teste que retorna o JSON completo do que aconteceu.

| Campo   | Valor |
|---------|-------|
| Method  | `POST` |
| URL     | `https://jqofpqlskzryybtwsvxr.supabase.co/functions/v1/telegram-webhook` |
| Headers | `Content-Type: application/json` |

**Body (raw JSON):**

```json
{
  "test": true,
  "chat_id": 123456789,
  "message": "Gastei 45 reais no almoço"
}
```

**Resposta esperada (200 OK):**

```json
{
  "status": "processed",
  "user": {
    "id": "uuid-do-usuario",
    "name": "Seu Nome",
    "closing_day": 25
  },
  "ai_extraction": {
    "valor": 45,
    "titulo": "Almoço",
    "categoria": "alimentacao",
    "tipo_pagamento": "pix",
    "recorrente": false,
    "descricao": "Almoço"
  },
  "transaction": {
    "id": "uuid-da-transacao",
    "billing_month": null
  },
  "would_reply": "✅ Gasto registrado!\n📝 Almoço\n💰 R$ 45,00\n📂 alimentacao"
}
```

---

### Teste 2 - Gasto no cartão de crédito

```json
{
  "test": true,
  "chat_id": 123456789,
  "message": "Netflix 55,90 no cartão"
}
```

Espere ver `billing_month` preenchido e `tipo_pagamento: "cartao"`.

---

### Teste 3 - chat_id não cadastrado

```json
{
  "test": true,
  "chat_id": 999999999,
  "message": "Gastei 100 reais"
}
```

**Resposta esperada (401):**
```json
{
  "status": "unauthorized",
  "error": "chat_id não encontrado ou não verificado na tabela profiles"
}
```

---

### Teste 4 - Mensagem que não é gasto

```json
{
  "test": true,
  "chat_id": 123456789,
  "message": "Bom dia, tudo bem?"
}
```

**Resposta esperada (200):**
```json
{
  "status": "ai_error",
  "error": "Não entendi como um gasto. Tente algo como: Gastei 50 reais no almoço"
}
```

---

### Teste 5 - Simular payload real do Telegram

Para testar o formato exato que o Telegram envia:

```json
{
  "update_id": 123456789,
  "message": {
    "message_id": 1,
    "from": {
      "id": 123456789,
      "is_bot": false,
      "first_name": "Teste",
      "username": "testuser"
    },
    "chat": {
      "id": 123456789,
      "type": "private"
    },
    "date": 1710000000,
    "text": "Uber 23 reais"
  }
}
```

Essa simulação roda o fluxo completo e envia a resposta de volta pelo Telegram.

---

## PASSO 6: Verificar no Banco

Após os testes, confira no Supabase Dashboard > Table Editor:

```sql
-- Transações criadas via Telegram
SELECT * FROM public.transactions
WHERE source = 'telegram'
ORDER BY created_at DESC;

-- Logs do webhook
SELECT * FROM public.telegram_log
ORDER BY created_at DESC;
```

---

## PASSO 7: Ver no PWA em tempo real

Se você tiver o app aberto (`npm run dev`) e logado com a mesma conta:
- Os gastos registrados via Postman/Telegram devem aparecer **instantaneamente** no Dashboard
- Isso acontece graças ao **Supabase Realtime** (canal `transactions-realtime` no AppContext)

---

## Mensagens de exemplo para testar

| Mensagem | Categoria esperada | Pagamento |
|----------|-------------------|-----------|
| `Gastei 45 no almoço` | alimentacao | pix |
| `Uber 23 reais` | transporte | pix |
| `Netflix 55,90 cartão` | assinaturas | cartao |
| `Comprei remédio 89,90 no débito` | saude | debito |
| `Paguei aluguel 1500` | moradia | pix |
| `Cinema 32 reais dinheiro` | lazer | dinheiro |
| `Mensalidade academia 120 cartão` | saude | cartao |
| `Comprei camiseta 79,90` | vestuario | pix |

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `401 unauthorized` | Verifique se o `chat_id` no Postman bate com `telegram_chat_id` na tabela `profiles` E se `is_telegram_verified = true` |
| `500 Internal Server Error` | Verifique se `GEMINI_API_KEY` está nos secrets: `npx supabase secrets list` |
| Transação não aparece no PWA | Verifique se está logado com a MESMA conta que recebeu a transação |
| `Gemini API error: 400` | A chave Gemini pode ter expirado ou estar inválida |
| Bot não responde no Telegram | Verifique se o webhook está registrado: `curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo` |
