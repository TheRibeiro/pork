import { format, parse, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CATEGORY_CONFIG } from '../types'
import type { CreditCardConfig, Expense, MonthSummary, Category } from '../types'

/**
 * Calcula em qual mês de fatura um gasto de cartão de crédito cairá
 * Se a data do gasto é APÓS o fechamento, vai para o mês seguinte
 */
export function calculateBillingMonth(expenseDate: string, config: CreditCardConfig): string {
  const date = parseISO(expenseDate)
  const day = date.getDate()
  const year = date.getFullYear()
  const month = date.getMonth()

  if (day > config.closingDay) {
    // Gasto após o fechamento → fatura do mês seguinte
    const nextMonth = addMonths(new Date(year, month, 1), 1)
    return format(nextMonth, 'yyyy-MM')
  }

  // Gasto antes ou no dia do fechamento → fatura do mês atual
  return format(new Date(year, month, 1), 'yyyy-MM')
}

/**
 * Formata valor como moeda brasileira
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Formata data para exibição
 */
export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd 'de' MMM", { locale: ptBR })
}

/**
 * Formata mês/ano para exibição
 */
export function formatMonth(monthStr: string): string {
  const date = parse(monthStr, 'yyyy-MM', new Date())
  return format(date, "MMMM 'de' yyyy", { locale: ptBR })
}

/**
 * Retorna o mês atual no formato YYYY-MM
 */
export function getCurrentMonth(): string {
  return format(new Date(), 'yyyy-MM')
}

/**
 * Calcula resumo do mês para os gastos fornecidos
 */
export function calculateMonthSummary(expenses: Expense[], month: string): MonthSummary {
  const monthExpenses = expenses.filter((e) => {
    const expenseMonth = e.billingMonth || e.date.slice(0, 7)
    return expenseMonth === month
  })

  const byCategory = {} as Record<Category, number>
  const categories: Category[] = [
    'alimentacao', 'transporte', 'lazer', 'saude',
    'educacao', 'moradia', 'vestuario', 'assinaturas', 'outros',
  ]

  categories.forEach((cat) => {
    byCategory[cat] = 0
  })

  let fixedTotal = 0
  let variableTotal = 0
  let totalSpent = 0

  monthExpenses.forEach((e) => {
    totalSpent += e.amount
    byCategory[e.category] = (byCategory[e.category] || 0) + e.amount

    if (e.type === 'fixo') {
      fixedTotal += e.amount
    } else {
      variableTotal += e.amount
    }
  })

  // Gastos diários
  const monthDate = parse(month, 'yyyy-MM', new Date())
  const start = startOfMonth(monthDate)
  const end = endOfMonth(monthDate)
  const days = eachDayOfInterval({ start, end })

  const dailySpending = days.map((day) => {
    const dayStr = format(day, 'yyyy-MM-dd')
    const dayTotal = monthExpenses
      .filter((e) => e.date === dayStr)
      .reduce((sum, e) => sum + e.amount, 0)
    return { date: dayStr, total: dayTotal }
  })

  return { totalSpent, byCategory, fixedTotal, variableTotal, dailySpending }
}

/**
 * Gera insights de IA baseados nos gastos
 */
export function generateInsights(expenses: Expense[], month: string): string[] {
  const summary = calculateMonthSummary(expenses, month)
  const insights: string[] = []

  if (expenses.length === 0) {
    return ['Anote seus gastos para receber dicas do BolsoCheio!']
  }

  const fixedPercent = summary.totalSpent > 0
    ? ((summary.fixedTotal / summary.totalSpent) * 100).toFixed(0)
    : '0'
  const variablePercent = summary.totalSpent > 0
    ? ((summary.variableTotal / summary.totalSpent) * 100).toFixed(0)
    : '0'

  // Insight sobre proporção fixo vs variável
  if (Number(fixedPercent) > 70) {
    insights.push(
      `Gastos fixos pesam ${fixedPercent}% do bolso. Vale renegociar algum plano ou assinatura?`
    )
  } else if (Number(variablePercent) > 60) {
    insights.push(
      `Variáveis dominam com ${variablePercent}%. Que tal definir um teto diário pra manter o bolso cheio?`
    )
  } else {
    insights.push(
      `Equilíbrio bom! Fixos: ${fixedPercent}% | Variáveis: ${variablePercent}%. Segue assim!`
    )
  }

  // Insight sobre categoria mais cara
  const topCategory = (Object.entries(summary.byCategory) as [Category, number][])
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0)[0]

  if (topCategory) {
    const [cat, value] = topCategory
    const config = CATEGORY_CONFIG[cat]
    const percent = ((value / summary.totalSpent) * 100).toFixed(0)
    insights.push(
      `${config.emoji} ${config.label} puxa o bolso com ${percent}% dos gastos (${formatCurrency(value)}).`
    )
  }

  // Insight sobre dias com mais gastos
  const topDays = [...summary.dailySpending]
    .sort((a, b) => b.total - a.total)
    .filter((d) => d.total > 0)
    .slice(0, 3)

  if (topDays.length > 0) {
    const avgDaily = summary.totalSpent / summary.dailySpending.length
    const highSpendDays = summary.dailySpending.filter((d) => d.total > avgDaily * 2).length
    if (highSpendDays > 3) {
      insights.push(
        `${highSpendDays} dias com gasto acima do dobro da média. Tenta distribuir melhor ao longo do mês!`
      )
    }
  }

  // Insight sobre recorrências
  const recurringExpenses = expenses.filter((e) => e.isRecurring)
  if (recurringExpenses.length > 0) {
    const recurringTotal = recurringExpenses.reduce((sum, e) => sum + e.amount, 0)
    insights.push(
      `${recurringExpenses.length} gastos fixos somam ${formatCurrency(recurringTotal)}/mês. Todos ainda fazem sentido?`
    )
  }

  // Insight sobre cartão de crédito
  const creditExpenses = expenses.filter((e) => e.paymentMethod === 'credito')
  if (creditExpenses.length > 0) {
    const creditTotal = creditExpenses.reduce((sum, e) => sum + e.amount, 0)
    const creditPercent = ((creditTotal / summary.totalSpent) * 100).toFixed(0)
    if (Number(creditPercent) > 50) {
      insights.push(
        `${creditPercent}% no cartão de crédito — cuidado pra não apertar o bolso no próximo mês!`
      )
    }
  }

  return insights
}

