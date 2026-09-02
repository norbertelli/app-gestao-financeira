import React, { useState } from 'react';
import {
  Debt,
  BankAccount,
} from '../types';
import {
  Landmark,
  Plus,
  Trash2,
  Edit2,
  DollarSign,
  Calendar,
  Layers,
  Percent,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingDown,
  Building2,
  FileText,
  Search,
  Check,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { formatCurrency, formatDateBR } from '../utils/financeUtils';

interface DebtsViewProps {
  debts: Debt[];
  bankAccounts: BankAccount[];
  onSaveDebt: (debt: Debt) => Promise<void>;
  onDeleteDebt: (debtId: string) => Promise<void>;
  onPayInstallment?: (debt: Debt, accountId?: string) => Promise<void>;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  bankAccounts,
  onSaveDebt,
  onDeleteDebt,
  onPayInstallment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDebt, setEditingDebt] = useState<Debt | null>(null);

  // Pay Installment Modal State
  const [payModalDebt, setPayModalDebt] = useState<Debt | null>(null);
  const [selectedPayAccount, setSelectedPayAccount] = useState<string>(
    bankAccounts[0]?.id || ''
  );
  const [isPaying, setIsPaying] = useState(false);

  // Form Fields
  const [creditor, setCreditor] = useState('');
  const [loanAmount, setLoanAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [totalInstallments, setTotalInstallments] = useState('');
  const [currentInstallment, setCurrentInstallment] = useState('');
  const [installmentAmount, setInstallmentAmount] = useState('');
  const [category, setCategory] = useState('Empréstimo Pessoal');
  const [interestRate, setInterestRate] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Reset form
  const resetForm = () => {
    setEditingDebt(null);
    setCreditor('');
    setLoanAmount('');
    setDueDate('Dia 10');
    setTotalInstallments('12');
    setCurrentInstallment('0');
    setInstallmentAmount('');
    setCategory('Empréstimo Pessoal');
    setInterestRate('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setNotes('');
  };

  const handleOpenNewModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (debt: Debt) => {
    setEditingDebt(debt);
    setCreditor(debt.creditor);
    setLoanAmount(debt.loanAmount.toString());
    setDueDate(debt.dueDate);
    setTotalInstallments(debt.totalInstallments.toString());
    setCurrentInstallment((debt.currentInstallment || 0).toString());
    setInstallmentAmount(debt.installmentAmount.toString());
    setCategory(debt.category || 'Empréstimo Pessoal');
    setInterestRate(debt.interestRate || '');
    setStartDate(debt.startDate || new Date().toISOString().split('T')[0]);
    setNotes(debt.notes || '');
    setIsModalOpen(true);
  };

  const handleCalculateInstallment = () => {
    const total = parseFloat(loanAmount);
    const n = parseInt(totalInstallments, 10);
    if (!isNaN(total) && !isNaN(n) && n > 0 && (!installmentAmount || parseFloat(installmentAmount) === 0)) {
      setInstallmentAmount((total / n).toFixed(2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!creditor.trim() || !loanAmount || !installmentAmount || !totalInstallments) {
      alert('Por favor, preencha todos os campos obrigatórios (Credor, Valor do Empréstimo, Parcelas e Valor da Parcela).');
      return;
    }

    const loanVal = parseFloat(loanAmount);
    const instVal = parseFloat(installmentAmount);
    const totalInst = parseInt(totalInstallments, 10);
    const currInst = parseInt(currentInstallment, 10) || 0;

    if (isNaN(loanVal) || isNaN(instVal) || isNaN(totalInst) || totalInst <= 0) {
      alert('Valores numéricos inválidos.');
      return;
    }

    const status: 'Ativo' | 'Quitado' = currInst >= totalInst ? 'Quitado' : 'Ativo';

    const debtObj: Debt = {
      id: editingDebt ? editingDebt.id : `debt_${Date.now()}`,
      creditor: creditor.trim(),
      loanAmount: loanVal,
      dueDate: dueDate.trim() || 'Dia 10',
      totalInstallments: totalInst,
      currentInstallment: currInst,
      installmentAmount: instVal,
      category,
      status,
      interestRate: interestRate.trim() || undefined,
      startDate,
      notes: notes.trim() || undefined,
      createdAt: editingDebt?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      setIsSaving(true);
      await onSaveDebt(debtObj);
      setIsModalOpen(false);
      resetForm();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar o empréstimo/dívida.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (debt: Debt) => {
    if (confirm(`Tem certeza que deseja excluir o registro de dívida com "${debt.creditor}"?`)) {
      try {
        await onDeleteDebt(debt.id);
      } catch (err) {
        console.error(err);
        alert('Erro ao excluir a dívida.');
      }
    }
  };

  const handleConfirmPayInstallment = async () => {
    if (!payModalDebt) return;
    try {
      setIsPaying(true);
      if (onPayInstallment) {
        await onPayInstallment(payModalDebt, selectedPayAccount);
      } else {
        const nextInstallment = (payModalDebt.currentInstallment || 0) + 1;
        const newStatus = nextInstallment >= payModalDebt.totalInstallments ? 'Quitado' : 'Ativo';
        await onSaveDebt({
          ...payModalDebt,
          currentInstallment: nextInstallment,
          status: newStatus,
          updatedAt: new Date().toISOString(),
        });
      }
      setPayModalDebt(null);
    } catch (err) {
      console.error(err);
      alert('Erro ao registrar o pagamento da parcela.');
    } finally {
      setIsPaying(false);
    }
  };

  // Metrics Calculation
  const totalLoanValue = debts.reduce((sum, d) => sum + d.loanAmount, 0);
  const activeDebts = debts.filter((d) => (d.status || 'Ativo') === 'Ativo');
  
  // Total Remaining Balance
  const totalRemainingDebt = debts.reduce((sum, d) => {
    const paid = (d.currentInstallment || 0) * d.installmentAmount;
    const totalContracted = d.totalInstallments * d.installmentAmount;
    const remaining = Math.max(0, totalContracted - paid);
    return sum + remaining;
  }, 0);

  // Total Monthly Installments due
  const totalMonthlyCommitment = activeDebts.reduce((sum, d) => sum + d.installmentAmount, 0);

  // Filtered Debts
  const filteredDebts = debts.filter((d) => {
    if (filterStatus !== 'ALL') {
      if ((d.status || 'Ativo') !== filterStatus) return false;
    }
    if (filterCategory !== 'ALL') {
      if (d.category !== filterCategory) return false;
    }
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchCreditor = d.creditor.toLowerCase().includes(term);
      const matchCategory = d.category?.toLowerCase().includes(term);
      const matchNotes = d.notes?.toLowerCase().includes(term);
      if (!matchCreditor && !matchCategory && !matchNotes) return false;
    }
    return true;
  });

  const categoriesList = Array.from(new Set(debts.map((d) => d.category || 'Outros')));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">
                Controle de Dívidas & Empréstimos
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Acompanhe credores, parcelas contratadas, amortizações e saldo devedor
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-sm hover:shadow transition-all flex items-center justify-center gap-2"
        >
          <Plus className="w-5 h-5" />
          <span>Novo Empréstimo / Dívida</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo Devedor Restante */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Devedor Restante</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalRemainingDebt)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {activeDebts.length} contrato(s) ativo(s)
          </p>
        </div>

        {/* Total Financiado Contratado */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Contratado</span>
            <div className="p-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-xl">
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalLoanValue)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Valor original dos empréstimos
          </p>
        </div>

        {/* Comprometimento Mensal */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Parcelas do Mês</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Calendar className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400">
            {formatCurrency(totalMonthlyCommitment)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Soma das parcelas mensais ativas
          </p>
        </div>

        {/* Contratos Quitados */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Status Geral</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400">
            {debts.filter((d) => d.status === 'Quitado').length} / {debts.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Contratos já quitados com sucesso
          </p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        {/* Filters and Search */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-800/30">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar credor, categoria ou observação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-4 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-800 dark:text-slate-200 placeholder-slate-400 outline-none focus:ring-2 focus:ring-rose-500 w-64 sm:w-80"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Ativo">Ativos</option>
              <option value="Quitado">Quitados</option>
            </select>

            {/* Category Filter */}
            {categoriesList.length > 0 && (
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 outline-none"
              >
                <option value="ALL">Todas as Categorias</option>
                {categoriesList.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            Exibindo <strong>{filteredDebts.length}</strong> de {debts.length} registro(s)
          </div>
        </div>

        {/* Table Content */}
        {filteredDebts.length === 0 ? (
          <div className="text-center py-16 px-4">
            <div className="w-16 h-16 bg-rose-50 dark:bg-rose-950/40 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-3">
              <Landmark className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
              Nenhuma dívida ou empréstimo encontrado
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1 mb-4">
              Cadastre seus financiamentos, empréstimos pessoais e parcelamentos para ter o controle do saldo devedor.
            </p>
            <button
              onClick={handleOpenNewModal}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl inline-flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Primeiro Empréstimo</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Credor</th>
                  <th className="py-3 px-4">Valor do Empréstimo</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-center">Nº de Parcelas</th>
                  <th className="py-3 px-4 text-right">Valor da Parcela</th>
                  <th className="py-3 px-4">Progresso & Saldo Devedor</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredDebts.map((debt) => {
                  const curr = debt.currentInstallment || 0;
                  const total = debt.totalInstallments;
                  const progressPct = Math.min(100, Math.round((curr / total) * 100));
                  const remainingInst = Math.max(0, total - curr);
                  const remainingAmount = remainingInst * debt.installmentAmount;
                  const isQuitado = debt.status === 'Quitado' || curr >= total;

                  return (
                    <tr
                      key={debt.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Credor */}
                      <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <div className="flex items-center gap-2.5">
                          <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl flex-shrink-0">
                            <Building2 className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {debt.creditor}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {debt.category && (
                                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                                  {debt.category}
                                </span>
                              )}
                              {debt.interestRate && (
                                <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded font-mono">
                                  {debt.interestRate}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Valor do Empréstimo */}
                      <td className="py-3.5 px-4 font-black text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        {formatCurrency(debt.loanAmount)}
                      </td>

                      {/* Vencimento */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          <span>{debt.dueDate}</span>
                        </div>
                      </td>

                      {/* Número de Parcelas */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-lg text-xs font-black bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                          {curr} / {total} parcelas
                        </span>
                      </td>

                      {/* Valor da Parcela */}
                      <td className="py-3.5 px-4 text-right font-black text-rose-600 dark:text-rose-400 whitespace-nowrap">
                        {formatCurrency(debt.installmentAmount)}
                      </td>

                      {/* Progresso & Saldo Devedor */}
                      <td className="py-3.5 px-4 min-w-[180px]">
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-600 dark:text-slate-400">
                              {progressPct}% pago
                            </span>
                            <span className="font-black text-slate-800 dark:text-slate-200">
                              Resta: {formatCurrency(remainingAmount)}
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isQuitado
                                  ? 'bg-emerald-500'
                                  : progressPct > 50
                                  ? 'bg-indigo-500'
                                  : 'bg-rose-500'
                              }`}
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {isQuitado ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 className="w-3 h-3" />
                            Quitado
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            <Clock className="w-3 h-3" />
                            Ativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          {!isQuitado && (
                            <button
                              onClick={() => {
                                setPayModalDebt(debt);
                                setSelectedPayAccount(bankAccounts[0]?.id || '');
                              }}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 shadow-2xs"
                              title="Pagar / Baixar próxima parcela"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Pagar Parcela</span>
                            </button>
                          )}

                          <button
                            onClick={() => handleOpenEditModal(debt)}
                            className="p-1.5 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Editar Dados"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleDelete(debt)}
                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/50 rounded-lg transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Cadastrar / Editar Dívida */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-gradient-to-r from-rose-50/60 to-transparent dark:from-rose-950/30">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-xl">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                    {editingDebt ? 'Editar Dívida / Empréstimo' : 'Novo Empréstimo ou Dívida'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Preencha os dados do contrato para acompanhamento de parcelas
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Credor */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Credor / Instituição Financeira <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caixa Econômica, Banco Itaú, Santander, Consignado..."
                  value={creditor}
                  onChange={(e) => setCreditor(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  required
                />
              </div>

              {/* Valor do Empréstimo e Vencimento */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor do Empréstimo (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 50000.00"
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    onBlur={handleCalculateInstallment}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Vencimento <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Dia 10 ou 10/09"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Parcelas e Valor da Parcela */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Nº de Parcelas <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Ex: 24"
                    value={totalInstallments}
                    onChange={(e) => setTotalInstallments(e.target.value)}
                    onBlur={handleCalculateInstallment}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-bold text-slate-900 dark:text-slate-100 outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Parcelas Já Pagas
                  </label>
                  <input
                    type="number"
                    min={0}
                    placeholder="Ex: 5"
                    value={currentInstallment}
                    onChange={(e) => setCurrentInstallment(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Valor da Parcela (R$) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 850.00"
                    value={installmentAmount}
                    onChange={(e) => setInstallmentAmount(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-black text-rose-600 dark:text-rose-400 outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>
              </div>

              {/* Categoria e Taxa de Juros */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200 outline-none focus:ring-2 focus:ring-rose-500"
                  >
                    <option value="Empréstimo Pessoal">Empréstimo Pessoal</option>
                    <option value="Financiamento Imobiliário">Financiamento Imobiliário</option>
                    <option value="Financiamento Veicular">Financiamento Veicular</option>
                    <option value="Crédito Consignado">Crédito Consignado</option>
                    <option value="Renegociação / Dívida">Renegociação / Dívida</option>
                    <option value="Cheque Especial / Outros">Cheque Especial / Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Taxa de Juros (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: 1.49% a.m. ou 12% a.a."
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none"
                  />
                </div>
              </div>

              {/* Data de Início e Observações */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Data de Início / Contratação
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-sm text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                  Observações / Nº do Contrato
                </label>
                <textarea
                  rows={2}
                  placeholder="Informações adicionais, garantia, conta de débito..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm text-slate-800 dark:text-slate-200 outline-none"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50"
                >
                  {isSaving ? 'Salvando...' : editingDebt ? 'Salvar Alterações' : 'Cadastrar Empréstimo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Pagar Parcela */}
      {payModalDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl p-5 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 rounded-xl">
                  <Check className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                    Liquidar Parcela do Empréstimo
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {payModalDebt.creditor}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setPayModalDebt(null)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Próxima Parcela:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {(payModalDebt.currentInstallment || 0) + 1} de {payModalDebt.totalInstallments}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Valor da Parcela:</span>
                  <span className="font-black text-rose-600 dark:text-rose-400 text-sm">
                    {formatCurrency(payModalDebt.installmentAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Vencimento:</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {payModalDebt.dueDate}
                  </span>
                </div>
              </div>

              {bankAccounts.length > 0 && (
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                    Debitar da Conta Bancária (Opcional)
                  </label>
                  <select
                    value={selectedPayAccount}
                    onChange={(e) => setSelectedPayAccount(e.target.value)}
                    className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200"
                  >
                    <option value="">Não debitar de conta bancária</option>
                    {bankAccounts.map((acc) => (
                      <option key={acc.id} value={acc.id}>
                        {acc.bankName} ({acc.accountNumber})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPayModalDebt(null)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isPaying}
                  onClick={handleConfirmPayInstallment}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{isPaying ? 'Processando...' : 'Confirmar Pagamento'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
