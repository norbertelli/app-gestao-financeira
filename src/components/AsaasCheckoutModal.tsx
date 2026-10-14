import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  QrCode,
  FileText,
  CheckCircle2,
  Copy,
  Check,
  ShieldCheck,
  AlertCircle,
  Loader2,
  Sparkles,
  ExternalLink,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  PaymentBillingType,
  AsaasCheckoutResponse,
} from '../types/subscription';
import { useSubscription } from '../context/SubscriptionContext';
import { checkAsaasPaymentStatus } from '../services/asaasService';
import { useAuth } from '../context/AuthContext';

interface AsaasCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  planId: SubscriptionPlanId;
  onSuccess?: () => void;
}

export const AsaasCheckoutModal: React.FC<AsaasCheckoutModalProps> = ({
  isOpen,
  onClose,
  planId,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { checkoutPlan, simulateActivatePro, refreshSubscription } = useSubscription();
  const plan = SUBSCRIPTION_PLANS[planId] || SUBSCRIPTION_PLANS.PRO_MENSAL;

  const [billingType, setBillingType] = useState<PaymentBillingType>('PIX');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Checkout Result state
  const [checkoutResult, setCheckoutResult] = useState<AsaasCheckoutResponse | null>(null);
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);

  // Form Fields
  const [cpfCnpj, setCpfCnpj] = useState('');
  const [phone, setPhone] = useState('11932058703');
  
  // Credit Card fields

  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState(user?.displayName || '');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  // Reset when modal opens
  useEffect(() => {
    if (isOpen) {
      setError(null);
      setCheckoutResult(null);
      setIsPaidSuccess(false);
      setCopied(false);
    }
  }, [isOpen, planId]);

  // Polling for PIX payment confirmation
  useEffect(() => {
    if (!checkoutResult || checkoutResult.billingType !== 'PIX' || isPaidSuccess || !user) {
      return;
    }

    const interval = setInterval(async () => {
      if (checkoutResult.paymentId) {
        try {
          const res = await checkAsaasPaymentStatus(user.uid, checkoutResult.paymentId);
          if (res.isPaid) {
            setIsPaidSuccess(true);
            await refreshSubscription();
            if (onSuccess) onSuccess();
          }
        } catch (e) {
          console.warn('Polling check error:', e);
        }
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [checkoutResult, isPaidSuccess, user, onSuccess, refreshSubscription]);

  if (!isOpen) return null;

  const handleStartCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const expiryParts = cardExpiry.split('/');
      const month = expiryParts[0]?.trim() || '12';
      const year = expiryParts[1]?.trim() || '2028';

      const res = await checkoutPlan({
        planId,
        billingType,
        userCpfCnpj: cpfCnpj.trim() || '000.000.000-00',
        userPhone: phone.trim() || '11932058703',
        creditCard:
          billingType === 'CREDIT_CARD'
            ? {
                holderName: cardHolder.trim() || 'NOME DO TITULAR',
                number: cardNumber.replace(/\s+/g, ''),
                expiryMonth: month,
                expiryYear: year.length === 2 ? `20${year}` : year,
                ccv: cardCvv.trim(),
              }
            : undefined,
        creditCardHolderInfo:
          billingType === 'CREDIT_CARD'
            ? {
                name: cardHolder.trim() || 'NOME DO TITULAR',
                email: user?.email || 'contato@finflow.app',
                cpfCnpj: cpfCnpj.trim() || '000.000.000-00',
                postalCode: '01310-100',
                addressNumber: '100',
                phone: phone.trim() || '11932058703',
              }
            : undefined,

      });

      setCheckoutResult(res);

      if (res.status === 'ACTIVE') {
        setIsPaidSuccess(true);
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      console.error('Erro no checkout:', err);
      setError(err.message || 'Falha ao processar checkout no Asaas.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPix = () => {
    if (checkoutResult?.pixQrCode?.payload) {
      navigator.clipboard.writeText(checkoutResult.pixQrCode.payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSimulateInstantPixPayment = async () => {
    setLoading(true);
    try {
      await simulateActivatePro();
      setIsPaidSuccess(true);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError('Erro ao simular pagamento: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white">
                  Checkout Asaas Pagamentos
                </h3>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  100% Seguro
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Assinatura: <strong className="text-indigo-300">{plan.name}</strong> •{' '}
                <span className="text-emerald-400 font-bold">
                  R$ {plan.price.toFixed(2).replace('.', ',')}
                  {plan.interval === 'year' ? '/ano' : '/mês'}
                </span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-slate-200">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-2xl flex items-start gap-2.5 text-xs text-red-200">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {isPaidSuccess ? (
            /* Success State */
            <div className="text-center py-8 space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20">
                <CheckCircle2 className="w-9 h-9 text-emerald-400 animate-bounce" />
              </div>
              <div className="space-y-1.5">
                <h4 className="text-xl font-extrabold text-white">
                  Pagamento Confirmado com Sucesso!
                </h4>
                <p className="text-sm text-slate-300 max-w-sm mx-auto">
                  Sua conta FinFlow foi atualizada para o <strong className="text-amber-400">{plan.name}</strong>. Todos os recursos, contas ilimitadas e auditoria avançada já estão desbloqueados!
                </p>
              </div>

              <div className="p-4 bg-slate-800/80 border border-slate-700 rounded-2xl max-w-xs mx-auto text-left space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Plano Ativo:</span>
                  <span className="font-bold text-white">{plan.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status:</span>
                  <span className="font-bold text-emerald-400">ATIVO</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Gateway:</span>
                  <span className="font-bold text-indigo-300">Asaas Pagamentos</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.01]"
              >
                Acessar Recursos PRO Agora
              </button>
            </div>
          ) : checkoutResult && checkoutResult.billingType === 'PIX' ? (
            /* PIX Generated View */
            <div className="space-y-4 text-center">
              <div className="p-3 bg-indigo-950/40 border border-indigo-500/30 rounded-2xl flex items-center justify-center gap-2 text-xs text-indigo-300">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                <span>Aguardando identificação do PIX no sistema bancário...</span>
              </div>

              {/* QR Code Container */}
              <div className="bg-white p-4 rounded-3xl max-w-[240px] mx-auto shadow-2xl border-4 border-slate-800">
                {checkoutResult.pixQrCode?.encodedImage ? (
                  <img
                    src={checkoutResult.pixQrCode.encodedImage}
                    alt="PIX QR Code Asaas"
                    className="w-full h-auto rounded-lg mx-auto"
                  />
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center bg-slate-100 rounded-lg text-slate-800">
                    <QrCode className="w-32 h-32" />
                  </div>
                )}
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-1">Valor da Assinatura:</p>
                <p className="text-2xl font-black text-emerald-400">
                  R$ {checkoutResult.value.toFixed(2).replace('.', ',')}
                </p>
              </div>

              {/* Copia e Cola */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-slate-300">
                  Código PIX Copia e Cola:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    readOnly
                    value={checkoutResult.pixQrCode?.payload || ''}
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono focus:outline-none"
                  />
                  <button
                    onClick={handleCopyPix}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                    <span>{copied ? 'Copiado!' : 'Copiar'}</span>
                  </button>
                </div>
              </div>

              {/* Simulation Instant Approval Button */}
              <div className="pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={handleSimulateInstantPixPayment}
                  disabled={loading}
                  className="w-full py-2.5 px-4 bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Zap className="w-4 h-4 text-amber-400" />
                  <span>Simular Aprovação Instantânea do PIX (Teste)</span>
                </button>
                <p className="text-[10px] text-slate-500 mt-1">
                  Ambiente Asaas Sandbox: Você pode testar e ativar sem custo agora mesmo.
                </p>
              </div>
            </div>
          ) : (
            /* Initial Checkout Form: Choose method and info */
            <form onSubmit={handleStartCheckout} className="space-y-4">
              {/* Method Selector */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-2 block">
                  Selecione a forma de pagamento:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setBillingType('PIX')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      billingType === 'PIX'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-md shadow-emerald-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-emerald-400" />
                    <span>PIX Instantâneo</span>
                    <span className="text-[9px] text-emerald-400 font-extrabold bg-emerald-500/20 px-1.5 py-0.2 rounded-full">
                      Liberação Imediata
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingType('CREDIT_CARD')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      billingType === 'CREDIT_CARD'
                        ? 'bg-indigo-500/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-indigo-400" />
                    <span>Cartão de Crédito</span>
                    <span className="text-[9px] text-indigo-300 font-extrabold bg-indigo-500/20 px-1.5 py-0.2 rounded-full">
                      Recorrente
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingType('BOLETO')}
                    className={`py-3 px-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${
                      billingType === 'BOLETO'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-300 shadow-md shadow-amber-500/20'
                        : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-200'
                    }`}
                  >
                    <FileText className="w-5 h-5 text-amber-400" />
                    <span>Boleto Bancário</span>
                    <span className="text-[9px] text-amber-400 font-semibold">
                      Compensa em 1 dia
                    </span>
                  </button>
                </div>
              </div>

              {/* Payer Info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    CPF ou CNPJ
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="000.000.000-00"
                    value={cpfCnpj}
                    onChange={(e) => setCpfCnpj(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    Celular / WhatsApp
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="(11) 93205-8703"
                    value={phone}

                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Credit Card Specific Form */}
              {billingType === 'CREDIT_CARD' && (
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Número do Cartão
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="0000 0000 0000 0000"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1">
                      Nome Impresso no Cartão
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="NOME COMO NO CARTAO"
                      value={cardHolder}
                      onChange={(e) => setCardHolder(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        Validade (MM/AA)
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="12/28"
                        maxLength={5}
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1">
                        CVV
                      </label>
                      <input
                        type="password"
                        required
                        placeholder="123"
                        maxLength={4}
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div className="p-3.5 bg-slate-800/60 border border-slate-700/60 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Total a pagar:</span>
                  <span className="text-lg font-black text-white">
                    R$ {plan.price.toFixed(2).replace('.', ',')}
                    <span className="text-xs font-normal text-slate-400">
                      {plan.interval === 'year' ? ' / ano' : ' / mês'}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Garantia incondicional de 7 dias com cancelamento a 1 clique.</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-indigo-500 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Conectando ao Asaas...</span>
                  </>
                ) : (
                  <>
                    <span>
                      {billingType === 'PIX'
                        ? 'Gerar QR Code PIX'
                        : billingType === 'CREDIT_CARD'
                        ? 'Confirmar Assinatura no Cartão'
                        : 'Gerar Boleto Bancário'}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-950 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Processado com segurança pelo Gateway oficial Asaas Pagamentos S.A.</span>
        </div>
      </div>
    </div>
  );
};
