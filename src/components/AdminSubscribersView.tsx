import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Crown,
  CheckCircle2,
  AlertCircle,
  Clock,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  TrendingUp,
  DollarSign,
  UserCheck,
  X,
  Check,
  ArrowRight,
  Zap,
} from 'lucide-react';
import {
  SubscriberUser,
  fetchAllSubscribers,
  updateSubscriberPlan,
  updateSubscriberPhone,
  deleteSubscriber,
  getWhatsAppDirectUrl,
} from '../services/adminService';
import {
  SubscriptionPlanId,
  SUBSCRIPTION_PLANS,
  SubscriptionStatus,
} from '../types/subscription';
import { WhatsAppIcon } from './WhatsAppSupport';
import { ProBadge } from './ProBadge';

export const AdminSubscribersView: React.FC = () => {
  const [subscribers, setSubscribers] = useState<SubscriberUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlanFilter, setSelectedPlanFilter] = useState<string>('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('ALL');

  // Modals state
  const [editingPlanUser, setEditingPlanUser] = useState<SubscriberUser | null>(null);
  const [newPlanSelection, setNewPlanSelection] = useState<SubscriptionPlanId>('PRO_MENSAL');
  const [editingPhoneUser, setEditingPhoneUser] = useState<SubscriberUser | null>(null);
  const [newPhoneInput, setNewPhoneInput] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadSubscribers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllSubscribers();
      setSubscribers(data);
    } catch (e) {
      console.warn('Error loading subscribers:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSubscribers();
  }, []);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filter subscribers
  const filteredSubscribers = subscribers.filter((sub) => {
    const matchesSearch =
      searchTerm.trim() === '' ||
      sub.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (sub.phone && sub.phone.includes(searchTerm));

    const matchesPlan =
      selectedPlanFilter === 'ALL' || sub.subscriptionPlan === selectedPlanFilter;

    const matchesStatus =
      selectedStatusFilter === 'ALL' || sub.subscriptionStatus === selectedStatusFilter;

    return matchesSearch && matchesPlan && matchesStatus;
  });

  // Calculate Metrics
  const totalUsers = subscribers.length;
  const proSubscribersCount = subscribers.filter(
    (s) => s.subscriptionPlan !== 'FREE' && s.subscriptionStatus === 'ACTIVE'
  ).length;

  const totalMRR = subscribers.reduce((sum, s) => {
    if (s.subscriptionStatus !== 'ACTIVE') return sum;
    if (s.subscriptionPlan === 'PRO_MENSAL') return sum + 39.9;
    if (s.subscriptionPlan === 'PRO_ANUAL') return sum + 349.9 / 12;
    if (s.subscriptionPlan === 'ENTERPRISE') return sum + 119.9;
    return sum;
  }, 0);

  const conversionRate = totalUsers > 0 ? Math.round((proSubscribersCount / totalUsers) * 100) : 0;

  // Handlers
  const handleSavePlanChange = async () => {
    if (!editingPlanUser) return;
    await updateSubscriberPlan(editingPlanUser.userId, newPlanSelection, 'ACTIVE');
    setSubscribers((prev) =>
      prev.map((s) =>
        s.userId === editingPlanUser.userId
          ? { ...s, subscriptionPlan: newPlanSelection, subscriptionStatus: 'ACTIVE' }
          : s
      )
    );
    setEditingPlanUser(null);
    showToast(`Plano de ${editingPlanUser.displayName} atualizado para ${SUBSCRIPTION_PLANS[newPlanSelection]?.name}!`);
  };

  const handleSavePhoneChange = async () => {
    if (!editingPhoneUser) return;
    await updateSubscriberPhone(editingPhoneUser.userId, newPhoneInput);
    setSubscribers((prev) =>
      prev.map((s) =>
        s.userId === editingPhoneUser.userId ? { ...s, phone: newPhoneInput.trim() } : s
      )
    );
    setEditingPhoneUser(null);
    showToast(`Telefone de ${editingPhoneUser.displayName} atualizado com sucesso!`);
  };

  const handleDeleteUser = async (userToDelete: SubscriberUser) => {
    if (confirm(`Deseja realmente remover o usuário "${userToDelete.displayName}"?`)) {
      await deleteSubscriber(userToDelete.userId);
      setSubscribers((prev) => prev.filter((s) => s.userId !== userToDelete.userId));
      showToast(`Usuário removido.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-emerald-600 text-white rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-bold animate-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 text-xs font-black uppercase tracking-wider mb-2">
            <Users className="w-3.5 h-3.5 text-indigo-400" />
            <span>Módulo de Gestão de Clientes & Assinaturas</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Painel de Assinantes & Clientes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Gerencie planos, dados de contato, contate clientes via WhatsApp e conceda acessos PRO manuais.
          </p>
        </div>

        <button
          onClick={loadSubscribers}
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-800 text-white font-bold text-xs rounded-xl border border-slate-700 transition-all cursor-pointer self-start md:self-center"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Atualizar Lista</span>
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total de Usuários</span>
            <div className="p-2 bg-indigo-950/60 text-indigo-400 rounded-xl">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{totalUsers}</div>
          <p className="text-[11px] text-slate-500 mt-1">Cadastrados no banco Firestore</p>
        </div>

        {/* Pro Subscribers */}
        <div className="bg-slate-900 border border-amber-500/30 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Assinantes PRO</span>
            <div className="p-2 bg-amber-950/60 text-amber-400 rounded-xl">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-amber-400">{proSubscribersCount}</div>
          <p className="text-[11px] text-slate-400 mt-1">Clientes com planos pagos ativos</p>
        </div>

        {/* MRR (Monthly Recurring Revenue) */}
        <div className="bg-slate-900 border border-emerald-500/30 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">MRR Estimado</span>
            <div className="p-2 bg-emerald-950/60 text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-emerald-400">
            R$ {totalMRR.toFixed(2).replace('.', ',')}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Receita Recorrente Mensal</p>
        </div>

        {/* Conversion Rate */}
        <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Taxa de Conversão</span>
            <div className="p-2 bg-purple-950/60 text-purple-400 rounded-xl">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-purple-400">{conversionRate}%</div>
          <p className="text-[11px] text-slate-500 mt-1">De usuários grátis para PRO</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-2xl shadow-md flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou telefone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Plan filter */}
          <select
            value={selectedPlanFilter}
            onChange={(e) => setSelectedPlanFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Todos os Planos</option>
            <option value="FREE">Plano Grátis</option>
            <option value="PRO_MENSAL">PRO Mensal</option>
            <option value="PRO_ANUAL">PRO Anual</option>
            <option value="ENTERPRISE">Enterprise</option>
          </select>

          {/* Status filter */}
          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 focus:outline-none"
          >
            <option value="ALL">Todos os Status</option>
            <option value="ACTIVE">Ativos</option>
            <option value="PENDING">Pendentes</option>
            <option value="CANCELED">Cancelados</option>
          </select>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-4 px-4 sm:px-6">Cliente / Usuário</th>
                <th className="py-4 px-4">Contato (E-mail / WhatsApp)</th>
                <th className="py-4 px-4 text-center">Plano Atual</th>
                <th className="py-4 px-4 text-center">Status Asaas</th>
                <th className="py-4 px-4 text-center">Ações do Administrador</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-200">
              {filteredSubscribers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-500">
                    Nenhum cliente ou assinante encontrado com os filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredSubscribers.map((sub) => {
                  const isProUser = sub.subscriptionPlan !== 'FREE';
                  const planInfo = SUBSCRIPTION_PLANS[sub.subscriptionPlan] || SUBSCRIPTION_PLANS.FREE;

                  return (
                    <tr
                      key={sub.userId}
                      className="hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Customer Name */}
                      <td className="py-4 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0 ${
                              sub.role === 'admin'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                                : isProUser
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {sub.displayName.slice(0, 2) || 'CL'}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-bold text-white text-xs sm:text-sm">
                                {sub.displayName}
                              </span>
                              {sub.role === 'admin' && (
                                <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                  Admin
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-slate-500 font-mono">
                              ID: {sub.userId.substring(0, 14)}...
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Info & WhatsApp Direct */}
                      <td className="py-4 px-4 space-y-1">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Mail className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                          <span className="truncate max-w-[200px]">{sub.email}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {sub.phone ? (
                            <>
                              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                                <Phone className="w-3 h-3 text-slate-500" />
                                <span>{sub.phone}</span>
                              </div>

                              <a
                                href={getWhatsAppDirectUrl(sub.phone, sub.displayName, planInfo.name)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 text-[10px] font-bold text-emerald-300 transition-colors cursor-pointer"
                                title="Abrir WhatsApp para falar com este cliente"
                              >
                                <WhatsAppIcon className="w-3 h-3 text-emerald-400" />
                                <span>WhatsApp</span>
                              </a>
                            </>
                          ) : (
                            <button
                              onClick={() => {
                                setEditingPhoneUser(sub);
                                setNewPhoneInput('');
                              }}
                              className="text-[10px] text-indigo-400 hover:text-indigo-300 font-semibold underline cursor-pointer"
                            >
                              + Adicionar Telefone
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Plan */}
                      <td className="py-4 px-4 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span
                            className={`px-2.5 py-1 rounded-xl text-xs font-bold border ${
                              sub.subscriptionPlan === 'ENTERPRISE'
                                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                : isProUser
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {planInfo.name}
                          </span>
                          {sub.lastPaymentAmount && sub.lastPaymentAmount > 0 ? (
                            <span className="text-[10px] text-emerald-400 font-semibold mt-1">
                              R$ {sub.lastPaymentAmount.toFixed(2).replace('.', ',')}
                            </span>
                          ) : null}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            sub.subscriptionStatus === 'ACTIVE'
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : sub.subscriptionStatus === 'PENDING'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {sub.subscriptionStatus === 'ACTIVE'
                            ? 'Ativo'
                            : sub.subscriptionStatus === 'PENDING'
                            ? 'Aguardando Pagamento'
                            : 'Cancelado'}
                        </span>
                      </td>

                      {/* Admin Actions */}
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => {
                              setEditingPlanUser(sub);
                              setNewPlanSelection(sub.subscriptionPlan);
                            }}
                            className="px-2.5 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/40 text-indigo-300 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                            title="Alterar plano do cliente"
                          >
                            Alterar Plano
                          </button>

                          <button
                            onClick={() => {
                              setEditingPhoneUser(sub);
                              setNewPhoneInput(sub.phone || '');
                            }}
                            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-colors cursor-pointer"
                            title="Editar telefone do cliente"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {sub.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(sub)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-950/60 text-slate-400 hover:text-rose-300 rounded-xl transition-colors cursor-pointer"
                              title="Remover cliente"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal: Change User Plan */}
      {editingPlanUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-md w-full shadow-2xl text-slate-100 relative space-y-4">
            <button
              onClick={() => setEditingPlanUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Alterar Plano do Cliente</h3>
                <p className="text-xs text-slate-400">{editingPlanUser.displayName}</p>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 block">
                Selecione o novo plano a conceder:
              </label>

              <div className="space-y-2">
                {(['FREE', 'PRO_MENSAL', 'PRO_ANUAL', 'ENTERPRISE'] as SubscriptionPlanId[]).map(
                  (planKey) => {
                    const p = SUBSCRIPTION_PLANS[planKey];
                    const isSelected = newPlanSelection === planKey;
                    return (
                      <div
                        key={planKey}
                        onClick={() => setNewPlanSelection(planKey)}
                        className={`p-3 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-md'
                            : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white">{p.name}</span>
                            {p.popular && <ProBadge size="xs" variant="gold" label="POPULAR" />}
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5">{p.tagline}</p>
                        </div>
                        <span className="text-xs font-black text-emerald-400">
                          {p.price > 0 ? `R$ ${p.price.toFixed(2).replace('.', ',')}` : 'Grátis'}
                        </span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPlanUser(null)}
                className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePlanChange}
                className="py-2.5 px-5 bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 rounded-xl text-xs font-black shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                Salvar e Aplicar Plano
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Edit User Phone */}
      {editingPhoneUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full shadow-2xl text-slate-100 relative space-y-4">
            <button
              onClick={() => setEditingPhoneUser(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm cursor-pointer"
            >
              ✕
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
                <Phone className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Editar Telefone / WhatsApp</h3>
                <p className="text-xs text-slate-400">{editingPhoneUser.displayName}</p>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1">
                Número de Telefone com DDD:
              </label>
              <input
                type="tel"
                value={newPhoneInput}
                onChange={(e) => setNewPhoneInput(e.target.value)}
                placeholder="5511932058703"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Exemplo: 5511932058703 ou (11) 93205-8703
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setEditingPhoneUser(null)}
                className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePhoneChange}
                className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md cursor-pointer"
              >
                Salvar Telefone
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
