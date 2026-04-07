// ============================================================
// BolsoCheio - Edge Function: Telegram Bot Webhook
// Integra Telegram Bot + Gemini AI + Supabase
// ============================================================
// Deploy: supabase functions deploy telegram-webhook --no-verify-jwt
// ============================================================

import { createClient } from 'npm:@supabase/supabase-js@2'

// --- Tipos ---
interface GeminiExpenseResult {
  valor: number
  titulo: string
  categoria: string
  tipo_pagamento: 'pix' | 'cartao' | 'debito' | 'dinheiro'
  recorrente: boolean
  confirmacao_msg: string
  pergunta?: string
}

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    from: {
      id: number
      is_bot: boolean
      first_name: string
      username?: string
    }
    chat: {
      id: number
      type: string
    }
    date: number
    text?: string
  }
}

// --- Constantes ---
const VALID_CATEGORIES = [
  'alimentacao', 'transporte', 'lazer', 'saude',
  'educacao', 'moradia', 'vestuario', 'assinaturas', 'outros',
]

const GEMINI_SYSTEM_PROMPT = `Você é um analista financeiro de elite e extrator de dados JSON. Sua tarefa é processar mensagens de gastos enviadas por brasileiros via Telegram e converter em dados estruturados.

### REGRAS DE CATEGORIZAÇÃO (ABRANGENTE):
1. ALIMENTAÇÃO (alimentacao): Restaurantes, iFood/Delivery, Mercado, Supermercado, Padaria, Cafés, Bares que servem comida, Churrasco, Açaí, Lanche, Fast Food, Feira.
2. TRANSPORTE (transporte): Uber, 99, Gasolina, Posto de Combustível, Estacionamento, Pedágio, Manutenção de Carro, Ônibus/Metrô, IPVA, Seguro do Carro, Multa de Trânsito, Licenciamento, Lavagem de Carro, Pneu, Óleo.
3. LAZER (lazer): Ingressos de Festas/Shows, Cinema, Baladas, Viagens (Hospedagem/Passagens), Hobbies, Eventos Sociais, Bebidas em Balada, Jogos, Parques, Teatro, Streaming de Jogos, Apostas.
4. SAÚDE (saude): Farmácia, Médicos, Exames, Dentista, Psicólogo, Suplementos, Plano de Saúde, Fisioterapia, Óculos/Lentes, Vacinas, Cirurgias, Hospital.
5. EDUCAÇÃO (educacao): Cursos, Livros, Mensalidade Escolar/Faculdade, Workshops, Kindle, Material Escolar, Apostilas, Certificações, Idiomas, TCC, Formatura.
6. MORADIA (moradia): Aluguel, Condomínio, Contas de Luz/Água/Gás/Internet, IPTU, Reformas, Decoração, Faxina/Diarista, Móveis, Eletrodomésticos, Seguro Residencial, Mudança, Dedetização, Manutenção Casa.
7. VESTUÁRIO (vestuario): Roupas, Tênis/Sapatos, Acessórios, Barbeiro, Salão de Beleza, Perfumaria, Maquiagem, Relógio, Óculos de Sol, Bolsas, Joias/Bijuterias.
8. ASSINATURAS (assinaturas): Netflix, Spotify, iCloud, GamePass, YouTube Premium, Academia, Plano de Celular, Amazon Prime, Disney+, HBO, Globoplay, ChatGPT Plus, Dropbox, Adobe.
9. OUTROS (outros): Presentes, Doações, Tarifas Bancárias, Correios, Cartório, Documentos, Pet (Ração/Veterinário), Impostos não categorizados, Empréstimos, Coisas que não se encaixam nas categorias acima.

### LÓGICA DE PAGAMENTO:
- Se mencionar "crédito", "fatura", "parcelado" -> "cartao"
- Se mencionar "débito", "conta corrente" -> "debito"
- Se mencionar APENAS "cartão" SEM especificar crédito ou débito -> responda com pergunta (ver abaixo)
- Se mencionar "pix", "transferência", "ted" -> "pix"
- Se mencionar "dinheiro", "espécie", "nota", "cédula" -> "dinheiro"
- Se NÃO mencionar nenhuma forma de pagamento -> a verificação é feita externamente, NUNCA assuma nenhum valor

### REGRA ESPECIAL - "CARTÃO" AMBÍGUO:
Se o usuário disser apenas "cartão" sem especificar crédito ou débito, retorne:
{"pergunta": "💳 Foi no cartão de crédito ou débito?"}
NÃO registre o gasto neste caso. Aguarde a resposta.

### FORMATO DE SAÍDA (OBRIGATÓRIO):
Retorne APENAS o objeto JSON abaixo, sem textos explicativos:
{"valor": 0, "titulo": "", "categoria": "", "tipo_pagamento": "pix", "recorrente": false, "confirmacao_msg": ""}

### EXEMPLOS PARA APRENDIZADO:
- "Paguei 35 de Uber no crédito": {"valor": 35, "titulo": "Uber", "categoria": "transporte", "tipo_pagamento": "cartao", "recorrente": false, "confirmacao_msg": "✅ R$ 35,00 em Transporte (Crédito). Boa viagem! 🚗"}
- "Cortei o cabelo 50 pila no pix": {"valor": 50, "titulo": "Barbeiro", "categoria": "vestuario", "tipo_pagamento": "pix", "recorrente": false, "confirmacao_msg": "✅ R$ 50,00 em Vestuário/Beleza. Ficou na régua! 💈"}
- "IPVA 1800 no débito": {"valor": 1800, "titulo": "IPVA", "categoria": "transporte", "tipo_pagamento": "debito", "recorrente": false, "confirmacao_msg": "✅ R$ 1.800,00 em Transporte (IPVA). Tá em dia! 🚗"}
- "IPTU 450 reais no pix": {"valor": 450, "titulo": "IPTU", "categoria": "moradia", "tipo_pagamento": "pix", "recorrente": false, "confirmacao_msg": "✅ R$ 450,00 em Moradia (IPTU). Casa em ordem! 🏠"}
- "Mensalidade faculdade 1200 no cartão": {"pergunta": "💳 Faculdade R$ 1.200,00 - foi no cartão de crédito ou débito?"}
- "Paguei 50 no mercado no débito": {"valor": 50, "titulo": "Mercado", "categoria": "alimentacao", "tipo_pagamento": "debito", "recorrente": false, "confirmacao_msg": "✅ R$ 50,00 em Alimentação (Débito). Geladeira cheia! 🛒"}
- "Ração do cachorro 120 dinheiro": {"valor": 120, "titulo": "Ração Pet", "categoria": "outros", "tipo_pagamento": "dinheiro", "recorrente": false, "confirmacao_msg": "✅ R$ 120,00 em Outros (Pet). Au au! 🐕"}

Se a mensagem NÃO for sobre um gasto financeiro, responda:
{"erro": "Não entendi como um gasto. Tente algo como: Gastei 50 reais no almoço"}

IMPORTANTE: Se o tipo_pagamento for "cartao" ou "debito", SEMPRE use o valor que foi determinado. Não tente questionar - a verificação de ambiguidade é feita externamente.
`

