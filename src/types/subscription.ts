export type SubscriptionPlanId = 'FREE' | 'PRO_MENSAL' | 'PRO_ANUAL' | 'ENTERPRISE';

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'TRIAL'
  | 'PENDING'
  | 'PAST_DUE'
  | 'CANCELED'
  | 'INACTIVE';

export type PaymentBillingType = 'PIX' | 'CREDIT_CARD' | 'BOLETO';

export interface PlanLimits {
  maxAccounts: number;
  maxCards: number;
  maxMonthlyTransactions: number;
  allowAdvancedAI: boolean;
  allowExecutiveExport: boolean;
  allowMultiUser: boolean;
  allowAuditSecurity: boolean;
  allowUnlimitedCategories: boolean;
  supportPriority: 'Normal' | 'Prioritário' | 'WhatsApp VIP Dedicado';
}

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  name: string;
  tagline: string;
  price: number;
  monthlyEquivalent: number;
  interval: 'month' | 'year' | 'lifetime';
  description: string;
  popular?: boolean;
  discountTag?: string;
  features: string[];
  limits: PlanLimits;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionPlanId, SubscriptionPlan> = {
  FREE: {
    id: 'FREE',
    name: 'Plano Grátis',
    tagline: 'Ideal para controle financeiro pessoal básico',
    price: 0,
    monthlyEquivalent: 0,
    interval: 'month',
    description: 'Acesso às funcionalidades essenciais de controle de gastos e receitas.',
    popular: false,
    features: [
      'Até 2 Contas Bancárias',
      'Até 2 Cartões de Crédito',
      'Até 30 lançamentos por mês',
      'Dashboard com saldo e gráficos essenciais',
      'Controle de Dívidas e Empréstimos básico',
      'Importação manual de extratos',
      'Suporte via FAQ e Comunidade',
    ],
    limits: {
      maxAccounts: 2,
      maxCards: 2,
      maxMonthlyTransactions: 30,
      allowAdvancedAI: false,
      allowExecutiveExport: false,
      allowMultiUser: false,
      allowAuditSecurity: false,
      allowUnlimitedCategories: false,
      supportPriority: 'Normal',
    },
  },
  PRO_MENSAL: {
    id: 'PRO_MENSAL',
    name: 'FinFlow PRO Mensal',
    tagline: 'Controle financeiro total sem limites para pessoas e empresas',
    price: 39.9,
    monthlyEquivalent: 39.9,
    interval: 'month',
    description: 'Acesso irrestrito a todos os recursos profissionais, IA e relatórios.',
    popular: true,
    discountTag: 'Mais Popular',
    features: [
      'Contas Bancárias ILIMITADAS',
      'Cartões de Crédito ILIMITADOS',
      'Lançamentos e transações ILIMITADOS',
      'Leitor Inteligente com IA Gemini sem limites',
      'Exportação Executiva em PDF de Alta Resolução e Excel',
      'Auditoria de Segurança, DRE e Fluxo de Caixa Avançado',
      'Contas a Pagar/Receber com Alertas Automáticos',
      'Investimentos & Open Finance integrados',
      'Suporte VIP Direto no WhatsApp com Atendimento Dedicado',
    ],

    limits: {
      maxAccounts: 9999,
      maxCards: 9999,
      maxMonthlyTransactions: 999999,
      allowAdvancedAI: true,
      allowExecutiveExport: true,
      allowMultiUser: true,
      allowAuditSecurity: true,
      allowUnlimitedCategories: true,
      supportPriority: 'Prioritário',
    },
  },
  PRO_ANUAL: {
    id: 'PRO_ANUAL',
    name: 'FinFlow PRO Anual',
    tagline: 'A melhor economia com 2 meses grátis (27% OFF)',
    price: 349.9,
    monthlyEquivalent: 29.15,
    interval: 'year',
    description: 'Todos os benefícios do PRO com desconto exclusivo cobrado anualmente.',
    popular: false,
    discountTag: 'Economize R$ 128,90 / ano',
    features: [
      'Todos os recursos do Plano PRO',
      'Economia de R$ 128,90 comparado ao mensal',
      'Preço equivalente a apenas R$ 29,15/mês',
      'Acesso antecipado a novas automações e IAs',
      'Backup automático em nuvem Firestore prioritário',
      'Suporte VIP Direto no WhatsApp com tempo de resposta garantido',
    ],
    limits: {
      maxAccounts: 9999,
      maxCards: 9999,
      maxMonthlyTransactions: 999999,
      allowAdvancedAI: true,
      allowExecutiveExport: true,
      allowMultiUser: true,
      allowAuditSecurity: true,
      allowUnlimitedCategories: true,
      supportPriority: 'WhatsApp VIP Dedicado',
    },
  },
  ENTERPRISE: {
    id: 'ENTERPRISE',
    name: 'Enterprise / BPO',
    tagline: 'Para escritórios contábeis, BPO financeiro e multi-CNPJs',
    price: 119.9,
    monthlyEquivalent: 119.9,
    interval: 'month',
    description: 'Ambiente multiempresa com múltiplos CNPJs e usuários colaboradores.',
    popular: false,
    features: [
      'Tudo do PRO + Multiempresas e CNPJs',
      'Painel de Gestão para até 10 clientes/empresas',
      'Membros da equipe com controle de acessos (RBAC)',
      'Relatórios com logomarca personalizada',
      'Treinamento de equipe e Onboarding guiado',
      'Canal de Atendimento no WhatsApp exclusivo para a empresa',
    ],
    limits: {
      maxAccounts: 99999,
      maxCards: 99999,
      maxMonthlyTransactions: 9999999,
      allowAdvancedAI: true,
      allowExecutiveExport: true,
      allowMultiUser: true,
      allowAuditSecurity: true,
      allowUnlimitedCategories: true,
      supportPriority: 'WhatsApp VIP Dedicado',
    },
  },
};

export interface UserSubscriptionState {
  userId: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  startedAt: string;
  expiresAt: string;
  autoRenew: boolean;
  asaasCustomerId?: string;
  asaasSubscriptionId?: string;
  asaasPaymentId?: string;
  paymentMethod?: PaymentBillingType;
  lastPaymentAmount?: number;
  lastPaymentDate?: string;
  invoiceUrl?: string;
  pixQrCodeBase64?: string;
  pixCopyPaste?: string;
  pixExpirationDate?: string;
}

export interface AsaasCheckoutRequest {
  userId: string;
  userEmail: string;
  userName: string;
  userCpfCnpj?: string;
  userPhone?: string;
  planId: SubscriptionPlanId;
  billingType: PaymentBillingType;
  creditCard?: {
    holderName: string;
    number: string;
    expiryMonth: string;
    expiryYear: string;
    ccv: string;
  };
  creditCardHolderInfo?: {
    name: string;
    email: string;
    cpfCnpj: string;
    postalCode: string;
    addressNumber: string;
    phone: string;
  };
}

export interface AsaasCheckoutResponse {
  success: boolean;
  message?: string;
  planId: SubscriptionPlanId;
  status: SubscriptionStatus;
  paymentId?: string;
  subscriptionId?: string;
  customerId?: string;
  billingType: PaymentBillingType;
  value: number;
  dueDate: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  pixQrCode?: {
    encodedImage: string;
    payload: string;
    expirationDate: string;
  };
}

export interface AsaasConfig {
  apiKey: string;
  environment: 'sandbox' | 'production';
  walletId?: string;
  webhookToken?: string;
  updatedAt?: string;
}
