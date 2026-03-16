// ============================================================
// BolsoCheio - Edge Function: WhatsApp Webhook
// O "Cérebro" que integra WhatsApp + Gemini AI + Supabase
// ============================================================
// Deploy: supabase functions deploy whatsapp-webhook --no-verify-jwt
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

// --- Tipos ---
interface GeminiExpenseResult {
  valor: number
  titulo: string
  categoria: string
  tipo_pagamento: 'pix' | 'cartao' | 'dinheiro' | 'debito'
  recorrente: boolean
  descricao?: string
}

interface WhatsAppMessage {
  from: string
  id: string
  timestamp: string
  text: { body: string }
  type: string
}

// --- Constantes ---
const VALID_CATEGORIES = [
  'alimentacao', 'transporte', 'lazer', 'saude',
  'educacao', 'moradia', 'vestuario', 'assinaturas', 'outros',
]

const GEMINI_SYSTEM_PROMPT = `Você é um extrator de dados financeiros brasileiro.
Sua função é converter frases do usuário em JSON estruturado.

REGRAS:
1. Extraia o valor numérico mencionado (sempre em Reais brasileiros)
2. Crie um título curto e descritivo
3. Classifique em UMA destas categorias: alimentacao, transporte, lazer, saude, educacao, moradia, vestuario, assinaturas, outros
4. Identifique o tipo de pagamento: pix, cartao, dinheiro, debito. Se não mencionado, assuma "pix"
5. Identifique se é gasto recorrente (assinatura, mensalidade): true/false
6. Adicione uma descrição breve se houver contexto extra

RESPONDA APENAS com JSON válido, sem markdown, sem explicação:
{"valor": 0, "titulo": "", "categoria": "", "tipo_pagamento": "", "recorrente": false, "descricao": ""}

Se a mensagem NÃO for sobre um gasto financeiro, responda:
{"erro": "Não entendi como um gasto. Tente algo como: Gastei 50 reais no almoço"}
`

// --- Supabase Client (service_role bypassa RLS) ---
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// --- PASSO A: Validar remetente no banco ---
async function validateSender(phoneNumber: string) {
  const supabase = getSupabaseAdmin()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, closing_day_card, is_whatsapp_verified, full_name')
    .eq('whatsapp_number', phoneNumber)
    .eq('is_whatsapp_verified', true)
    .single()

  if (error || !profile) {
    return { valid: false, profile: null }
  }

  return { valid: true, profile }
}

// --- PASSO B: Chamar Gemini AI para extrair dados ---
async function callGeminiAI(userMessage: string): Promise<GeminiExpenseResult | { erro: string }> {
  const apiKey = Deno.env.get('GEMINI_API_KEY')
  if (!apiKey) throw new Error('GEMINI_API_KEY não configurada')

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: GEMINI_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: userMessage }] }],
        generationConfig: {
          temperature: 0.1,
          responseMimeType: 'application/json',
        },
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text

  if (!text) throw new Error('Resposta vazia da Gemini')

  return JSON.parse(text)
}

// --- PASSO C: Calcular mês de fatura ---
function calculateBillingMonth(transactionDate: Date, closingDay: number): string {
  const day = transactionDate.getDate()
  const year = transactionDate.getFullYear()
  const month = transactionDate.getMonth()

  if (day > closingDay) {
    // Gasto após fechamento → fatura do mês seguinte
    const nextMonth = new Date(year, month + 1, 1)
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
  }

  // Fatura do mês atual
  return `${year}-${String(month + 1).padStart(2, '0')}`
}