// --- Detectar "cartão" ambíguo na mensagem (verificação no código, não na IA) ---
function hasAmbiguousCard(text: string): boolean {
  const lower = text.toLowerCase()
  const hasCartao = /cart[aã]o/.test(lower)
  if (!hasCartao) return false

  // Se já especificou crédito ou débito, não é ambíguo
  const hasCreditKeyword = /cr[eé]dito|fatura|parcelado|parcela/.test(lower)
  const hasDebitKeyword = /d[eé]bito|conta\s*corrente/.test(lower)

  return !hasCreditKeyword && !hasDebitKeyword
}

// --- Detectar ausência total de forma de pagamento ---
function hasNoPaymentMethod(text: string): boolean {
  const lower = text.toLowerCase()
  const paymentKeywords = [
    /pix/,
    /transfer[eê]ncia/,
    /\bted\b/,
    /cr[eé]dito/,
    /d[eé]bito/,
    /cart[aã]o/,
    /dinheiro/,
    /esp[eé]cie/,
    /\bnota\b/,
    /c[eé]dula/,
    /fatura/,
    /parcelado/,
    /parcela/,
    /conta\s*corrente/,
  ]
  return !paymentKeywords.some((re) => re.test(lower))
}

// --- Detectar se mensagem é uma resposta de forma de pagamento ---
function detectPaymentMethod(text: string): string | null {
  const lower = text.toLowerCase().trim()
  if (/\bpix\b|transfer[eê]ncia|ted/.test(lower)) return 'no pix'
  if (/cr[eé]dito|fatura/.test(lower)) return 'no crédito'
  if (/d[eé]bito/.test(lower)) return 'no débito'
  if (/dinheiro|esp[eé]cie/.test(lower)) return 'em dinheiro'
  return null
}

