/**
 * Types and interfaces for Financial Management & Open Finance App
 */

export type AccountType = 'Corrente' | 'Poupança' | 'Pagamentos' | 'Salário' | 'Outra';

export interface BankAccount {
  id: string;
  bankCode: string; // e.g., '341', '260', '001', '033', '237', '077'
  bankName: string; // e.g., 'Itaú Unibanco', 'Nubank', 'Banco do Brasil'
  agency: string; // e.g., '1420'
  accountNumber: string; // e.g., '38491-2'
  type: AccountType;
  initialBalance: number; // Saldo Inicial
  color: string;
  icon?: string;
  openFinanceConnected?: boolean;
  lastSyncAt?: string;
}

export type TransactionType = 'PIX' | 'TED' | 'Boleto' | 'Cartão' | 'Tarifa' | 'Rendimento' | 'Outros';

export type TransactionCategory =
  | 'Alimentação'
  | 'Transporte'
  | 'Moradia'
  | 'Saúde'
  | 'Lazer'
  | 'Educação'
  | 'Salário'
  | 'Serviços'
  | 'Tarifa/Imposto'
  | 'Investimentos'
  | 'Rendimento'
  | 'Transferência'
  | 'Outros';

export interface BankTransaction {
  id: string;
  accountId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive = credit/income, negative = debit/expense
  category: TransactionCategory;
  type: TransactionType;
  status: 'Concluído' | 'Pendente';
  notes?: string;
}

export type CardBrand = 'mastercard' | 'visa' | 'elo' | 'amex' | 'outras';

export interface CreditCard {
  id: string;
  name: string; // e.g., 'Itaú Personnalité Black'
  bankId?: string; // Linked bank account id
  bankName: string; // e.g., 'Itaú'
  totalLimit: number;
  closingDay: number; // Melhor dia de compra / fechamento (1-31)
  dueDay: number; // Dia de vencimento da fatura (1-31)
  brand: CardBrand;
  lastFourDigits: string;
  color: string;
}

export interface CardTransaction {
  id: string;
  cardId: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // Expense value (positive or negative)
  category: TransactionCategory;
  currentInstallment: number; // e.g., 2
  totalInstallments: number; // e.g., 10 (2/10)
  invoiceMonth: string; // YYYY-MM (e.g. "2026-08")
  status: 'Faturado' | 'Aberto' | 'Futuro';
  purchaseGroupId?: string; // Groups installments of the same purchase
}

export type AssetType = 'Renda Fixa' | 'Ações' | 'FIIs' | 'Fundos' | 'Tesouro Direto' | 'Cripto' | 'Outros';

export interface Investment {
  id: string;
  institution: string; // e.g., 'XP Investimentos', 'BTG Pactual'
  assetName: string; // e.g., 'CDB 110% CDI Itaú'
  assetType: AssetType;
  initialBalance: number; // Aporte/Saldo inicial
  color: string;
  notes?: string;
}

export type InvestmentMovementType = 'Aporte' | 'Resgate' | 'Rendimento' | 'Taxa/Custódia';

export interface InvestmentTransaction {
  id: string;
  investmentId: string;
  date: string; // YYYY-MM-DD
  type: InvestmentMovementType;
  amount: number; // positive for Aporte/Rendimento, negative for Resgate/Taxa
  notes?: string;
}

export interface OpenFinanceConnection {
  id: string;
  institutionCode: string;
  institutionName: string;
  logoColor: string;
  status: 'CONECTADO' | 'PENDENTE' | 'ERRO' | 'SINCRONIZANDO';
  lastSync: string;
  accountsLinkedCount: number;
  consentExpiresAt: string;
}

export interface ParsedStatementItem {
  id: string;
  date: string;
  description: string;
  amount: number;
  isExpense: boolean;
  category: TransactionCategory;
  type: TransactionType;
  currentInstallment?: number;
  totalInstallments?: number;
  invoiceMonth?: string;
  selectedTargetId?: string; // accountId or cardId or investmentId
}

export type PaymentStatus = 'Pendente' | 'Pago' | 'Em Aberto';

export interface FuturePayment {
  id: string;
  dueDate: string; // YYYY-MM-DD
  description: string;
  expectedAmount: number;
  category: TransactionCategory;
  notes?: string;
  status: PaymentStatus;
  paymentDate?: string; // YYYY-MM-DD (when paid)
  paidAmount?: number; // actual amount paid
  paidBankAccountId?: string; // bank account used for payment
}

export type NotificationChannel = 'email' | 'webhook' | 'browser' | 'in_app';
export type WebhookFormat = 'generic_json' | 'discord' | 'slack' | 'telegram';

export interface NotificationSettings {
  enabled: boolean;
  anticipationDays: number; // default: 3 (< 3 dias)
  alertOverdue: boolean;
  alertCardInvoices: boolean;
  // Email Channel
  emailEnabled: boolean;
  emailAddress: string;
  emailSecondary?: string;
  emailFrequency: 'instant' | 'daily' | 'on_open';
  // Webhook Channel
  webhookEnabled: boolean;
  webhookUrl: string;
  webhookFormat: WebhookFormat;
  webhookAuthToken?: string;
  // Browser & In-App
  browserPushEnabled: boolean;
  inAppSoundEnabled: boolean;
  // Automation
  autoCheckOnAppOpen: boolean;
  checkIntervalMinutes: number;
  lastCheckAt?: string;
}

export interface NotificationLog {
  id: string;
  timestamp: string; // ISO string
  channel: NotificationChannel | 'manual';
  recipient: string;
  title: string;
  message: string;
  paymentsCount: number;
  totalAmount: number;
  status: 'success' | 'warning' | 'error';
  httpStatus?: number;
  responseMessage?: string;
  details?: Array<{
    description: string;
    dueDate: string;
    amount: number;
    daysLeft: number;
    isOverdue: boolean;
  }>;
}

export interface CategoryItem {
  id: string;
  name: string;
  type: 'Despesa' | 'Receita' | 'Ambos';
  color: string;
  description?: string;
  isSystem?: boolean;
}

export type ActiveTab =
  | 'dashboard'
  | 'accounts'
  | 'cards'
  | 'investments'
  | 'future-payments'
  | 'smart-reader'
  | 'open-finance'
  | 'notifications'
  | 'categories'
  | 'settings';
