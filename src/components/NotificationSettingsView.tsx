import React, { useState } from 'react';
import { FuturePayment, NotificationSettings, NotificationLog, WebhookFormat } from '../types';
import {
  getUpcomingBillsAlerts,
  buildWebhookPayload,
  dispatchWebhookAlert,
  dispatchEmailAlert,
  generateEmailHtmlPreview,
  PendingAlertItem,
} from '../services/reminderService';
import { formatCurrency, formatDateBR } from '../utils/financeUtils';
import {
  Bell,
  BellRing,
  Mail,
  Webhook,
  Send,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Settings2,
  Trash2,
  ExternalLink,
  Code2,
  Eye,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Zap,
  Info,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface NotificationSettingsViewProps {
  settings: NotificationSettings;
  onUpdateSettings: (newSettings: NotificationSettings) => void;
  logs: NotificationLog[];
  onAddLog: (log: NotificationLog) => void;
  onClearLogs: () => void;
  futurePayments: FuturePayment[];
  onNavigateToPayments?: () => void;
}

export const NotificationSettingsView: React.FC<NotificationSettingsViewProps> = ({
  settings,
  onUpdateSettings,
  logs,
  onAddLog,
  onClearLogs,
  futurePayments,
  onNavigateToPayments,
}) => {
  // Local form state
  const [formData, setFormData] = useState<NotificationSettings>(settings);
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Testing actions feedback
  const [isTestingWebhook, setIsTestingWebhook] = useState(false);
  const [isTestingEmail, setIsTestingEmail] = useState(false);
  const [isManualTriggering, setIsManualTriggering] = useState(false);
  const [lastActionMessage, setLastActionMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
  } | null>(null);

  // Modal for Email preview
  const [showEmailPreviewModal, setShowEmailPreviewModal] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Current active alerts based on current settings
  const currentAlerts: PendingAlertItem[] = getUpcomingBillsAlerts(futurePayments, formData);
  const totalAlertsAmount = currentAlerts.reduce((acc, curr) => acc + curr.amount, 0);

  // Payload sample for preview
  const samplePayload = buildWebhookPayload(
    currentAlerts.length > 0
      ? currentAlerts
      : [
          {
            id: 'sample_1',
            description: 'BOLETO - INTERNET FIBRA',
            dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
            amount: 149.9,
            category: 'Serviços',
            daysLeft: 2,
            isOverdue: false,
          },
          {
            id: 'sample_2',
            description: 'CONDOMÍNIO RESIDENCIAL',
            dueDate: new Date().toISOString().split('T')[0],
            amount: 620.0,
            category: 'Moradia',
            daysLeft: 0,
            isOverdue: false,
          },
        ],
    formData
  );

  const handleSave = (newSettings?: NotificationSettings) => {
    const toSave = newSettings || formData;
    setIsSaving(true);
    onUpdateSettings(toSave);
    setTimeout(() => {
      setIsSaving(false);
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 3000);
    }, 300);
  };

  const handleFieldChange = <K extends keyof NotificationSettings>(
    key: K,
    value: NotificationSettings[K]
  ) => {
    const updated = { ...formData, [key]: value };
    setFormData(updated);
    handleSave(updated);
  };

  // Test Webhook Action
  const handleTestWebhook = async () => {
    if (!formData.webhookUrl) {
      setLastActionMessage({
        type: 'error',
        text: 'Por favor, insira a URL do Webhook antes de disparar o teste.',
      });
      return;
    }

    setIsTestingWebhook(true);
    setLastActionMessage(null);

    try {
      const logResult = await dispatchWebhookAlert(
        formData,
        currentAlerts.length > 0
          ? currentAlerts
          : [
              {
                id: 'sample_test',
                description: 'CONTA DE TESTE FINFLOW',
                dueDate: new Date().toISOString().split('T')[0],
                amount: 125.5,
                category: 'Serviços',
                daysLeft: 1,
                isOverdue: false,
              },
            ]
      );

      onAddLog(logResult);
      setLastActionMessage({
        type: logResult.status === 'error' ? 'error' : 'success',
        text: `Webhook disparado com sucesso! Código HTTP ${logResult.httpStatus || 200}. Verifique o canal de destino.`,
      });
    } catch (err: any) {
      setLastActionMessage({
        type: 'error',
        text: `Erro ao enviar Webhook: ${err?.message || 'Falha na requisição'}`,
      });
    } finally {
      setIsTestingWebhook(false);
    }
  };

  // Test Email Action
  const handleTestEmail = async () => {
    if (!formData.emailAddress) {
      setLastActionMessage({
        type: 'error',
        text: 'Por favor, insira um endereço de e-mail válido.',
      });
      return;
    }

    setIsTestingEmail(true);
    setLastActionMessage(null);

    try {
      const logResult = await dispatchEmailAlert(
        formData,
        currentAlerts.length > 0
          ? currentAlerts
          : [
              {
                id: 'sample_test',
                description: 'BOLETO DE TESTE FINFLOW',
                dueDate: new Date().toISOString().split('T')[0],
                amount: 250.0,
                category: 'Educação',
                daysLeft: 2,
                isOverdue: false,
              },
            ]
      );

      onAddLog(logResult);
      setLastActionMessage({
        type: 'success',
        text: `Simulação de e-mail enviada para ${formData.emailAddress}! Resumo formatado com layout bancário.`,
      });
    } catch (err: any) {
      setLastActionMessage({
        type: 'error',
        text: `Erro ao enviar e-mail: ${err?.message || 'Falha'}`,
      });
    } finally {
      setIsTestingEmail(false);
    }
  };

  // Manual Full Check and Trigger
  const handleRunFullCheck = async () => {
    setIsManualTriggering(true);
    setLastActionMessage(null);

    try {
      let dispatchedCount = 0;

      if (formData.webhookEnabled && formData.webhookUrl && currentAlerts.length > 0) {
        const webhookLog = await dispatchWebhookAlert(formData, currentAlerts);
        onAddLog(webhookLog);
        dispatchedCount++;
      }

      if (formData.emailEnabled && formData.emailAddress && currentAlerts.length > 0) {
        const emailLog = await dispatchEmailAlert(formData, currentAlerts);
        onAddLog(emailLog);
        dispatchedCount++;
      }

      // Log manual check
      const manualLog: NotificationLog = {
        id: `log_manual_${Date.now()}`,
        timestamp: new Date().toISOString(),
        channel: 'manual',
        recipient: 'Verificação Manual do Usuário',
        title: `🔍 Verificação de Vencimentos: ${currentAlerts.length} conta(s) avaliadas`,
        message: `Varredura manual concluída. ${currentAlerts.length} conta(s) com vencimento em menos de ${formData.anticipationDays} dias encontradas.`,
        paymentsCount: currentAlerts.length,
        totalAmount: totalAlertsAmount,
        status: 'success',
        httpStatus: 200,
        responseMessage: `${dispatchedCount} canais de alerta foram acionados.`,
        details: currentAlerts.map((a) => ({
          description: a.description,
          dueDate: a.dueDate,
          amount: a.amount,
          daysLeft: a.daysLeft,
          isOverdue: a.isOverdue,
        })),
      };
      onAddLog(manualLog);

      setLastActionMessage({
        type: 'success',
        text: `Verificação manual concluída! ${currentAlerts.length} conta(s) identificadas somando ${formatCurrency(totalAlertsAmount)}.`,
      });
    } catch (err: any) {
      setLastActionMessage({
        type: 'error',
        text: `Erro durante a verificação: ${err?.message || 'Falha'}`,
      });
    } finally {
      setIsManualTriggering(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header Card */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50 relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="p-2 bg-indigo-500/20 border border-indigo-500/40 rounded-xl text-indigo-300">
                <BellRing className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                Serviço de Automação & Alertas
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Lembretes Automáticos de Vencimento
            </h1>
            <p className="text-slate-300 text-sm max-w-2xl mt-1">
              Monitore contas a pagar com vencimento em <strong>menos de 3 dias</strong> e receba
              notificações automáticas via E-mail ou Webhook (Discord, Slack, Zapier, Make).
            </p>
          </div>

          {/* Quick Actions & Status Toggle */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => handleFieldChange('enabled', !formData.enabled)}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-2xl text-xs font-extrabold transition-all shadow-md ${
                formData.enabled
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-emerald-500/20'
                  : 'bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700'
              }`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  formData.enabled ? 'bg-slate-950 animate-ping' : 'bg-slate-500'
                }`}
              />
              <span>{formData.enabled ? 'MONITORAMENTO ATIVO' : 'MONITORAMENTO PAUSADO'}</span>
            </button>

            <button
              onClick={handleRunFullCheck}
              disabled={isManualTriggering}
              className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isManualTriggering ? 'animate-spin' : ''}`} />
              <span>{isManualTriggering ? 'Verificando...' : 'Verificar e Disparar Agora'}</span>
            </button>
          </div>
        </div>

        {/* Live Feedback Toast */}
        {lastActionMessage && (
          <div
            className={`mt-4 p-3.5 rounded-2xl text-xs font-semibold flex items-center justify-between transition-all animate-in fade-in slide-in-from-top-2 ${
              lastActionMessage.type === 'success'
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-500/20 border border-rose-500/40 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {lastActionMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{lastActionMessage.text}</span>
            </div>
            <button
              onClick={() => setLastActionMessage(null)}
              className="text-slate-400 hover:text-white ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Real-Time Monitored Bills (< 3 days) Overview Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-2xl ${
                currentAlerts.length > 0
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
              }`}
            >
              {currentAlerts.length > 0 ? (
                <AlertTriangle className="w-6 h-6 animate-bounce" />
              ) : (
                <CheckCircle2 className="w-6 h-6" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                  Contas em Alerta Iminente (Vencimento &lt; {formData.anticipationDays} dias)
                </h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-black ${
                    currentAlerts.length > 0
                      ? 'bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                      : 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {currentAlerts.length} {currentAlerts.length === 1 ? 'conta' : 'contas'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {currentAlerts.length > 0
                  ? `Total de ${formatCurrency(totalAlertsAmount)} aguardando pagamento ou liquidação.`
                  : 'Nenhuma conta pendente ou vencendo no período configurado. Tudo em dia!'}
              </p>
            </div>
          </div>

          {onNavigateToPayments && (
            <button
              onClick={onNavigateToPayments}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-all"
            >
              <span>Ver Tela de Contas a Pagar</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Monitored List */}
        {currentAlerts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 mt-5">
            {currentAlerts.map((item) => (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.isOverdue
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-200 dark:border-red-900/50'
                    : item.daysLeft === 0
                    ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                    : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      item.isOverdue
                        ? 'bg-red-600 text-white'
                        : item.daysLeft === 0
                        ? 'bg-amber-500 text-slate-950 font-black'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {item.isOverdue
                      ? `Vencida (${Math.abs(item.daysLeft)}d atrás)`
                      : item.daysLeft === 0
                      ? 'Vence Hoje!'
                      : `Vence em ${item.daysLeft} ${item.daysLeft === 1 ? 'dia' : 'dias'}`}
                  </span>
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {formatDateBR(item.dueDate)}
                  </span>
                </div>

                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 truncate mb-1">
                  {item.description}
                </h4>
                <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-200/60 dark:border-slate-700/60">
                  <span className="text-xs text-slate-500 dark:text-slate-400">{item.category}</span>
                  <span className="text-base font-black text-red-600 dark:text-red-500">
                    -{formatCurrency(item.amount)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
            Nenhum compromisso financeiro pendente dentro da janela de alerta ({formData.anticipationDays} dias).
          </div>
        )}
      </div>

      {/* Main Configuration Grid: Email, Webhook, and Rules */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Configuração de E-mail */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-2xl">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Notificações por E-mail
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Receba resumos diários de contas a pagar
                  </p>
                </div>
              </div>

              {/* Channel Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.emailEnabled}
                  onChange={(e) => handleFieldChange('emailEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>

            <div className="space-y-4">
              {/* Primary Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Principal para Alertas *
                </label>
                <input
                  type="email"
                  value={formData.emailAddress}
                  onChange={(e) => handleFieldChange('emailAddress', e.target.value)}
                  placeholder="exemplo@empresa.com.br"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              {/* Secondary Email */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  E-mail Secundário (Cópia Opcional)
                </label>
                <input
                  type="email"
                  value={formData.emailSecondary || ''}
                  onChange={(e) => handleFieldChange('emailSecondary', e.target.value)}
                  placeholder="financeiro2@empresa.com.br"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                />
              </div>

              {/* Frequency */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Frequência de Envio
                </label>
                <select
                  value={formData.emailFrequency}
                  onChange={(e) =>
                    handleFieldChange(
                      'emailFrequency',
                      e.target.value as 'instant' | 'daily' | 'on_open'
                    )
                  }
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                >
                  <option value="daily">Diário (Resumo consolidado matinal)</option>
                  <option value="on_open">Ao Iniciar a Sessão do Aplicativo</option>
                  <option value="instant">Imediato (ao cadastrar ou aproximar de 3 dias)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Email Action Buttons */}
          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleTestEmail}
              disabled={isTestingEmail || !formData.emailAddress}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20 disabled:opacity-50"
            >
              <Send className={`w-3.5 h-3.5 ${isTestingEmail ? 'animate-bounce' : ''}`} />
              <span>{isTestingEmail ? 'Disparando...' : 'Testar Envio de E-mail'}</span>
            </button>

            <button
              onClick={() => setShowEmailPreviewModal(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold transition-all"
              title="Visualizar modelo HTML do e-mail"
            >
              <Eye className="w-4 h-4" />
              <span>Ver Prévia HTML</span>
            </button>
          </div>
        </div>

        {/* Card 2: Configuração de Webhook */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 rounded-2xl">
                  <Webhook className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                    Integração via Webhook
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Discord, Slack, Zapier, Make, n8n ou API REST
                  </p>
                </div>
              </div>

              {/* Webhook Toggle */}
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.webhookEnabled}
                  onChange={(e) => handleFieldChange('webhookEnabled', e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
              </label>
            </div>

            <div className="space-y-4">
              {/* Webhook URL */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  URL do Webhook Endpoint *
                </label>
                <input
                  type="url"
                  value={formData.webhookUrl}
                  onChange={(e) => handleFieldChange('webhookUrl', e.target.value)}
                  placeholder="https://discord.com/api/webhooks/... ou https://hooks.slack.com/..."
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                />
              </div>

              {/* Format Selector */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Formato de Payload do Destino
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'discord', label: 'Discord', icon: '🎮' },
                    { id: 'slack', label: 'Slack', icon: '💬' },
                    { id: 'generic_json', label: 'JSON REST', icon: '⚡' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      type="button"
                      onClick={() => handleFieldChange('webhookFormat', fmt.id as WebhookFormat)}
                      className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all border ${
                        formData.webhookFormat === fmt.id
                          ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                          : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-purple-300'
                      }`}
                    >
                      <span>{fmt.icon}</span>
                      <span>{fmt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bearer Token (Optional) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
                  Token Bearer de Autorização (Opcional)
                </label>
                <input
                  type="password"
                  value={formData.webhookAuthToken || ''}
                  onChange={(e) => handleFieldChange('webhookAuthToken', e.target.value)}
                  placeholder="Bearer token para APIs protegidas"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-900 dark:text-slate-100 font-mono text-xs focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {/* Webhook Action Buttons */}
          <div className="flex items-center gap-3 pt-6 mt-6 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleTestWebhook}
              disabled={isTestingWebhook || !formData.webhookUrl}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 active:scale-95 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-purple-600/20 disabled:opacity-50"
            >
              <Zap className={`w-3.5 h-3.5 ${isTestingWebhook ? 'animate-spin' : ''}`} />
              <span>{isTestingWebhook ? 'Enviando...' : 'Testar Webhook Agora'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Rules & Anticipation Settings */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-2xl">
            <Settings2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
              Regras e Critérios de Antecedência
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Defina quando e quais compromissos devem acionar o serviço de lembrete
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Anticipation Days */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
              Janela de Antecedência do Alerta
            </label>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 5, 7].map((days) => (
                <button
                  key={days}
                  type="button"
                  onClick={() => handleFieldChange('anticipationDays', days)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    formData.anticipationDays === days
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {days}d
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
              Padrão: <strong>3 dias</strong> antes do vencimento.
            </p>
          </div>

          {/* Overdue Trigger */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Incluir Contas Vencidas
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Alerta contínuo até que a conta seja dada como paga
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.alertOverdue}
                onChange={(e) => handleFieldChange('alertOverdue', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          {/* Auto Check on Open */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
            <div>
              <span className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                Checagem Automática ao Abrir
              </span>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Verifica pendências e despacha alertas ao iniciar o FinFlow
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.autoCheckOnAppOpen}
                onChange={(e) => handleFieldChange('autoCheckOnAppOpen', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Dispatched Logs & History Card */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Histórico de Alertas & Lembretes Disparados
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Registro de envios com status HTTP e auditoria
              </p>
            </div>
          </div>

          {logs.length > 0 && (
            <button
              onClick={onClearLogs}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-red-600 dark:hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Limpar Histórico</span>
            </button>
          )}
        </div>

        {logs.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Data/Hora</th>
                  <th className="py-2.5 px-3">Canal</th>
                  <th className="py-2.5 px-3">Destinatário</th>
                  <th className="py-2.5 px-3">Contas</th>
                  <th className="py-2.5 px-3 text-right">Valor Total</th>
                  <th className="py-2.5 px-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                          log.channel === 'webhook'
                            ? 'bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400'
                            : log.channel === 'email'
                            ? 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        {log.channel === 'webhook' ? (
                          <Webhook className="w-3 h-3" />
                        ) : log.channel === 'email' ? (
                          <Mail className="w-3 h-3" />
                        ) : (
                          <RefreshCw className="w-3 h-3" />
                        )}
                        <span className="uppercase">{log.channel}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300 max-w-xs truncate">
                      {log.recipient}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-200">
                      {log.paymentsCount}
                    </td>
                    <td className="py-3 px-3 text-right font-black text-red-600 dark:text-red-400">
                      {formatCurrency(log.totalAmount)}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                          log.status === 'success'
                            ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300'
                            : log.status === 'warning'
                            ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {log.status === 'success' ? 'ENTREGUE' : log.status === 'warning' ? 'AVISO' : 'FALHA'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
            Nenhum disparo registrado até o momento.
          </div>
        )}
      </div>

      {/* Modal: Preview of Email HTML */}
      {showEmailPreviewModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2.5">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-slate-100">
                  Modelo de E-mail de Alerta (Visualização HTML)
                </h3>
              </div>
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto bg-slate-100 dark:bg-slate-950 flex-1">
              <div
                dangerouslySetInnerHTML={{
                  __html: generateEmailHtmlPreview(formData, currentAlerts),
                }}
              />
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end">
              <button
                onClick={() => setShowEmailPreviewModal(false)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold"
              >
                Fechar Prévia
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