/**
 * Gera um quick insight curto para a dashboard
 */
export function generateQuickInsight(
  expenses: Expense[],
  month: string,
  envelopes: { category: Category; limit: number }[]
): string | null {
  if (expenses.length === 0) return null

  const summary = calculateMonthSummary(expenses, month)
  if (summary.totalSpent === 0) return null

  // Priority 1: Envelope near limit
  for (const env of envelopes) {
    if (env.limit <= 0) continue
    const spent = summary.byCategory[env.category] || 0
    if (spent > env.limit * 0.85) {
      const remaining = Math.max(0, env.limit - spent)
      const config = CATEGORY_CONFIG[env.category]
      if (spent > env.limit) {
        return `${config.emoji} ${config.label} estourou o limite em ${formatCurrency(spent - env.limit)}`
      }
      return `${config.emoji} ${config.label} quase no limite — sobram ${formatCurrency(remaining)}`
    }
  }

  // Priority 2: Top category
  const topCat = (Object.entries(summary.byCategory) as [Category, number][])
    .filter(([, v]) => v > 0)
    .sort(([, a], [, b]) => b - a)[0]

  if (topCat) {
    const [cat, value] = topCat
    const config = CATEGORY_CONFIG[cat]
    const pct = ((value / summary.totalSpent) * 100).toFixed(0)
    return `${config.emoji} ${config.label} lidera com ${pct}% dos gastos (${formatCurrency(value)})`
  }

  return null
}

/**
 * Extrai tags de uma string (#tag1 #tag2)
 */
export function extractTags(text: string): string[] {
  const matches = text.match(/#\w+/g)
  return matches ? matches.map((t) => t.slice(1).toLowerCase()) : []
}

/**
 * Exporta gastos para CSV
 */
export function exportToCSV(expenses: Expense[]): string {
  const headers = ['Data', 'Título', 'Valor', 'Categoria', 'Tipo', 'Pagamento', 'Descrição', 'Tags']
  const rows = expenses.map((e) => [
    e.date,
    e.title,
    e.amount.toFixed(2),
    e.category,
    e.type,
    e.paymentMethod,
    e.description || '',
    (e.tags || []).join('; '),
  ])

  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(',')).join('\n')
  return csv
}

/**
 * Faz download de um arquivo CSV
 */
export function downloadCSV(csv: string, filename: string): void {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

/**
 * Retorna cor do progresso do envelope (verde/amarelo/vermelho)
 */
export function getEnvelopeColor(spent: number, limit: number): string {
  if (limit === 0) return '#14b8a6' // sem limite = cor teal
  const ratio = spent / limit
  if (ratio <= 0.6) return '#22c55e' // verde
  if (ratio <= 0.85) return '#f59e0b' // amarelo
  return '#ef4444' // vermelho
}

/**
 * Dispara um haptic feedback seguro no dispositivo
 * Usa Capacitor Haptics quando disponível (melhor feedback em iOS/Android)
 */
export async function vibrate(pattern: number | number[] = 50) {
  try {
    // Tenta usar Capacitor Haptics primeiro (melhor em app nativo)
    const { Capacitor } = await import('@capacitor/core')
    if (Capacitor.isNativePlatform()) {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics')
      const intensity = typeof pattern === 'number' ? pattern : pattern[0] || 50
      if (intensity <= 15) {
        await Haptics.impact({ style: ImpactStyle.Light })
      } else if (intensity <= 30) {
        await Haptics.impact({ style: ImpactStyle.Medium })
      } else {
        await Haptics.impact({ style: ImpactStyle.Heavy })
      }
      return
    }
  } catch {
    // Fallback para web
  }

  // Fallback: Web Vibration API
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern)
  }
}