// --- Supabase Client (service_role bypassa RLS) ---
function getSupabaseAdmin() {
  return createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )
}

// --- Enviar mensagem via Telegram Bot API ---
async function sendTelegramMessage(chatId: number, text: string) {
  const token = Deno.env.get('TELEGRAM_BOT_TOKEN')
  if (!token) {
    console.log('[MODO TESTE] Resposta que seria enviada para chat', chatId, ':\n', text)
    return
  }

  await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      parse_mode: 'HTML',
    }),
  })
}

// --- Validar remetente pelo chat_id ---
async function validateSender(chatId: number) {
  const supabase = getSupabaseAdmin()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, closing_day_card, is_telegram_verified, full_name')
    .eq('telegram_chat_id', chatId)
    .eq('is_telegram_verified', true)
    .single()

  if (error || !profile) {
    return { valid: false, profile: null }
  }

  return { valid: true, profile }
}

// --- Vincular conta via /start <code> ---
async function handleStartCommand(chatId: number, code: string, fromName: string) {
  const supabase = getSupabaseAdmin()

  // Busca profile que tem esse código de verificação
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('id, full_name, whatsapp_verification_code, whatsapp_verification_expires_at')
    .eq('whatsapp_verification_code', code)
    .single()

  if (error || !profile) {
    await sendTelegramMessage(chatId,
      '❌ Código inválido ou expirado.\n\n' +
      'Para vincular sua conta:\n' +
      '1. Abra o app BolsoCheio\n' +
      '2. Vá em Configurações > Telegram Bot\n' +
      '3. Clique em "Conectar Telegram"\n' +
      '4. Use o link gerado para abrir o bot'
    )
    return
  }

  // Verifica expiração
  if (profile.whatsapp_verification_expires_at &&
      new Date(profile.whatsapp_verification_expires_at) < new Date()) {
    await sendTelegramMessage(chatId,
      '⏰ Código expirado! Gere um novo no app BolsoCheio.'
    )
    return
  }

  // Vincula o chat_id ao profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      telegram_chat_id: chatId,
      is_telegram_verified: true,
      whatsapp_verification_code: null,
      whatsapp_verification_expires_at: null,
    })
    .eq('id', profile.id)

  if (updateError) {
    console.error('Erro ao vincular Telegram:', updateError)
    await sendTelegramMessage(chatId, '❌ Erro ao vincular conta. Tente novamente.')
    return
  }

  const name = profile.full_name?.split(' ')[0] || fromName
  await sendTelegramMessage(chatId,
    `✅ Telegram vinculado com sucesso, ${name}!\n\n` +
    'Agora você pode registrar gastos enviando mensagens como:\n\n' +
    '• "Gastei 45 no almoço"\n' +
    '• "Uber 23 reais"\n' +
    '• "Netflix 55,90 cartão"\n\n' +
    'Eu uso IA para entender e categorizar automaticamente! 🤖'
  )
}

// --- Chamar Gemini AI para extrair dados ---
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

// --- Calcular mês de fatura ---
function calculateBillingMonth(transactionDate: Date, closingDay: number): string {
  const day = transactionDate.getDate()
  const year = transactionDate.getFullYear()
  const month = transactionDate.getMonth()

  if (day > closingDay) {
    const nextMonth = new Date(year, month + 1, 1)
    return `${nextMonth.getFullYear()}-${String(nextMonth.getMonth() + 1).padStart(2, '0')}`
  }

  return `${year}-${String(month + 1).padStart(2, '0')}`
}