// --- PASSO D: Salvar transação no Supabase ---
async function saveTransaction(
  userId: string,
  expense: GeminiExpenseResult,
  closingDay: number
) {
  const supabase = getSupabaseAdmin()
  const now = new Date()

  // Validar e normalizar categoria
  const category = VALID_CATEGORIES.includes(expense.categoria)
    ? expense.categoria
    : 'outros'

  // Mapear tipo de pagamento
  const paymentMap: Record<string, string> = {
    cartao: 'credito',
    pix: 'pix',
    dinheiro: 'dinheiro',
    debito: 'debito',
  }
  const paymentType = paymentMap[expense.tipo_pagamento] || 'pix'

  // Calcular billing month se for cartão
  const billingMonth = paymentType === 'credito'
    ? calculateBillingMonth(now, closingDay)
    : null

  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      title: expense.titulo,
      amount: expense.valor,
      category,
      description: expense.descricao || null,
      date_transaction: now.toISOString().split('T')[0],
      payment_type: paymentType,
      expense_type: expense.recorrente ? 'fixo' : 'variavel',
      billing_month: billingMonth,
      is_recurring: expense.recorrente,
      source: 'whatsapp',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

// --- Log no banco ---
async function logWhatsApp(
  phoneNumber: string,
  messageText: string | null,
  aiResponse: Record<string, unknown> | null,
  transactionId: string | null,
  status: string,
  errorMessage: string | null = null
) {
  const supabase = getSupabaseAdmin()
  await supabase.from('whatsapp_log').insert({
    phone_number: phoneNumber,
    message_text: messageText,
    ai_response: aiResponse,
    transaction_id: transactionId,
    status,
    error_message: errorMessage,
  })
}

// --- Enviar mensagem de resposta via WhatsApp API ---
async function sendWhatsAppMessage(to: string, message: string) {
  const token = Deno.env.get('WHATSAPP_ACCESS_TOKEN')
  const phoneId = Deno.env.get('WHATSAPP_PHONE_NUMBER_ID')

  if (!token || !phoneId) {
    console.log('[MODO TESTE] Resposta que seria enviada para', to, ':\n', message)
    return
  }

  await fetch(
    `https://graph.facebook.com/v21.0/${phoneId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    }
  )
}

// --- Endpoint simplificado para testes via Postman ---
async function handleTestEndpoint(body: { phone: string; message: string }) {
  const normalizedPhone = body.phone.startsWith('+') ? body.phone : `+${body.phone}`

  // PASSO A: Validar remetente
  const { valid, profile } = await validateSender(normalizedPhone)
  if (!valid || !profile) {
    return Response.json({
      status: 'unauthorized',
      error: 'Número não encontrado ou não verificado na tabela profiles',
      phone: normalizedPhone,
    }, { status: 401 })
  }

  // PASSO B: Chamar IA
  const aiResult = await callGeminiAI(body.message)

  if ('erro' in aiResult) {
    return Response.json({
      status: 'ai_error',
      error: aiResult.erro,
      phone: normalizedPhone,
      user: profile.full_name,
    }, { status: 200 })
  }

  // PASSO C + D: Salvar transação
  const transaction = await saveTransaction(
    profile.id,
    aiResult,
    profile.closing_day_card
  )

  await logWhatsApp(
    normalizedPhone,
    body.message,
    aiResult as unknown as Record<string, unknown>,
    transaction.id,
    'processed'
  )

  // Retorna tudo para o Postman ver
  return Response.json({
    status: 'processed',
    user: {
      id: profile.id,
      name: profile.full_name,
      closing_day: profile.closing_day_card,
    },
    ai_extraction: aiResult,
    transaction: {
      id: transaction.id,
      billing_month: aiResult.tipo_pagamento === 'cartao'
        ? calculateBillingMonth(new Date(), profile.closing_day_card)
        : null,
    },
    would_reply: `✅ Gasto registrado!\n📝 ${aiResult.titulo}\n💰 ${formatBRL(aiResult.valor)}\n📂 ${aiResult.categoria}`,
  }, { status: 200 })
}

// --- Formatar valor em Reais ---
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
Deno.serve(async (req: Request) => {
  const url = new URL(req.url)

  // --- GET: Verificação do Webhook (Meta Challenge) ---
  if (req.method === 'GET') {
    const mode = url.searchParams.get('hub.mode')
    const token = url.searchParams.get('hub.verify_token')
    const challenge = url.searchParams.get('hub.challenge')
    const verifyToken = Deno.env.get('WHATSAPP_VERIFY_TOKEN')

    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Webhook verified successfully')
      return new Response(challenge, { status: 200 })
    }

    return new Response('Forbidden', { status: 403 })
  }

  // --- POST: Recebimento de mensagens ---
  if (req.method === 'POST') {
    try {
      const body = await req.json()

      // ── MODO TESTE (Postman): POST com { "test": true, "phone": "...", "message": "..." }
      if (body.test === true) {
        console.log('[MODO TESTE] Simulação recebida:', body)
        return await handleTestEndpoint(body)
      }

      // Extrair mensagem do payload da Meta
      const entry = body?.entry?.[0]
      const changes = entry?.changes?.[0]
      const value = changes?.value
      const messages: WhatsAppMessage[] = value?.messages

      if (!messages || messages.length === 0) {
        // Pode ser status update, delivery receipt, etc.
        return new Response('OK', { status: 200 })
      }

      const message = messages[0]

      // Só processa mensagens de texto
      if (message.type !== 'text') {
        return new Response('OK', { status: 200 })
      }

      const phoneNumber = message.from // formato: 5511999999999
      const normalizedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`
      const messageText = message.text.body

      console.log(`Message from ${normalizedPhone}: ${messageText}`)

      // --- PASSO A: Validar remetente ---
      const { valid, profile } = await validateSender(normalizedPhone)

      if (!valid || !profile) {
        await logWhatsApp(normalizedPhone, messageText, null, null, 'unauthorized')
        await sendWhatsAppMessage(
          phoneNumber,
          '❌ Número não cadastrado no BolsoCheio.\n\n' +
          'Para usar o bot, cadastre-se no app e vincule seu WhatsApp:\n' +
          '👉 Configurações > WhatsApp Bot'
        )
        return new Response('OK', { status: 200 })
      }

      // --- PASSO B: Chamar IA ---
      const aiResult = await callGeminiAI(messageText)

      // Verificar se a IA retornou erro
      if ('erro' in aiResult) {
        await logWhatsApp(normalizedPhone, messageText, aiResult as Record<string, unknown>, null, 'error', aiResult.erro)
        await sendWhatsAppMessage(
          phoneNumber,
          `🤔 ${aiResult.erro}\n\nExemplos:\n• "Gastei 45 no almoço"\n• "Uber 23 reais"\n• "Netflix 55,90 cartão"`
        )
        return new Response('OK', { status: 200 })
      }

      // --- PASSO C + D: Calcular fatura e salvar ---
      const transaction = await saveTransaction(
        profile.id,
        aiResult,
        profile.closing_day_card
      )

      await logWhatsApp(
        normalizedPhone,
        messageText,
        aiResult as unknown as Record<string, unknown>,
        transaction.id,
        'processed'
      )

      // --- Resposta de confirmação ---
      const paymentLabel = aiResult.tipo_pagamento === 'cartao' ? '💳 Cartão' :
                          aiResult.tipo_pagamento === 'pix' ? '📱 PIX' :
                          aiResult.tipo_pagamento === 'dinheiro' ? '💵 Dinheiro' : '🏦 Débito'

      const billingInfo = aiResult.tipo_pagamento === 'cartao'
        ? `\n📅 Fatura: ${calculateBillingMonth(new Date(), profile.closing_day_card)}`
        : ''

      await sendWhatsAppMessage(
        phoneNumber,
        `✅ Gasto registrado, ${profile.full_name?.split(' ')[0] || 'amigo'}!\n\n` +
        `📝 ${aiResult.titulo}\n` +
        `💰 ${formatBRL(aiResult.valor)}\n` +
        `📂 ${aiResult.categoria}\n` +
        `${paymentLabel}${billingInfo}\n` +
        `${aiResult.recorrente ? '🔄 Recorrente' : ''}`
      )

      return new Response('OK', { status: 200 })
    } catch (error) {
      console.error('Webhook error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      return Response.json({
        status: 'error',
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      }, { status: 500 })
    }
  }

  return new Response('Method Not Allowed', { status: 405 })
})
