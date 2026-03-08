import { CATEGORY_LABELS } from '@/lib/constants'

export type AlertType =
  | 'budget_warning'
  | 'budget_exceeded'
  | 'upcoming_installment'
  | 'seasonal_expense'
  | 'reserve_critical'
  | 'reserve_warning'

export type Alert = {
  id: string
  type: AlertType
  severity: 'warning' | 'critical'
  title: string
  message: string
  category?: string
  amount?: number
  dueDate?: string
}

export type BudgetCategoryData = {
  category: string
  spent: number
  limit: number
  pct: number
  alertThresholdPct: number
}

export type RecurringInput = {
  id: string
  name: string
  type: string
  amount: number
  category: string
  totalInstallments: number | null
  currentInstallment: number | null
  startDate: Date | null
  monthOfYear: number | null
}

export type ReserveAlertInput = {
  coverageMonths: number
  targetMonths: number
  currentValue: number
  targetValue: number
  monthlyContribution: number
} | null

export function computeAlerts(
  budgetData: BudgetCategoryData[],
  recurringExpenses: RecurringInput[],
  personalIncome: number,
  month: string,
  snoozedKeys: Set<string>,
  reserveData?: ReserveAlertInput,
): Alert[] {
  const alerts: Alert[] = []

  // Budget alerts
  for (const cat of budgetData) {
    if (cat.limit === 0) continue
    const keyExceeded = `budget_exceeded_${cat.category}`
    const keyWarning = `budget_warning_${cat.category}`
    const label = CATEGORY_LABELS[cat.category] || cat.category

    if (cat.pct >= 100 && !snoozedKeys.has(keyExceeded)) {
      alerts.push({
        id: keyExceeded,
        type: 'budget_exceeded',
        severity: 'critical',
        title: `${label} acima do limite`,
        message: `Você gastou ${cat.pct.toFixed(0)}% do orçamento de ${label} (R$ ${cat.spent.toFixed(2)} / R$ ${cat.limit.toFixed(2)})`,
        category: cat.category,
        amount: cat.spent,
      })
    } else if (cat.pct >= cat.alertThresholdPct && cat.pct < 100 && !snoozedKeys.has(keyWarning)) {
      alerts.push({
        id: keyWarning,
        type: 'budget_warning',
        severity: 'warning',
        title: `${label} próximo do limite`,
        message: `Você usou ${cat.pct.toFixed(0)}% do orçamento de ${label} (R$ ${cat.spent.toFixed(2)} / R$ ${cat.limit.toFixed(2)})`,
        category: cat.category,
        amount: cat.spent,
      })
    }
  }

  // Recurring expense alerts
  const [, mo] = month.split('-').map(Number)
  const today = new Date()
  const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000)
  const nextMonthNum = mo === 12 ? 1 : mo + 1

  for (const exp of recurringExpenses) {
    if (
      exp.type === 'installment' &&
      exp.startDate &&
      exp.currentInstallment != null &&
      exp.totalInstallments != null
    ) {
      const remaining = exp.totalInstallments - exp.currentInstallment
      if (remaining <= 0) continue

      // Current installment is due at: startDate + currentInstallment months (0-indexed)
      const nextDue = new Date(exp.startDate)
      nextDue.setMonth(nextDue.getMonth() + exp.currentInstallment)

      const key = `upcoming_installment_${exp.id}`
      if (nextDue >= today && nextDue <= thirtyDaysFromNow && !snoozedKeys.has(key)) {
        const pctOfIncome = personalIncome > 0 ? (exp.amount / personalIncome) * 100 : 0
        alerts.push({
          id: key,
          type: 'upcoming_installment',
          severity: pctOfIncome > 5 ? 'critical' : 'warning',
          title: `Parcela próxima: ${exp.name}`,
          message: `Parcela ${exp.currentInstallment + 1}/${exp.totalInstallments} de R$ ${exp.amount.toFixed(2)} vence em ${nextDue.toLocaleDateString('pt-BR')}`,
          amount: exp.amount,
          dueDate: nextDue.toISOString(),
        })
      }
    }

    if (exp.type === 'seasonal' && exp.monthOfYear === nextMonthNum) {
      const key = `seasonal_expense_${exp.id}`
      if (!snoozedKeys.has(key)) {
        alerts.push({
          id: key,
          type: 'seasonal_expense',
          severity: 'warning',
          title: `Despesa sazonal prevista: ${exp.name}`,
          message: `R$ ${exp.amount.toFixed(2)} previsto para o próximo mês em ${CATEGORY_LABELS[exp.category] || exp.category}`,
          amount: exp.amount,
          category: exp.category,
        })
      }
    }
  }

  // Reserve alerts
  if (reserveData && reserveData.targetValue > 0) {
    const { coverageMonths, targetMonths, currentValue, targetValue, monthlyContribution } = reserveData
    const keyCritical = 'reserve_critical'
    const keyWarning = 'reserve_warning'

    if (coverageMonths < 2 && !snoozedKeys.has(keyCritical)) {
      alerts.push({
        id: keyCritical,
        type: 'reserve_critical',
        severity: 'critical',
        title: 'Reserva de emergência crítica',
        message: `Sua reserva cobre apenas ${coverageMonths.toFixed(1)} meses de gastos. Recomendado: mínimo 2 meses.${monthlyContribution > 0 ? ` Aporte R$ ${monthlyContribution.toFixed(2)}/mês para atingir a meta em 6 meses.` : ''}`,
        amount: currentValue,
      })
    } else if (coverageMonths < targetMonths && !snoozedKeys.has(keyWarning)) {
      alerts.push({
        id: keyWarning,
        type: 'reserve_warning',
        severity: 'warning',
        title: 'Reserva de emergência incompleta',
        message: `Sua reserva cobre ${coverageMonths.toFixed(1)} de ${targetMonths} meses configurados. Faltam R$ ${(targetValue - currentValue).toFixed(2)}.${monthlyContribution > 0 ? ` Aporte R$ ${monthlyContribution.toFixed(2)}/mês para completar em 6 meses.` : ''}`,
        amount: currentValue,
      })
    }
  }

  return alerts
}