// --- Salvar transação no Supabase ---
async function saveTransaction(
  userId: string,
  expense: GeminiExpenseResult,
  closingDay: number
) {
  const supabase = getSupabaseAdmin()
  const now = new Date()

  const category = VALID_CATEGORIES.includes(expense.categoria)
    ? expense.categoria
    : 'outros'

  const paymentMap: Record<string, string> = {
    cartao: 'credito',
    pix: 'pix',
    dinheiro: 'dinheiro',
    debito: 'debito',
  }
  const paymentType = paymentMap[expense.tipo_pagamento] || 'pix'

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
      description: null,
      date_transaction: now.toISOString().split('T')[0],
      payment_type: paymentType,
      expense_type: expense.recorrente ? 'fixo' : 'variavel',
      billing_month: billingMonth,
      is_recurring: expense.recorrente,
      source: 'telegram',
    })
    .select('id')
    .single()

  if (error) throw error
  return data
}

// --- Log no banco ---
async function logTelegram(
  chatId: number,
  messageText: string | null,
  aiResponse: Record<string, unknown> | null,
  transactionId: string | null,
  status: string,
  errorMessage: string | null = null
) {
  const supabase = getSupabaseAdmin()
  await supabase.from('telegram_log').insert({
    chat_id: chatId,
    message_text: messageText,
    ai_response: aiResponse,
    transaction_id: transactionId,
    status,
    error_message: errorMessage,
  })
}

// --- Formatar valor em Reais ---
function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

// --- Detectar comando de relatório semanal ---
function isRelatorioCommand(text: string): boolean {
  return /relat[oó]rio/i.test(text) || /\/(relatorio|report)/i.test(text)
}

// --- Gerar e enviar relatório semanal para um usuário ---
async function handleRelatorioSemanal(chatId: number, profileId: string, fullName: string) {
  const supabase = getSupabaseAdmin()

  const { data: userProfile } = await supabase
    .from('profiles')
    .select('envelopes')
    .eq('id', profileId)
    .single()

  const d = new Date()
  d.setDate(d.getDate() - 7)
  const dateFrom = d.toISOString().split('T')[0]

  const { data: transactions } = await supabase
    .from('transactions')
    .select('category,amount,title,date_transaction,payment_type')
    .eq('user_id', profileId)
    .gte('date_transaction', dateFrom)
    .order('date_transaction', { ascending: false })

  if (!transactions || transactions.length === 0) {
    await sendTelegramMessage(chatId,
      '📊 <b>Relatório Semanal — BolsoCheio</b>\n\n' +
      '📭 Nenhuma transação nos últimos 7 dias.\n\n' +
      'Registre gastos como:\n• "Gastei 45 no almoço no pix"'
    )
    return
  }

  const envelopes = Array.isArray(userProfile?.envelopes) ? userProfile.envelopes : []
  const NOMES: Record<string, string> = {
    alimentacao: 'Alimentação', transporte: 'Transporte', lazer: 'Lazer',
    saude: 'Saúde', educacao: 'Educação', moradia: 'Moradia',
    vestuario: 'Vestuário', assinaturas: 'Assinaturas', outros: 'Outros',
  }
  const fmt = (v: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v)

  const totalPorCat: Record<string, number> = {}
  let totalGeral = 0
  for (const t of transactions) {
    totalPorCat[t.category] = (totalPorCat[t.category] || 0) + parseFloat(t.amount)
    totalGeral += parseFloat(t.amount)
  }

  const nome = fullName?.split(' ')[0] || 'você'
  const hoje = new Date()
  const semAnt = new Date(hoje)
  semAnt.setDate(semAnt.getDate() - 7)
  const fmtData = (dt: Date) => dt.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  const linhas = [
    `📊 <b>Relatório Semanal — BolsoCheio</b>`,
    `👤 ${nome} | ${fmtData(semAnt)} – ${fmtData(hoje)}`,
    ``,
    `💰 <b>Total gasto: ${fmt(totalGeral)}</b>`,
    `📦 ${transactions.length} transação(ões)`,
    ``,
    `<b>Por categoria:</b>`,
  ]

  const catOrdenadas = Object.entries(totalPorCat).sort(([, a], [, b]) => b - a)
  for (const [cat, total] of catOrdenadas) {
    const env = envelopes.find((e: { category: string; limit?: number; limite?: number }) => e.category === cat)
    const limite = env ? parseFloat(String(env.limit || env.limite || 0)) : 0
    const nomeCat = NOMES[cat] || cat
    if (limite > 0) {
      const pct = (total / limite) * 100
      const status = pct >= 100 ? '🔴' : pct >= 80 ? '🟡' : '🟢'
      linhas.push(`${status} ${nomeCat}: ${fmt(total)} / ${fmt(limite)}`)
    } else {
      linhas.push(`• ${nomeCat}: ${fmt(total)}`)
    }
  }

  const maior = transactions.reduce((a, b) => parseFloat(a.amount) > parseFloat(b.amount) ? a : b)
  linhas.push(`\n💸 Maior gasto: <i>${maior.title}</i> (${fmt(parseFloat(maior.amount))})`)
  linhas.push(`\n🗓 Até semana que vem, bons gastos! 💪`)

  await sendTelegramMessage(chatId, linhas.join('\n'))
}

