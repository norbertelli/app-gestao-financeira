import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  X,
  Sparkles,
  Zap,
  ShieldCheck,
  CreditCard,
  QrCode,
  FileText,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Settings,
  RefreshCw,
  ExternalLink,
  Lock,
  Phone,
  Building2,
  Calendar,
  Users,
  TestTube,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  AsaasConfig,
} from '../types/subscription';
import { useSubscription } from '../context/SubscriptionContext';
import { useAuth } from '../context/AuthContext';
import { AsaasCheckoutModal } from './AsaasCheckoutModal';
import { ProBadge } from './ProBadge';
import {
  getStoredAsaasConfig,
  saveAsaasConfig,
} from '../services/asaasService';
import { getAdminSupportPhone, saveAdminSupportPhone } from '../services/firebase';
import { AdminSubscribersView } from './AdminSubscribersView';

interface SubscriptionViewProps {
  onBackToDashboard?: () => void;
}

export const SubscriptionView: React.FC<SubscriptionViewProps> = ({
  onBackToDashboard,
}) => {
  const { user, isAdmin } = useAuth();
  const {
    subscription,
    currentPlan,
    isPro,
    cancelSubscription,
    simulateActivatePro,
    refreshSubscription,
  } = useSubscription();

  // Top sub-tabs: plans, test_checkout, subscribers, asaas_config
  const [activeSection, setActiveSection] = useState<'plans' | 'test_checkout' | 'subscribers' | 'asaas_config'>('plans');

  // Monthly vs Annual switcher
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  // Checkout modal
  const [selectedPlanForCheckout, setSelectedPlanForCheckout] = useState<SubscriptionPlanId | null>(null);

  // Admin Config state
  const [asaasConfig, setAsaasConfig] = useState<AsaasConfig>({
    apiKey: '',
    environment: 'sandbox',
    webhookToken: '',
  });
  const [adminPhoneInput, setAdminPhoneInput] = useState('');
  const [configSavedToast, setConfigSavedToast] = useState(false);
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Test feedback
  const [testActionSuccess, setTestActionSuccess] = useState<string | null>(null);

  const showTestFeedback = (msg: string) => {
    setTestActionSuccess(msg);
    setTimeout(() => setTestActionSuccess(null), 3500);
  };

  // Load Asaas Config and Admin Phone
  useEffect(() => {
    getStoredAsaasConfig().then((cfg) => {
      setAsaasConfig(cfg);
    });
    getAdminSupportPhone().then((phone) => {
      setAdminPhoneInput(phone);
    });
  }, []);

  const handleSaveAsaasConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    await saveAsaasConfig(asaasConfig);
    if (adminPhoneInput.trim()) {
      await saveAdminSupportPhone(adminPhoneInput.trim());
    }
    setIsSavingConfig(false);
    setConfigSavedToast(true);
    setTimeout(() => setConfigSavedToast(false), 3000);
  };

  const handleOpenCheckout = (planId: SubscriptionPlanId) => {
    if (planId === 'FREE') return;
    setSelectedPlanForCheckout(planId);
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Top Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setActiveSection('plans')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'plans'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Planos & Preços</span>
          </button>

          <button
            onClick={() => setActiveSection('test_checkout')}
            className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
              activeSection === 'test_checkout'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <TestTube className="w-4 h-4 text-emerald-400" />
            <span>Teste Prático de Checkout</span>
            <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
              Asaas
            </span>
          </button>

          {isAdmin && (
            <>
              <button
                onClick={() => setActiveSection('subscribers')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === 'subscribers'
                    ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Gestão de Assinantes</span>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  Admin
                </span>
              </button>

              <button
                onClick={() => setActiveSection('asaas_config')}
                className={`py-2 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  activeSection === 'asaas_config'
                    ? 'bg-slate-800 text-white border border-slate-600 shadow-md'
                    : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 text-indigo-400" />
                <span>Configuração Asaas & Suporte</span>
              </button>
            </>
          )}
        </div>

        {/* Current status pill */}
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center gap-2">
            <span className="text-slate-400">Status da Conta:</span>
            <span className={`font-black uppercase ${isPro ? 'text-amber-400' : 'text-slate-300'}`}>
              {currentPlan.name}
            </span>
            {isPro && <ProBadge size="xs" variant="gold" label="ATIVO" />}
          </div>
        </div>
      </div>

      {/* SECTION 1: PLANS & PRICING */}
      {activeSection === 'plans' && (
        <div className="space-y-10">
          {/* Top Banner / Hero */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950/60 to-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="max-w-3xl relative z-10 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Gateway Asaas Oficial • Pagamento 100% Seguro</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight">
                Eleve sua Gestão Financeira ao{' '}
                <span className="bg-gradient-to-r from-amber-400 via-orange-400 to-amber-300 bg-clip-text text-transparent">
                  Nível Profissional
                </span>
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Elimine limites de contas, faturas e lançamentos. Automatize a extração de extratos com IA e conte com relatórios executivos para sua vida financeira e empresarial.
              </p>
            </div>
          </div>

          {/* Billing Cycle Switcher */}
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="bg-slate-900 border border-slate-800 p-1.5 rounded-2xl inline-flex items-center shadow-lg">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`py-2 px-6 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                  billingCycle === 'monthly'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cobrança Mensal
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`py-2 px-6 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer ${
                  billingCycle === 'yearly'
                    ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span>Cobrança Anual</span>
                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 uppercase">
                  27% OFF
                </span>
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center">
              Pague com <strong>PIX Instantâneo</strong>, <strong>Cartão em até 12x</strong> ou Boleto pelo Asaas.
            </p>
          </div>

          {/* Pricing Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-stretch">
            {/* FREE CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Iniciante
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">Plano Grátis</h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Ideal para testar o sistema e controle de finanças pessoais básicas.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">R$ 0</span>
                    <span className="text-xs text-slate-400 font-semibold">/ sempre</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Sem necessidade de cartão</p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Até 2 Contas Bancárias</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Até 2 Cartões de Crédito</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Até 30 lançamentos por mês</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Dashboard essencial e Dívidas</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>Sem Leitor com IA ilimitado</span>
                  </li>
                  <li className="flex items-start gap-2.5 text-slate-500">
                    <X className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
                    <span>Sem Exportação PDF Executiva</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  disabled={subscription.planId === 'FREE'}
                  onClick={cancelSubscription}
                  className={`w-full py-3 px-4 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                    subscription.planId === 'FREE'
                      ? 'bg-slate-800 text-slate-400 cursor-default'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {subscription.planId === 'FREE' ? 'Seu Plano Atual' : 'Voltar para o Grátis'}
                </button>
              </div>
            </div>

            {/* PRO CARD (FEATURED) */}
            <div className="bg-gradient-to-b from-indigo-950/70 via-slate-900 to-slate-900 border-2 border-amber-500/50 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-2xl relative scale-[1.02]">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-500 text-slate-950 text-xs font-black uppercase tracking-wider shadow-lg shadow-amber-500/30 flex items-center gap-1.5">
                <Crown className="w-3.5 h-3.5" />
                <span>Mais Recomendado</span>
              </div>

              <div className="space-y-6">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-amber-400">
                      Profissional & Empresas
                    </span>
                    <ProBadge size="xs" variant="gold" label="PRO" />
                  </div>
                  <h3 className="text-2xl font-black text-white mt-1">
                    FinFlow PRO {billingCycle === 'yearly' ? 'Anual' : 'Mensal'}
                  </h3>
                  <p className="text-xs text-slate-300 mt-2">
                    Acesso completo e irrestrito. Para quem precisa de precisão e controle absoluto.
                  </p>
                </div>

                <div className="pt-2 border-t border-indigo-900/40">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl sm:text-5xl font-black text-white">
                      {billingCycle === 'yearly' ? 'R$ 29,15' : 'R$ 39,90'}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">/ mês</span>
                  </div>
                  <p className="text-[11px] text-amber-300 font-bold mt-1">
                    {billingCycle === 'yearly'
                      ? 'Faturado anualmente em R$ 349,90 (Economize R$ 128,90)'
                      : 'Faturamento mensal com cancelamento a qualquer momento'}
                  </p>
                </div>

                <ul className="space-y-3 text-xs text-slate-200 pt-2 border-t border-indigo-900/40">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Contas Bancárias ILIMITADAS</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Cartões de Crédito ILIMITADOS</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span><strong>Lançamentos e extratos SEM LIMITES</strong></span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Leitor Inteligente com IA Gemini sem restrição</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Exportações em PDF Executivo e Excel</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Auditoria & Teste de Segurança em Nuvem</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Suporte VIP e Dedicado via WhatsApp</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8 space-y-2">
                <button
                  onClick={() => handleOpenCheckout(billingCycle === 'yearly' ? 'PRO_ANUAL' : 'PRO_MENSAL')}
                  className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                >
                  <Crown className="w-4 h-4" />
                  <span>
                    {isPro ? 'Alterar Plano / Renovar' : 'Assinar FinFlow PRO via Asaas'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* ENTERPRISE CARD */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-xl relative">
              <div className="space-y-6">
                <div>
                  <span className="text-xs font-black uppercase tracking-wider text-indigo-400">
                    Multiempresa & BPO
                  </span>
                  <h3 className="text-2xl font-black text-white mt-1">Enterprise BPO</h3>
                  <p className="text-xs text-slate-400 mt-2">
                    Para consultores financeiros, escritórios contábeis e múltiplos CNPJs.
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-white">R$ 119,90</span>
                    <span className="text-xs text-slate-400 font-semibold">/ mês</span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">Ambiente com multi-tenancy e equipes</p>
                </div>

                <ul className="space-y-3 text-xs text-slate-300 pt-2 border-t border-slate-800/80">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Tudo do Plano PRO</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Até 10 Empresas / CNPJs separados</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Múltiplos usuários colaboradores</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Relatórios com Logomarca Customizada</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Onboarding e Treinamento Dedicado</span>
                  </li>
                </ul>
              </div>

              <div className="pt-8">
                <button
                  onClick={() => handleOpenCheckout('ENTERPRISE')}
                  className="w-full py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Assinar Plano Enterprise
                </button>
              </div>
            </div>
          </div>

          {/* Comparison Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl overflow-x-auto">
            <h3 className="text-lg font-black text-white mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <span>Comparativo Completo dos Recursos</span>
            </h3>

            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold">
                  <th className="py-3 px-4">Funcionalidade</th>
                  <th className="py-3 px-4 text-center">Plano Grátis</th>
                  <th className="py-3 px-4 text-center text-amber-400">FinFlow PRO</th>
                  <th className="py-3 px-4 text-center text-indigo-300">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Contas Bancárias</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">Até 2 Contas</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Ilimitadas</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Ilimitadas</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Cartões de Crédito</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">Até 2 Cartões</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Ilimitados</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Ilimitados</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Lançamentos / mês</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">30 / mês</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Ilimitados</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Ilimitados</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Leitor Inteligente com IA</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">Básico (Limitado)</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Gemini Ilimitado</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">Gemini Ilimitado</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Exportação Executiva em PDF</td>
                  <td className="py-3.5 px-4 text-center text-slate-500"><X className="w-4 h-4 mx-auto text-slate-600" /></td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Auditoria de Segurança & DRE</td>
                  <td className="py-3.5 px-4 text-center text-slate-500"><X className="w-4 h-4 mx-auto text-slate-600" /></td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Sincronização em Nuvem Firestore</td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                  <td className="py-3.5 px-4 text-center text-emerald-400"><Check className="w-4 h-4 mx-auto" /></td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-white">Suporte Direto no WhatsApp</td>
                  <td className="py-3.5 px-4 text-center text-slate-400">Padrão</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">VIP Dedicado</td>
                  <td className="py-3.5 px-4 text-center font-bold text-emerald-400">VIP Dedicado</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* FAQ Accordion */}
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-4">
            <h3 className="text-lg font-black text-white flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-indigo-400" />
              <span>Dúvidas Frequentes sobre a Assinatura</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white">Como funciona o pagamento via PIX?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Ao escolher o PIX, um QR Code e um código Copia e Cola são gerados instantaneamente pelo Asaas. Assim que você paga em qualquer banco, o sistema reconhece em segundos e libera o plano PRO automaticamente.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white">Posso cancelar quando quiser?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Sim! Não há fidelidade ou taxas de cancelamento. Você pode cancelar sua assinatura com apenas um clique aqui mesmo no painel ou falando com o suporte no WhatsApp.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white">O Asaas é seguro?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  O Asaas é uma instituição autorizada pelo Banco Central do Brasil com certificação PCI-DSS internacional. Seus dados financeiros são criptografados de ponta a ponta.
                </p>
              </div>

              <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-2xl space-y-1">
                <h4 className="text-xs font-bold text-white">Preciso de ajuda ou quero tirar dúvidas?</h4>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Nosso atendimento está disponível diretamente pelo canal oficial de suporte via WhatsApp a qualquer momento.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: TESTE PRÁTICO DE CHECKOUT (ASAAS TEST ENVIRONMENT) */}
      {activeSection === 'test_checkout' && (
        <div className="space-y-6">
          {testActionSuccess && (
            <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{testActionSuccess}</span>
            </div>
          )}

          <div className="bg-slate-900 border border-emerald-500/30 rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <TestTube className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black text-white">Ambiente de Teste Prático de Checkout</h3>
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      Sandbox Oficial
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Execute o fluxo de pagamento completo do Asaas (PIX, Cartão e Boleto) e valide as travas do sistema em tempo real.
                  </p>
                </div>
              </div>

              {/* Reset to Free vs Activate PRO toggle */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    await cancelSubscription();
                    showTestFeedback('Conta redefinida para o PLANO GRÁTIS! As travas de 2 contas e 2 cartões agora estão ATIVAS.');
                  }}
                  className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
                >
                  Modo Plano Grátis (Ativar Travas)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await simulateActivatePro();
                    showTestFeedback('Pagamento aprovado com sucesso! Plano PRO ativado instantaneamente.');
                  }}
                  className="py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Zap className="w-4 h-4 inline mr-1" />
                  Simular PIX Aprovado
                </button>
              </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
              {/* Test 1: PIX Flow */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <QrCode className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">1. Teste de Pagamento via PIX</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Gera um QR Code PIX visual em formato oficial BRCode do Banco Central com código Copia e Cola e simula a compensação bancária instantânea.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanForCheckout('PRO_MENSAL')}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <QrCode className="w-4 h-4" />
                  <span>Abrir Checkout PIX</span>
                </button>
              </div>

              {/* Test 2: Credit Card Flow */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center">
                    <CreditCard className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">2. Teste no Cartão de Crédito</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Simula o envio de cartão com aprovação automática da operadora no Asaas, habilitando a renovação mensal ou anual da assinatura.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPlanForCheckout('PRO_ANUAL')}
                  className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Abrir Checkout Cartão</span>
                </button>
              </div>

              {/* Test 3: Feature Gating Validation */}
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-white">3. Validação das Travas do Sistema</h4>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Com o plano Grátis ativado, tente cadastrar a 3ª conta bancária ou 3º cartão. O sistema bloqueia a ação e apresenta o convite para o PRO.
                  </p>
                </div>
                <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-slate-300 flex items-center justify-between">
                  <span>Status Atual:</span>
                  <strong className={isPro ? 'text-amber-400' : 'text-slate-400'}>
                    {isPro ? 'PRO Liberado' : 'Grátis (Travas Ativas)'}
                  </strong>
                </div>
              </div>
            </div>

            {/* Step-by-step test guide */}
            <div className="mt-8 p-5 bg-slate-950/70 border border-slate-800 rounded-2xl space-y-3">
              <h4 className="text-xs font-bold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Roteiro de Teste Recomendado:</span>
              </h4>
              <ol className="list-decimal list-inside text-xs text-slate-300 space-y-2 leading-relaxed">
                <li>
                  Clique em <strong>"Modo Plano Grátis (Ativar Travas)"</strong> acima para garantir que sua conta está no plano gratuito.
                </li>
                <li>
                  Vá na aba <strong>Contas Bancárias</strong> e tente clicar em <strong>"+ Nova Conta"</strong> quando já houver 2 contas cadastradas. O modal de trava de upgrade será acionado imediatamente.
                </li>
                <li>
                  Clique em <strong>"Abrir Checkout PIX"</strong> ou <strong>"Simular PIX Aprovado"</strong>.
                </li>
                <li>
                  Verifique que a conta passa a exibir o selo <strong>PRO ATIVO</strong> e você pode cadastrar contas e cartões ilimitados livremente.
                </li>
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 3: ADMIN SUBSCRIBERS MANAGEMENT */}
      {isAdmin && activeSection === 'subscribers' && (
        <AdminSubscribersView />
      )}

      {/* SECTION 4: ADMIN GATEWAY ASAAS & SUPPORT PHONE CONFIG */}
      {isAdmin && activeSection === 'asaas_config' && (
        <div className="bg-slate-900 border border-indigo-500/30 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <span>Configurações do Gateway Asaas & Telefone de Suporte</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300">
                  MASTER
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Altere suas credenciais de produção do Asaas e o número do WhatsApp de atendimento.
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveAsaasConfig} className="space-y-4 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Ambiente do Asaas
                </label>
                <select
                  value={asaasConfig.environment}
                  onChange={(e) =>
                    setAsaasConfig((prev) => ({
                      ...prev,
                      environment: e.target.value as 'sandbox' | 'production',
                    }))
                  }
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="sandbox">Sandbox (Ambiente de Testes / Homologação)</option>
                  <option value="production">Produção (Cobranças Reais)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300 block mb-1">
                  Telefone de Suporte WhatsApp do Administrador
                </label>
                <input
                  type="tel"
                  value={adminPhoneInput}
                  onChange={(e) => setAdminPhoneInput(e.target.value)}
                  placeholder="5511932058703"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Gravado no Firestore (`system/admin_support`). Os botões de suporte do app abrem conversa diretamente neste número.
                </p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                API Key do Asaas (access_token)
              </label>
              <input
                type="password"
                value={asaasConfig.apiKey}
                onChange={(e) =>
                  setAsaasConfig((prev) => ({ ...prev, apiKey: e.target.value }))
                }
                placeholder="$aact_YTU5YTE0M2M6N2Z..."
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Obtenha em: <em>asaas.com &gt; Configurações &gt; Integrações &gt; Gerar Chave de API</em>.
              </p>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Token do Webhook
              </label>
              <input
                type="text"
                value={asaasConfig.webhookToken || ''}
                onChange={(e) =>
                  setAsaasConfig((prev) => ({ ...prev, webhookToken: e.target.value }))
                }
                placeholder="finflow_webhook_token_secret"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="p-3 bg-slate-950 border border-slate-800 rounded-2xl text-xs space-y-1">
              <p className="text-slate-400 font-medium">URL de Webhook para cadastrar no painel do Asaas:</p>
              <p className="text-indigo-400 font-mono text-[11px] break-all">
                {typeof window !== 'undefined' ? `${window.location.origin}/api/asaas/webhook` : 'https://seuapp.vercel.app/api/asaas/webhook'}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="submit"
                disabled={isSavingConfig}
                className="py-2.5 px-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                {isSavingConfig ? 'Salvando...' : 'Salvar Configurações do Asaas & Telefone'}
              </button>

              {configSavedToast && (
                <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
                  <Check className="w-4 h-4" />
                  <span>Configurações salvas no Firestore!</span>
                </span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Checkout Modal */}
      {selectedPlanForCheckout && (
        <AsaasCheckoutModal
          isOpen={Boolean(selectedPlanForCheckout)}
          planId={selectedPlanForCheckout}
          onClose={() => setSelectedPlanForCheckout(null)}
          onSuccess={() => {
            refreshSubscription();
          }}
        />
      )}
    </div>
  );
};
