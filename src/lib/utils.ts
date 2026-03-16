import { format, parse, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
    return ['Comece a registrar seus gastos para receber dicas personalizadas!']
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
      `Seus gastos fixos representam ${fixedPercent}% do total. Considere renegociar assinaturas ou planos para reduzir esse valor.`
    )
  } else if (Number(variablePercent) > 60) {
    insights.push(
      `Seus gastos variáveis representam ${variablePercent}% do total. Tente definir um orçamento diário para controlar melhor esses gastos.`
    )
  } else {
    insights.push(
      `Boa distribuição! Gastos fixos: ${fixedPercent}% | Variáveis: ${variablePercent}%. Continue assim!`
    )
  }

  // Insight sobre categoria mais cara
  const topCategory = (Object.entries(summary.byCategory) as [Category, number][])
    .sort(([, a], [, b]) => b - a)
    .filter(([, v]) => v > 0)[0]

  if (topCategory) {
    const [cat, value] = topCategory
    const percent = ((value / summary.totalSpent) * 100).toFixed(0)
    insights.push(
      `A categoria que mais pesa no seu bolso é "${cat}" com ${percent}% dos gastos (${formatCurrency(value)}).`
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
        `Você teve ${highSpendDays} dias com gastos acima do dobro da média diária. Planeje suas compras para distribuir melhor ao longo do mês.`
      )
    }
  }

  // Insight sobre recorrências
  const recurringExpenses = expenses.filter((e) => e.isRecurring)
  if (recurringExpenses.length > 0) {
    const recurringTotal = recurringExpenses.reduce((sum, e) => sum + e.amount, 0)
    insights.push(
      `Você tem ${recurringExpenses.length} gastos recorrentes totalizando ${formatCurrency(recurringTotal)}/mês. Revise se todos ainda são necessários.`
    )
  }

  // Insight sobre cartão de crédito
  const creditExpenses = expenses.filter((e) => e.paymentMethod === 'credito')
  if (creditExpenses.length > 0) {
    const creditTotal = creditExpenses.reduce((sum, e) => sum + e.amount, 0)
    const creditPercent = ((creditTotal / summary.totalSpent) * 100).toFixed(0)
    if (Number(creditPercent) > 50) {
      insights.push(
        `${creditPercent}% dos seus gastos são no cartão de crédito. Cuidado para não comprometer o próximo mês!`
      )
    }
  }

  return insights
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
  if (limit === 0) return '#6366f1' // sem limite = cor neutra
  const ratio = spent / limit
  if (ratio <= 0.6) return '#22c55e' // verde
  if (ratio <= 0.85) return '#f59e0b' // amarelo
  return '#ef4444' // vermelho
}