// --- Endpoint simplificado para testes via Postman ---
async function handleTestEndpoint(body: { chat_id: number; message: string }) {
  const chatId = body.chat_id

  // PASSO A: Validar remetente
  const { valid, profile } = await validateSender(chatId)
  if (!valid || !profile) {
    return Response.json({
      status: 'unauthorized',
      error: 'chat_id não encontrado ou não verificado na tabela profiles',
      chat_id: chatId,
    }, { status: 401 })
  }

  // PASSO B: Chamar IA
  const aiResult = await callGeminiAI(body.message)

  if ('erro' in aiResult) {
    return Response.json({
      status: 'ai_error',
      error: aiResult.erro,
      chat_id: chatId,
      user: profile.full_name,
    }, { status: 200 })
  }

  // IA pediu esclarecimento (cartão ambíguo)
  if ('pergunta' in aiResult && aiResult.pergunta) {
    return Response.json({
      status: 'question',
      question: aiResult.pergunta,
      chat_id: chatId,
      user: profile.full_name,
    }, { status: 200 })
  }

  // PASSO C + D: Salvar transação
  const transaction = await saveTransaction(
    profile.id,
    aiResult,
    profile.closing_day_card
  )

  await logTelegram(
    chatId,
    body.message,
    aiResult as unknown as Record<string, unknown>,
    transaction.id,
    'processed'
  )

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
    would_reply: aiResult.confirmacao_msg,
  }, { status: 200 })
}

