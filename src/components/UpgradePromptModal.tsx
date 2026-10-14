import React from 'react';
import {
  X,
  Crown,
  Sparkles,
  CheckCircle2,
  Lock,
  ArrowRight,
  Shield,
  Zap,
} from 'lucide-react';
import { useSubscription } from '../context/SubscriptionContext';
import { SUBSCRIPTION_PLANS } from '../types/subscription';

interface UpgradePromptModalProps {
  onNavigateToPlans: () => void;
}

export const UpgradePromptModal: React.FC<UpgradePromptModalProps> = ({
  onNavigateToPlans,
}) => {
  const {
    upgradeModal,
    closeUpgradeModal,
    currentPlan,
    simulateActivatePro,
  } = useSubscription();

  if (!upgradeModal.isOpen) return null;

  const proPlan = SUBSCRIPTION_PLANS.PRO_MENSAL;

  const handleGoToPlans = () => {
    closeUpgradeModal();
    onNavigateToPlans();
  };

  const handleInstantTest = async () => {
    await simulateActivatePro();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-amber-500/30 rounded-3xl max-w-md w-full shadow-2xl overflow-hidden relative">
        {/* Glow effect behind badge */}
        <div className="absolute -top-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-600 p-0.5 flex items-center justify-center mx-auto shadow-xl shadow-amber-500/30 mb-4 animate-bounce">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Crown className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-black tracking-wider uppercase mb-2">
            <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Recurso Exclusivo FinFlow PRO</span>
          </div>

          <h3 className="text-xl font-black text-white">
            {upgradeModal.featureTitle || 'Desbloqueie o Potencial Máximo'}
          </h3>

          <p className="text-xs text-slate-300 mt-2 leading-relaxed">
            {upgradeModal.featureDescription ||
              'Você atingiu o limite de utilização do plano gratuito. Faça upgrade para o FinFlow PRO e tenha liberdade completa sem restrições.'}
          </p>
        </div>

        {/* Benefits list */}
        <div className="px-6 py-3">
          <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Crown className="w-4 h-4 text-amber-400" />
              <span>O que está incluso no FinFlow PRO:</span>
            </p>

            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Contas bancárias e cartões <strong>ilimitados</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Lançamentos mensais <strong>sem limites</strong></span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Leitor Inteligente com IA Gemini sem restrição</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Exportações completas em PDF de Alta Resolução</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>Suporte prioritário dedicado via WhatsApp</span>
              </li>

            </ul>
          </div>
        </div>

        {/* Pricing snippet & Action Buttons */}
        <div className="p-6 pt-3 space-y-3">
          <div className="flex items-center justify-between text-xs px-2 py-1 bg-indigo-950/40 border border-indigo-500/20 rounded-xl">
            <span className="text-slate-300 font-medium">A partir de apenas:</span>
            <span className="text-emerald-400 font-black text-sm">
              R$ 29,15 / mês{' '}
              <span className="text-[10px] text-slate-400 font-normal">(no plano anual)</span>
            </span>
          </div>

          <button
            onClick={handleGoToPlans}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-black text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99]"
          >
            <Crown className="w-4 h-4 text-slate-950" />
            <span>Fazer Upgrade para o PRO</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleInstantTest}
              className="py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all"
              title="Ativa o modo PRO instantaneamente para testar o sistema"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Simular Teste PRO</span>
            </button>

            <button
              onClick={closeUpgradeModal}
              className="py-2.5 px-3 rounded-xl bg-slate-800/50 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs font-semibold transition-all"
            >
              Continuar no Grátis
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
