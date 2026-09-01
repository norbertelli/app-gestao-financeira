import {
  BankAccount,
  BankTransaction,
  CreditCard,
  CardTransaction,
  Investment,
  InvestmentTransaction,
  ParsedStatementItem,
  TransactionCategory,
  TransactionType,
} from '../types';

/**
 * Format a number to Brazilian Real (R$) currency string
 */
export function formatCurrency(value: number): string {
  if (isNaN(value)) value = 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format YYYY-MM-DD to DD/MM/YYYY
 */
export function formatDateBR(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

/**
 * Format YYYY-MM to Month/Year in Portuguese (e.g., "2026-08" -> "Agosto/2026")
 */
export function formatMonthBR(yearMonthStr: string): string {
  if (!yearMonthStr) return '';
  const [year, month] = yearMonthStr.split('-');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  const mIndex = parseInt(month, 10) - 1;
  if (mIndex >= 0 && mIndex < 12) {
    return `${monthNames[mIndex]}/${year}`;
  }
  return yearMonthStr;
}

/**
 * Get current month tag YYYY-MM
 */
export function getCurrentYearMonth(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Calculate Bank Account Final Balance: Initial Balance + Sum of transactions
 */
export function calculateAccountFinalBalance(
  account: BankAccount,
  transactions: BankTransaction[]
): number {
  const accountTxs = transactions.filter((t) => t.accountId === account.id);
  const txSum = accountTxs.reduce((sum, t) => sum + t.amount, 0);
  return account.initialBalance + txSum;
}

/**
 * Get account Overdraft Limit (Cheque Especial / LIS)
 */
export function calculateAccountOverdraft(account: BankAccount): number {
  return account.overdraftLimit && account.overdraftLimit > 0 ? account.overdraftLimit : 0;
}

/**
 * Calculate Total Available Balance: (Final Balance + Overdraft Limit)
 */
export function calculateAccountTotalAvailable(
  account: BankAccount,
  transactions: BankTransaction[]
): number {
  const finalBalance = calculateAccountFinalBalance(account, transactions);
  const overdraft = calculateAccountOverdraft(account);
  return finalBalance + overdraft;
}

/**
 * Calculate Credit Card Invoice total for a specific month YYYY-MM
 */
export function calculateCardCurrentInvoice(
  cardId: string,
  cardTransactions: CardTransaction[],
  targetMonth: string
): number {
  const monthTxs = cardTransactions.filter(
    (t) => t.cardId === cardId && t.invoiceMonth === targetMonth
  );
  return monthTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Calculate total outstanding card balance across current and future months
 */
export function calculateCardTotalOutstanding(
  cardId: string,
  cardTransactions: CardTransaction[]
): number {
  const cardTxs = cardTransactions.filter((t) => t.cardId === cardId);
  return cardTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
}

/**
 * Calculate Available Credit Card Limit (Limite Disponível Livre)
 */
export function calculateCardAvailableLimit(
  card: CreditCard,
  cardTransactions: CardTransaction[]
): number {
  const used = calculateCardTotalOutstanding(card.id, cardTransactions);
  return Math.max(0, card.totalLimit - used);
}

/**
 * Calculate Percentage of Credit Limit Used (0% to 100+%)
 */
export function calculateCardUsedLimitPercent(
  card: CreditCard,
  cardTransactions: CardTransaction[]
): number {
  if (!card.totalLimit || card.totalLimit <= 0) return 0;
  const used = calculateCardTotalOutstanding(card.id, cardTransactions);
  return Math.min(100, Math.max(0, (used / card.totalLimit) * 100));
}

/**
 * Calculate Investment Current Balance: Initial Balance + Sum of Movements
 */
export function calculateInvestmentCurrentBalance(
  investment: Investment,
  transactions: InvestmentTransaction[]
): number {
  const invTxs = transactions.filter((t) => t.investmentId === investment.id);
  const movementSum = invTxs.reduce((sum, t) => sum + t.amount, 0);
  return investment.initialBalance + movementSum;
}

/**
 * Calculate Total Net Worth across all accounts + investments minus open card debts
 */
export function calculateTotalNetWorth(
  accounts: BankAccount[],
  bankTxs: BankTransaction[],
  cards: CreditCard[],
  cardTxs: CardTransaction[],
  investments: Investment[],
  invTxs: InvestmentTransaction[]
): {
  totalAccountsBalance: number;
  totalCardsOutstanding: number;
  totalInvestmentsBalance: number;
  netWorth: number;
} {
  const totalAccountsBalance = accounts.reduce(
    (sum, acc) => sum + calculateAccountFinalBalance(acc, bankTxs),
    0
  );

  const totalCardsOutstanding = cards.reduce(
    (sum, card) => sum + calculateCardTotalOutstanding(card.id, cardTxs),
    0
  );

  const totalInvestmentsBalance = investments.reduce(
    (sum, inv) => sum + calculateInvestmentCurrentBalance(inv, invTxs),
    0
  );

  const netWorth = totalAccountsBalance + totalInvestmentsBalance - totalCardsOutstanding;

  return {
    totalAccountsBalance,
    totalCardsOutstanding,
    totalInvestmentsBalance,
    netWorth,
  };
}

/**
 * Smart Regex-based local parser for copypasted Brazilian bank & credit card statements.
 * Works offline or as fallback for Gemini AI!
 */
export function smartParseTextLocally(
  rawText: string,
  targetType: 'bank' | 'card' | 'investment'
): ParsedStatementItem[] {
  if (!rawText || !rawText.trim()) return [];

  // Pre-normalize text by putting newlines before dates (DD/MM/YYYY or DD/MM) so that unformatted/continuous strings split properly
  const normalizedText = rawText
    .replace(/(?:^|\s)(\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?)/g, '\n$1')
    .replace(/\r/g, '');

  const lines = normalizedText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
  const items: ParsedStatementItem[] = [];

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonthStr = getCurrentYearMonth();

  // Common line match patterns
  const dateRegex = /(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?/;
  const amountRegex = /(?:R\$\s*)?([-+]?\s*\d{1,3}(?:\.\d{3})*,\d{2}|\b[-+]?\d+[\.,]\d{2}\b)/i;
  const parcelRegex = /(?:parc|parcela|x)\s*(\d{1,2})\s*[\/\-de]\s*(\d{1,2})/i;

  for (let idx = 0; idx < lines.length; idx++) {
    const line = lines[idx];

    // Filter out summary/header/footer lines that are not individual transactions
    const lower = line.toLowerCase();
    if (
      lower.includes('saldo anterior') ||
      lower.includes('saldo atual') ||
      lower.includes('saldo da conta') ||
      lower.includes('saldo bloqueado') ||
      lower.includes('limite cheque') ||
      lower.includes('limite disponível') ||
      lower.includes('limite disponivel') ||
      lower.includes('taxa de juros') ||
      lower.includes('vencimento do cheque') ||
      lower.includes('custo efetivo') ||
      lower.includes('ouvidoria') ||
      lower.includes('sac 0800') ||
      lower.includes('período de') ||
      lower.includes('periodo de') ||
      lower.includes('lançamentos a conferir') ||
      lower.includes('saldo de investimentos')
    ) {
      continue;
    }

    // Check if line contains a date and amount
    const dateMatch = line.match(dateRegex);
    const amountMatch = line.match(amountRegex);

    if (dateMatch && amountMatch) {
      // Complete transaction line
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      let year = dateMatch[3] ? dateMatch[3] : String(currentYear);
      if (year.length === 2) year = '20' + year;

      const dateFormatted = `${year}-${month}-${day}`;

      // Clean amount
      let rawVal = amountMatch[1].replace(/\s+/g, '').replace('R$', '');
      let isNegative = rawVal.includes('-');
      let isPositive = rawVal.includes('+');
      
      // Parse float number from BR format 1.234,56
      let numStr = rawVal.replace(/[-+]/g, '').replace(/\./g, '').replace(',', '.');
      let numVal = parseFloat(numStr) || 0;
      if (isNaN(numVal) || numVal === 0) continue;

      // Determine income or expense
      let isExpense = isNegative || targetType === 'card';
      const upperLine = line.toUpperCase();
      if (
        line.includes('+') ||
        upperLine.includes('RECEBIMENTO') ||
        upperLine.includes('PIX_CRED') ||
        upperLine.includes('CREDITO') ||
        upperLine.includes('SALARIO') ||
        upperLine.includes('DEPOSITO')
      ) {
        isExpense = false;
      } else if (
        isNegative ||
        upperLine.includes('PAGAMENTO') ||
        upperLine.includes('COMPRAS') ||
        upperLine.includes('DEBITO') ||
        upperLine.includes('TARIFA') ||
        upperLine.includes('JUROS') ||
        upperLine.includes('CESTA') ||
        upperLine.includes('PIX_DEB')
      ) {
        isExpense = true;
      }

      // Determine final amount (+ for income, - for expense in bank)
      let finalAmount = isExpense ? -Math.abs(numVal) : Math.abs(numVal);
      if (targetType === 'card') {
        finalAmount = Math.abs(numVal); // Card expenses stored positive
      }

      // Clean description: remove dates, all amounts, doc codes, CPFs/CNPJs
      let desc = line
        .replace(dateMatch[0], '')
        .replace(/(?:R\$\s*)?[-+]?\d{1,3}(?:\.\d{3})*,\d{2}/gi, '')
        .replace(/\b(PIX_DEB|PIX_CRED|CX\d+|VE\d+|ENC\d+|SAESASC-C)\b/gi, '')
        .replace(/\b\d{8,14}\b/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      if (!desc) desc = 'Lançamento Extrato';

      // Check parcelment
      let currentInstallment = 1;
      let totalInstallments = 1;
      const parcelMatch = line.match(parcelRegex);
      if (parcelMatch) {
        currentInstallment = parseInt(parcelMatch[1], 10) || 1;
        totalInstallments = parseInt(parcelMatch[2], 10) || 1;
      }

      // Categorize automatically
      const category = autoCategorize(desc);
      const type = autoDetectType(desc);

      items.push({
        id: `parsed_${Date.now()}_${idx}_${Math.random().toString(36).substr(2, 5)}`,
        date: dateFormatted,
        description: desc,
        amount: finalAmount,
        isExpense,
        category,
        type,
        currentInstallment,
        totalInstallments,
        invoiceMonth: `${year}-${month}`,
      });
    }
  }

  // Fallback if line-by-line regex didn't catch, try splitting by spaces/tokens
  if (items.length === 0 && lines.length > 0) {
    const textBlob = lines.join(' ');
    const allAmounts = [...textBlob.matchAll(/(?:R\$\s*)?([-+]?\d{1,3}(?:\.\d{3})*,\d{2})/gi)];
    
    allAmounts.forEach((m, i) => {
      let rawVal = m[1].replace(/\./g, '').replace(',', '.');
      let val = Math.abs(parseFloat(rawVal) || 50.0);
      items.push({
        id: `parsed_fallback_${Date.now()}_${i}`,
        date: `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-05`,
        description: `Lançamento ${i + 1} (${m[0]})`,
        amount: targetType === 'card' ? val : -val,
        isExpense: true,
        category: 'Outros',
        type: 'Outros',
        currentInstallment: 1,
        totalInstallments: 1,
        invoiceMonth: currentMonthStr,
      });
    });
  }

  return items;
}

/**
 * Auto categorize transaction based on Brazilian keywords
 */
export function autoCategorize(description: string): TransactionCategory {
  const d = description.toLowerCase();

  if (d.includes('mercado') || d.includes('supermercado') || d.includes('ifood') || d.includes('padaria') || d.includes('restaurante') || d.includes('refeicao') || d.includes('alimento') || d.includes('carrefour') || d.includes('pao de acucar') || d.includes('outback')) {
    return 'Alimentação';
  }
  if (d.includes('uber') || d.includes('99') || d.includes('posto') || d.includes('gasolina') || d.includes('estacionamento') || d.includes('pedagio') || d.includes('combustivel') || d.includes('ipva')) {
    return 'Transporte';
  }
  if (d.includes('aluguel') || d.includes('condominio') || d.includes('luz') || d.includes('enel') || d.includes('copel') || d.includes('sabesp') || d.includes('internet') || d.includes('vivo') || d.includes('claro') || d.includes('iptu')) {
    return 'Moradia';
  }
  if (d.includes('farmacia') || d.includes('drogasil') || d.includes('droga raia') || d.includes('hospital') || d.includes('consulta') || d.includes('medico') || d.includes('unimed') || d.includes('exame')) {
    return 'Saúde';
  }
  if (d.includes('netflix') || d.includes('spotify') || d.includes('cinema') || d.includes('steam') || d.includes('playstation') || d.includes('bar') || d.includes('viagem') || d.includes('ingresso') || d.includes('shopee') || d.includes('shein')) {
    return 'Lazer';
  }
  if (d.includes('faculdade') || d.includes('escola') || d.includes('curso') || d.includes('udemy') || d.includes('livro') || d.includes('estudo')) {
    return 'Educação';
  }
  if (d.includes('salario') || d.includes('prolabore') || d.includes('pagamento recebido') || d.includes('pix recebido de emp') || d.includes('remuneracao')) {
    return 'Salário';
  }
  if (d.includes('tarifa') || d.includes('taxa') || d.includes('imposto') || d.includes('iof') || d.includes('anuidade')) {
    return 'Tarifa/Imposto';
  }
  if (d.includes('cdb') || d.includes('tesouro') || d.includes('investimento') || d.includes('ações') || d.includes('fundo') || d.includes('aporte') || d.includes('xp') || d.includes('btg')) {
    return 'Investimentos';
  }
  if (d.includes('rendimento') || d.includes('provento') || d.includes('jcp') || d.includes('dividendo')) {
    return 'Rendimento';
  }
  if (d.includes('pix') || d.includes('ted') || d.includes('transf')) {
    return 'Transferência';
  }

  return 'Outros';
}

/**
 * Auto detect payment method type
 */
export function autoDetectType(description: string): TransactionType {
  const d = description.toLowerCase();
  if (d.includes('pix')) return 'PIX';
  if (d.includes('ted') || d.includes('doc')) return 'TED';
  if (d.includes('boleto') || d.includes('pagto') || d.includes('convenio')) return 'Boleto';
  if (d.includes('cartao') || d.includes('compra')) return 'Cartão';
  if (d.includes('tarifa') || d.includes('anuidade')) return 'Tarifa';
  if (d.includes('rendimento')) return 'Rendimento';
  return 'Outros';
}

/**
 * Calculate the first invoice month (YYYY-MM) for a purchase based on card closing day.
 * If purchase day >= closingDay, the current month invoice is closed and the first installment
 * will be in the next month's invoice.
 * If purchase day < closingDay, the purchase enters the current month's invoice.
 */
export function calculateFirstInvoiceMonth(purchaseDate: string, closingDay: number): string {
  if (!purchaseDate) return getCurrentYearMonth();
  const parts = purchaseDate.split('-').map(Number);
  const year = parts[0] || new Date().getFullYear();
  const month = parts[1] || new Date().getMonth() + 1;
  const day = parts[2] || 1;

  // If purchase is made on or after the closing day (melhor dia), it enters the next month's invoice
  if (day >= (closingDay || 5)) {
    const nextDate = new Date(year, month, 1); // month is 1-indexed in date arithmetic here
    const nextYear = nextDate.getFullYear();
    const nextMonth = String(nextDate.getMonth() + 1).padStart(2, '0');
    return `${nextYear}-${nextMonth}`;
  } else {
    return `${year}-${String(month).padStart(2, '0')}`;
  }
}

/**
 * Get the next invoice month tag (YYYY-MM) relative to a given invoice month or current month.
 */
export function getNextInvoiceMonth(monthStr?: string): string {
  const base = monthStr || getCurrentYearMonth();
  const [year, month] = base.split('-').map(Number);
  const nextDate = new Date(year, month, 1);
  return `${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Get the previous invoice month tag (YYYY-MM) relative to a given invoice month or current month.
 */
export function getPreviousInvoiceMonth(monthStr?: string): string {
  const base = monthStr || getCurrentYearMonth();
  const [year, month] = base.split('-').map(Number);
  const prevDate = new Date(year, month - 2, 1);
  return `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
}

/**
 * Calculate the projected calendar date (YYYY-MM-DD) for an installment in a specific invoice month.
 * Uses the day of the purchase (or card due day), safely clamped to the number of days in that month.
 */
export function calculateInstallmentDate(invoiceMonth: string, preferredDay: number): string {
  if (!invoiceMonth) return new Date().toISOString().split('T')[0];
  const [yearNum, monthNum] = invoiceMonth.split('-').map(Number);
  // Get max days in target month (day 0 of monthNum gives last day of monthNum - 1, so monthNum is next month)
  const maxDays = new Date(yearNum, monthNum, 0).getDate();
  const clampedDay = Math.min(Math.max(1, preferredDay || 1), maxDays);
  return `${yearNum}-${String(monthNum).padStart(2, '0')}-${String(clampedDay).padStart(2, '0')}`;
}

/**
 * Generate a complete schedule of future installments for a credit card purchase.
 */
export function generateInstallmentsSchedule(options: {
  card: CreditCard;
  description: string;
  totalAmount: number;
  totalInstallments: number;
  purchaseDate: string;
  firstInvoiceMonth?: string;
  category: TransactionCategory;
}): Omit<CardTransaction, 'id'>[] {
  const {
    card,
    description,
    totalAmount,
    totalInstallments,
    purchaseDate,
    firstInvoiceMonth,
    category,
  } = options;

  const numParc = Math.max(1, totalInstallments || 1);
  const totalVal = Math.abs(totalAmount) || 0;
  const baseInstallmentAmount = Math.floor((totalVal / numParc) * 100) / 100;
  const remainder = Math.round((totalVal - baseInstallmentAmount * numParc) * 100) / 100;

  const initialInvoiceMonth =
    firstInvoiceMonth || calculateFirstInvoiceMonth(purchaseDate, card.closingDay);
  const [startYear, startMonth] = initialInvoiceMonth.split('-').map(Number);
  const purchaseParts = purchaseDate.split('-').map(Number);
  const purchaseDay = purchaseParts[2] || 1;

  const currentMonth = getCurrentYearMonth();
  const purchaseGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
  const schedule: Omit<CardTransaction, 'id'>[] = [];

  for (let i = 0; i < numParc; i++) {
    // Add i months to starting invoice month
    const targetDate = new Date(startYear, startMonth - 1 + i, 1);
    const invoiceMonthTag = `${targetDate.getFullYear()}-${String(targetDate.getMonth() + 1).padStart(2, '0')}`;
    
    // Calculate installment date for that month
    const installmentDate = calculateInstallmentDate(invoiceMonthTag, purchaseDay);

    // Give remainder cents to 1st installment so sum strictly matches totalVal
    const installmentAmount = i === 0 ? baseInstallmentAmount + remainder : baseInstallmentAmount;

    let status: 'Faturado' | 'Aberto' | 'Futuro' = 'Futuro';
    if (invoiceMonthTag < currentMonth) {
      status = 'Faturado';
    } else if (invoiceMonthTag === currentMonth) {
      status = 'Aberto';
    } else {
      status = 'Futuro';
    }

    schedule.push({
      cardId: card.id,
      date: installmentDate, // Future projected date for this installment
      purchaseDate: purchaseDate, // Original purchase date preserved
      description: description.trim(),
      amount: Math.round(installmentAmount * 100) / 100,
      category,
      currentInstallment: i + 1,
      totalInstallments: numParc,
      invoiceMonth: invoiceMonthTag,
      status,
      purchaseGroupId,
    });
  }

  return schedule;
}