// ============================================================
// HANDLER PRINCIPAL
// ============================================================
Deno.serve(async (req: Request) => {
  // Só aceita POST
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 })
  }

  try {
    const body = await req.json()

    // ── MODO TESTE (Postman): POST com { "test": true, "chat_id": 123, "message": "..." }
    if (body.test === true) {
      console.log('[MODO TESTE] Simulação recebida:', body)
      return await handleTestEndpoint(body)
    }

    // ── Telegram Update
    const update = body as TelegramUpdate

    // Ignora updates sem mensagem de texto
    if (!update.message?.text) {
      return new Response('OK', { status: 200 })
    }

    const chatId = update.message.chat.id
    const messageText = update.message.text
    const fromName = update.message.from.first_name

    console.log(`Telegram message from ${chatId} (${fromName}): ${messageText}`)

    // --- Comando /start (vinculação de conta) ---
    if (messageText.startsWith('/start')) {
      const parts = messageText.split(' ')
      if (parts.length > 1) {
        // /start <code> → vincular conta
        await handleStartCommand(chatId, parts[1], fromName)
      } else {
        // /start sem código → mensagem de boas-vindas
        await sendTelegramMessage(chatId,
          '👋 Olá! Eu sou o bot do <b>BolsoCheio</b>!\n\n' +
          'Para começar, vincule sua conta:\n' +
          '1. Abra o app BolsoCheio\n' +
          '2. Vá em Configurações > Telegram Bot\n' +
          '3. Clique em "Conectar Telegram"\n' +
          '4. Use o link gerado\n\n' +
          'Depois de vincular, envie mensagens como:\n' +
          '• "Gastei 45 no almoço"\n' +
          '• "Uber 23 reais"\n' +
          '• "Netflix 55,90 cartão"'
        )
      }
      return new Response('OK', { status: 200 })
    }

    // --- Comando /ajuda ---
    if (messageText === '/ajuda' || messageText === '/help') {
      await sendTelegramMessage(chatId,
        '📖 <b>Como usar o BolsoCheio Bot</b>\n\n' +
        'Envie uma mensagem descrevendo seu gasto:\n\n' +
        '• "Gastei 45 no almoço"\n' +
        '• "Uber 23 reais"\n' +
        '• "Netflix 55,90 cartão"\n' +
        '• "Comprei remédio 89,90 débito"\n' +
        '• "Paguei aluguel 1500"\n\n' +
        'Eu uso IA para entender valor, categoria e forma de pagamento automaticamente! 🤖\n\n' +
        '<b>Comandos:</b>\n' +
        '/ajuda - Mostra esta mensagem\n' +
        '/start - Vincular conta\n' +
        '/relatorio - Ver relatório semanal\n' +
        '(ou escreva "meu relatório semanal")'
      )
      return new Response('OK', { status: 200 })
    }

    // --- Mensagem normal: processar como gasto ---
    const { valid, profile } = await validateSender(chatId)

    if (!valid || !profile) {
      await logTelegram(chatId, messageText, null, null, 'unauthorized')
      await sendTelegramMessage(chatId,
        '❌ Conta não vinculada.\n\n' +
        'Para usar o bot, vincule sua conta no app:\n' +
        '👉 Configurações > Telegram Bot'
      )
      return new Response('OK', { status: 200 })
    }

    // --- Comando de relatório semanal ---
    if (isRelatorioCommand(messageText)) {
      await handleRelatorioSemanal(chatId, profile.id, profile.full_name)
      return new Response('OK', { status: 200 })
    }

    const supabase = getSupabaseAdmin()

    // --- PRIMEIRO: verificar se há resposta a uma pergunta de forma de pagamento pendente ---
    const { data: pendingPaymentRows } = await supabase
      .from('telegram_log')
      .select('id, message_text')
      .eq('chat_id', chatId)
      .eq('status', 'pending_payment_method')
      .order('created_at', { ascending: false })
      .limit(1)

    const pendingPaymentLog = pendingPaymentRows?.[0] ?? null

    if (pendingPaymentLog?.message_text) {
      const paymentAnswer = detectPaymentMethod(messageText)

      if (!paymentAnswer) {
        // Usuário não respondeu com uma forma de pagamento válida → re-pergunta
        await sendTelegramMessage(chatId,
          '❓ Não entendi. Como foi o pagamento?\n\n' +
          '• <b>Pix</b>\n' +
          '• <b>Crédito</b>\n' +
          '• <b>Débito</b>\n' +
          '• <b>Dinheiro</b>'
        )
        return new Response('OK', { status: 200 })
      }

      // Reprocessa a mensagem original com a forma de pagamento
      const clarifiedMessage = pendingPaymentLog.message_text + ' ' + paymentAnswer

      // Marca como processado
      await supabase.from('telegram_log').update({ status: 'received' }).eq('id', pendingPaymentLog.id)

      const aiResult = await callGeminiAI(clarifiedMessage)

      if ('erro' in aiResult) {
        await sendTelegramMessage(chatId, `🤔 ${aiResult.erro}`)
        return new Response('OK', { status: 200 })
      }

      const transaction = await saveTransaction(profile.id, aiResult, profile.closing_day_card)
      await logTelegram(chatId, clarifiedMessage, aiResult as unknown as Record<string, unknown>, transaction.id, 'processed')

      const billingInfo = aiResult.tipo_pagamento === 'cartao'
        ? `\n📅 Fatura: ${calculateBillingMonth(new Date(), profile.closing_day_card)}`
        : ''

      await sendTelegramMessage(chatId,
        aiResult.confirmacao_msg + billingInfo +
        (aiResult.recorrente ? '\n🔄 Recorrente' : '')
      )
      return new Response('OK', { status: 200 })
    }

    // --- Verificar se é resposta a uma pergunta de cartão pendente (crédito/débito) ---
    const lowerText = messageText.toLowerCase().trim()
    const isCreditAnswer = /cr[eé]dito/.test(lowerText)
    const isDebitAnswer = /d[eé]bito/.test(lowerText)

    if (isCreditAnswer || isDebitAnswer) {
      // Busca a última mensagem pendente deste chat
      const { data: pendingCardRows } = await supabase
        .from('telegram_log')
        .select('id, message_text')
        .eq('chat_id', chatId)
        .eq('status', 'pending_card_type')
        .order('created_at', { ascending: false })
        .limit(1)

      const pendingLog = pendingCardRows?.[0] ?? null

      if (pendingLog?.message_text) {
        // Reprocessa a mensagem original com a especificação de crédito/débito
        const clarifiedMessage = pendingLog.message_text + (isCreditAnswer ? ' no crédito' : ' no débito')

        // Marca o log pendente como processado
        await supabase.from('telegram_log').update({ status: 'received' }).eq('id', pendingLog.id)

        // Processa a mensagem clarificada
        const aiResult = await callGeminiAI(clarifiedMessage)

        if ('erro' in aiResult) {
          await sendTelegramMessage(chatId, `🤔 ${aiResult.erro}`)
          return new Response('OK', { status: 200 })
        }

        const transaction = await saveTransaction(profile.id, aiResult, profile.closing_day_card)
        await logTelegram(chatId, clarifiedMessage, aiResult as unknown as Record<string, unknown>, transaction.id, 'processed')

        const billingInfo = aiResult.tipo_pagamento === 'cartao'
          ? `\n📅 Fatura: ${calculateBillingMonth(new Date(), profile.closing_day_card)}`
          : ''

        await sendTelegramMessage(chatId,
          aiResult.confirmacao_msg + billingInfo +
          (aiResult.recorrente ? '\n🔄 Recorrente' : '')
        )
        return new Response('OK', { status: 200 })
      }
    }

    // --- Safety net: mensagem só de pagamento sem contexto pendente ---
    // Evita que "pix", "crédito", etc. isolados caiam no Gemini e retornem erro
    if (!pendingPaymentLog && detectPaymentMethod(messageText) && messageText.trim().split(/\s+/).length <= 4) {
      await sendTelegramMessage(chatId,
        '❓ Não encontrei um gasto pendente.\n\n' +
        'Envie o gasto completo incluindo a forma de pagamento:\n' +
        '• "Gastei 50 na festa no pix"\n' +
        '• "Almoço 45 reais débito"'
      )
      return new Response('OK', { status: 200 })
    }

    // --- Verificar "cartão" ambíguo ANTES de chamar a IA ---
    if (hasAmbiguousCard(messageText)) {
      // Salva a mensagem como pendente para quando o usuário responder
      await logTelegram(chatId, messageText, null, null, 'pending_card_type')
      await sendTelegramMessage(chatId,
        '💳 Foi no cartão de <b>crédito</b> ou <b>débito</b>?'
      )
      return new Response('OK', { status: 200 })
    }

    // --- Verificar ausência de forma de pagamento ANTES de chamar a IA ---
    if (hasNoPaymentMethod(messageText)) {
      await logTelegram(chatId, messageText, null, null, 'pending_payment_method')
      await sendTelegramMessage(chatId,
        '💳 Como foi o pagamento?\n\n' +
        '• <b>Pix</b>\n' +
        '• <b>Crédito</b>\n' +
        '• <b>Débito</b>\n' +
        '• <b>Dinheiro</b>'
      )
      return new Response('OK', { status: 200 })
    }

    // Chamar IA
    const aiResult = await callGeminiAI(messageText)

    if ('erro' in aiResult) {
      await logTelegram(chatId, messageText, aiResult as Record<string, unknown>, null, 'error', aiResult.erro)
      await sendTelegramMessage(chatId,
        `🤔 ${aiResult.erro}\n\nExemplos:\n• "Gastei 45 no almoço"\n• "Uber 23 reais"\n• "Netflix 55,90 no crédito"`
      )
      return new Response('OK', { status: 200 })
    }

    // Salvar transação
    const transaction = await saveTransaction(
      profile.id,
      aiResult,
      profile.closing_day_card
    )

    await logTelegram(
      chatId,
      messageText,
      aiResult as unknown as Record<string, unknown>,
      transaction.id,
      'processed'
    )

    // Resposta de confirmação (usa a mensagem personalizada da IA)
    const billingInfo = aiResult.tipo_pagamento === 'cartao'
      ? `\n📅 Fatura: ${calculateBillingMonth(new Date(), profile.closing_day_card)}`
      : ''

    await sendTelegramMessage(chatId,
      aiResult.confirmacao_msg + billingInfo +
      (aiResult.recorrente ? '\n🔄 Recorrente' : '')
    )

    return new Response('OK', { status: 200 })
  } catch (error) {
    console.error('Telegram webhook error:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return Response.json({
      status: 'error',
      error: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    }, { status: 500 })
  }
})
