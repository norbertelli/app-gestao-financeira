import React, { useState } from 'react';
import {
  BankAccount,
  BankTransaction,
  CreditCard,
  CardTransaction,
  Investment,
  InvestmentTransaction,
  FuturePayment,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  calculateAccountFinalBalance,
  calculateAccountOverdraft,
  calculateAccountTotalAvailable,
  calculateCardCurrentInvoice,
  calculateCardTotalOutstanding,
  calculateCardAvailableLimit,
  calculateInvestmentCurrentBalance,
  calculateTotalNetWorth,
  getCurrentYearMonth,
  formatMonthBR,
} from '../utils/financeUtils';
import {
  Building2,
  CreditCard as CardIcon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Calendar,
  Layers,
  PieChart as PieIcon,
  BarChart3,
  CheckCircle,
  CalendarClock,
  Bell,
  AlertTriangle,
  X,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
  PieChart,
  Pie,
} from 'recharts';

interface DashboardViewProps {
  accounts: BankAccount[];
  bankTransactions: BankTransaction[];
  cards: CreditCard[];
  cardTransactions: CardTransaction[];
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  futurePayments?: FuturePayment[];
  onOpenStatementModal: (type: 'bank' | 'card' | 'investment', entity: any) => void;
  onOpenSmartReader: () => void;
  onNavigateTab?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  accounts,
  bankTransactions,
  cards,
  cardTransactions,
  investments,
  investmentTransactions,
  futurePayments = [],
  onOpenStatementModal,
  onOpenSmartReader,
  onNavigateTab,
}) => {
  const [showUrgentModal, setShowUrgentModal] = useState(false);
  const currentMonth = getCurrentYearMonth();

  // Date calculation for monitoring payments due in < 3 days
  const todayDate = new Date();
  const todayStr = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;

  const getDaysDiff = (dueDateStr: string) => {
    const d1 = new Date(dueDateStr + 'T00:00:00');
    const d2 = new Date(todayStr + 'T00:00:00');
    return Math.ceil((d1.getTime() - d2.getTime()) / (1000 * 60 * 60 * 24));
  };

  // Monitor futurePayments: filter unpaid items with dueDate <= 3 days from today
  const urgentPayments = futurePayments
    .filter((p) => p.status !== 'Pago')
    .map((p) => {
      const daysLeft = getDaysDiff(p.dueDate);
      const computedStatus = daysLeft < 0 ? 'Pendente' : 'Em Aberto';
      return { ...p, daysLeft, computedStatus };
    })
    .filter((p) => p.daysLeft <= 3)
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const {
    totalAccountsBalance,
    totalCardsOutstanding,
    totalInvestmentsBalance,
    netWorth,
  } = calculateTotalNetWorth(
    accounts,
    bankTransactions,
    cards,
    cardTransactions,
    investments,
    investmentTransactions
  );

  // Total Overdraft Limit across all bank accounts
  const totalOverdraftLimit = accounts.reduce(
    (sum, acc) => sum + (acc.overdraftLimit && acc.overdraftLimit > 0 ? acc.overdraftLimit : 0),
    0
  );

  // Calculate projected card invoice debts for future months
  // Collect all distinct invoice months from card transactions
  const monthMap: Record<string, number> = {};
  cardTransactions.forEach((t) => {
    monthMap[t.invoiceMonth] = (monthMap[t.invoiceMonth] || 0) + Math.abs(t.amount);
  });

  const sortedMonths = Object.keys(monthMap).sort();
  const futureDebtChartData = sortedMonths.map((m) => ({
    monthStr: formatMonthBR(m),
    rawMonth: m,
    totalDebt: monthMap[m],
  }));

  // Chart data for Asset Allocation across Institutions
  const institutionAllocationData: { name: string; value: number; color: string }[] = [];

  accounts.forEach((acc) => {
    const bal = calculateAccountFinalBalance(acc, bankTransactions);
    if (bal > 0) {
      institutionAllocationData.push({
        name: acc.bankName,
        value: bal,
        color: acc.color || '#3B82F6',
      });
    }
  });

  investments.forEach((inv) => {
    const bal = calculateInvestmentCurrentBalance(inv, investmentTransactions);
    if (bal > 0) {
      institutionAllocationData.push({
        name: `${inv.institution} (${inv.assetName.substring(0, 10)}...)`,
        value: bal,
        color: inv.color || '#10B981',
      });
    }
  });

  return (
    <div className="space-y-8 pb-12">
      {/* Top Welcome & Smart Import Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-900/40 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Gestão Integrada com Open Finance & Leitor IA</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Visão Geral do Patrimônio
            </h1>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Confira os saldos finais calculados (Saldo Inicial + Extrato) de todas as suas contas, cartões e investimentos.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {urgentPayments.length > 0 && (
              <button
                onClick={() => setShowUrgentModal(true)}
                className="relative inline-flex items-center gap-2 px-4 py-3 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-400/40 rounded-xl text-sm font-bold transition-all shadow-md animate-pulse"
                title="Avisos de Vencimento"
              >
                <Bell className="w-4 h-4 text-amber-300" />
                <span>{urgentPayments.length} Alerta(s)</span>
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-rose-600 text-white text-[10px] font-black rounded-full flex items-center justify-center border-2 border-slate-900">
                  {urgentPayments.length}
                </span>
              </button>
            )}

            <button
              onClick={onOpenSmartReader}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold rounded-xl text-sm shadow-lg shadow-emerald-900/30 transition-all hover:scale-105 active:scale-95"
            >
              <Sparkles className="w-4 h-4 fill-slate-950" />
              <span>Importar Extrato Copiado</span>
            </button>
          </div>
        </div>
      </div>

      {/* URGENT PAYMENTS MONITORING NOTIFICATION BANNER (< 3 DAYS TO DUE DATE) */}
      {urgentPayments.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-2 border-amber-500/30 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-black uppercase tracking-wider">
                  Aviso de Vencimento
                </span>
                <span className="text-xs font-bold text-amber-700 dark:text-amber-400">
                  Verificação Diária Automática
                </span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 mt-1">
                {urgentPayments.length} compromisso(s) vence(m) em menos de 3 dias ou já venceu!
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                Próxima conta: <strong>"{urgentPayments[0].description}"</strong> de{' '}
                <strong>-R$ {urgentPayments[0].expectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> com vencimento{' '}
                {urgentPayments[0].daysLeft < 0
                  ? 'já ultrapassado (Pendente)'
                  : urgentPayments[0].daysLeft === 0
                  ? 'para HOJE'
                  : `em ${urgentPayments[0].daysLeft} dia(s)`}.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setShowUrgentModal(true)}
              className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md transition-all inline-flex items-center gap-1.5"
            >
              <Bell className="w-4 h-4" />
              <span>Ver Lista de Detalhes</span>
            </button>
            {onNavigateTab && (
              <button
                onClick={() => onNavigateTab('future-payments')}
                className="px-4 py-2.5 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all inline-flex items-center gap-1"
              >
                <span>Ir para Contas a Pagar</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Worth */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Patrimônio Líquido</span>
            <div className={`p-2 rounded-xl ${netWorth < 0 ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'}`}>
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${netWorth < 0 ? 'text-red-600 dark:text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
            {formatCurrency(netWorth)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Soma de bancos + investimentos - faturas
          </p>
        </div>

        {/* Total Bank Accounts Balance */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Saldo Total Bancos</span>
            <div className={`p-2 rounded-xl ${totalAccountsBalance < 0 ? 'bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400' : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400'}`}>
              <Building2 className="w-5 h-5" />
            </div>
          </div>
          <div className={`text-2xl sm:text-3xl font-black ${totalAccountsBalance < 0 ? 'text-red-600 dark:text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
            {formatCurrency(totalAccountsBalance)}
          </div>
          {totalOverdraftLimit > 0 ? (
            <div className="mt-2 text-xs space-y-0.5">
              <span className="text-amber-600 dark:text-amber-400 font-semibold block">
                +{formatCurrency(totalOverdraftLimit)} cheque especial
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium block">
                Saldo + Cheque: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(totalAccountsBalance + totalOverdraftLimit)}</strong>
              </span>
            </div>
          ) : (
            <p className={`text-xs mt-2 font-medium ${totalAccountsBalance < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
              {accounts.length} contas bancárias ativas
            </p>
          )}
        </div>

        {/* Total Credit Cards Outstanding Debt */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Faturas & Parcelas</span>
            <div className="p-2 bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-xl">
              <CardIcon className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-red-600 dark:text-red-500 font-bold">
            {formatCurrency(totalCardsOutstanding)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            Projetado nos próximos meses
          </p>
        </div>

        {/* Total Investments */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs hover:border-slate-300 dark:hover:border-slate-700 transition-all">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Investimentos</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400">
            {formatCurrency(totalInvestmentsBalance)}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
            {investments.length} carteiras/ativos aplicados
          </p>
        </div>
      </div>

      {/* TABELA DE BANCOS (Contas Bancárias, Saldo Inicial, Extrato e Saldo Final) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Contas Bancárias & Saldos Reconciliados</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Clique em qualquer saldo para conferir e auditar o extrato detalhado
            </p>
          </div>

          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
            Saldo Final = Saldo Inicial + Soma do Extrato
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Banco / Número</th>
                <th className="py-3 px-4">Agência & Conta</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4 text-right">Saldo Inicial</th>
                <th className="py-3 px-4 text-right">Movimentação</th>
                <th className="py-3 px-4 text-right">Saldo em Conta</th>
                <th className="py-3 px-4 text-right">Cheque Especial</th>
                <th className="py-3 px-4 text-right">Saldo + Cheque Especial</th>
                <th className="py-3 px-4 text-center">Conferência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {accounts.map((acc) => {
                const txs = bankTransactions.filter((t) => t.accountId === acc.id);
                const txSum = txs.reduce((sum, t) => sum + t.amount, 0);
                const finalBal = acc.initialBalance + txSum;
                const overdraft = calculateAccountOverdraft(acc);
                const totalAvail = finalBal + overdraft;

                return (
                  <tr
                    key={acc.id}
                    onClick={() => onOpenStatementModal('bank', acc)}
                    className="hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: acc.color }}
                        />
                        <div>
                          <span>{acc.bankName}</span>
                          <span className="text-xs font-normal text-slate-400 block">
                            Cód: {acc.bankCode}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-300">
                      Ag: {acc.agency} | CC: {acc.accountNumber}
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {acc.type}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatCurrency(acc.initialBalance)}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-medium whitespace-nowrap ${txSum >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                      {txSum >= 0 ? `+${formatCurrency(txSum)}` : formatCurrency(txSum)}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-black whitespace-nowrap text-base ${finalBal < 0 ? 'text-red-500 font-bold' : 'text-slate-900 dark:text-slate-100'}`}>
                      {formatCurrency(finalBal)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                      {overdraft > 0 ? `+${formatCurrency(overdraft)}` : '-'}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-black whitespace-nowrap text-base group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors ${totalAvail < 0 ? 'text-red-500 font-bold' : 'text-indigo-600 dark:text-indigo-400'}`}>
                      {formatCurrency(totalAvail)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 group-hover:underline">
                        <span>Ver Extrato</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* SEÇÃO DE FUTUROS PAGAMENTOS (CONTAS A PAGAR) */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <CalendarClock className="w-5 h-5 text-amber-500" />
              <span>Próximos Pagamentos Futuros (Contas a Pagar)</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Boletos e compromissos pendentes. Ao alterar para pago, o débito é gerado no extrato do banco.
            </p>
          </div>

          {onNavigateTab && (
            <button
              onClick={() => onNavigateTab('future-payments')}
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 dark:text-amber-400 inline-flex items-center gap-1"
            >
              <span>Gerenciar Contas a Pagar</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="p-5 overflow-x-auto">
          {futurePayments.filter((p) => p.status !== 'Pago').length === 0 ? (
            <div className="text-center py-6 text-slate-400 text-xs font-medium">
              Nenhum compromisso pendente ou em aberto.
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="pb-2.5 px-2">Vencimento</th>
                  <th className="pb-2.5 px-2">Descrição</th>
                  <th className="pb-2.5 px-2">Categoria</th>
                  <th className="pb-2.5 px-2 text-right">Valor Previsto</th>
                  <th className="pb-2.5 px-2 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {futurePayments
                  .filter((p) => p.status !== 'Pago')
                  .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                  .slice(0, 5)
                  .map((p) => {
                    const isOverdue = p.dueDate < todayStr;
                    const statusText = isOverdue ? 'Pendente' : 'Em Aberto';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                        <td className="py-3 px-2 font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                          {formatDateBR(p.dueDate)}
                        </td>
                        <td className="py-3 px-2 font-semibold text-slate-800 dark:text-slate-100">
                          {p.description}
                        </td>
                        <td className="py-3 px-2 text-xs">
                          <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 font-medium">
                            {p.category}
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-black text-slate-900 dark:text-slate-100">
                          {formatCurrency(p.expectedAmount)}
                        </td>
                        <td className="py-3 px-2 text-center">
                          {isOverdue ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                              Pendente
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                              Em Aberto
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* TABELA DE CARTÕES DE CRÉDITO & PROJEÇÃO DE DÍVIDAS MESES A FRENTE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cards Table (2 cols) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <CardIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span>Cartões de Crédito & Faturas Futuras</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Vencimentos, melhor dia de compra e parcelas projetadas nos meses a frente
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Cartão / Banco</th>
                  <th className="py-3 px-4">Melhor Dia</th>
                  <th className="py-3 px-4">Vencimento</th>
                  <th className="py-3 px-4 text-right">Limite Total</th>
                  <th className="py-3 px-4 text-right">Limite Disp.</th>
                  <th className="py-3 px-4 text-right">Fatura Atual ({formatMonthBR(currentMonth)})</th>
                  <th className="py-3 px-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {cards.map((card) => {
                  const currentInvoice = calculateCardCurrentInvoice(card.id, cardTransactions, currentMonth);
                  const availableLimit = calculateCardAvailableLimit(card, cardTransactions);

                  return (
                    <tr
                      key={card.id}
                      onClick={() => onOpenStatementModal('card', card)}
                      className="hover:bg-purple-50/40 dark:hover:bg-purple-950/20 cursor-pointer transition-colors group"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-3 h-3 rounded-full flex-shrink-0"
                            style={{ backgroundColor: card.color }}
                          />
                          <div>
                            <span>{card.name}</span>
                            <span className="text-xs font-normal text-slate-400 block">
                              **** {card.lastFourDigits} ({card.bankName})
                            </span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-medium">
                        Dia {card.closingDay}
                      </td>

                      <td className="py-3.5 px-4 text-rose-600 dark:text-rose-400 font-semibold">
                        Dia {card.dueDay}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                        {formatCurrency(card.totalLimit)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                        {formatCurrency(availableLimit)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-black text-red-600 dark:text-red-500 font-bold whitespace-nowrap text-base">
                        -{formatCurrency(currentInvoice)}
                      </td>

                      <td className="py-3.5 px-4 text-center">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 group-hover:underline">
                          <span>Ver Fatura</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Future Debt Chart (1 col) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <span>Dívidas nos Meses a Frente</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Faturas futuras acumuladas enquanto houver parcelamento ativo
            </p>
          </div>

          <div className="h-56 mt-4 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={futureDebtChartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.2} />
                <XAxis dataKey="monthStr" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(val) => `R$${val}`} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value)), 'Total Fatura']}
                  labelFormatter={(label) => `Mês: ${label}`}
                />
                <Bar dataKey="totalDebt" fill="#8884d8" radius={[6, 6, 0, 0]}>
                  {futureDebtChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.rawMonth === currentMonth ? '#E11D48' : '#8B5CF6'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-3 text-center">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              *A barra em vermelho indica o mês atual da fatura ({formatMonthBR(currentMonth)})
            </span>
          </div>
        </div>
      </div>

      {/* TABELA DE INVESTIMENTOS */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              <span>Investimentos & Aportes Recorrentes</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Instituição, ativo, saldo inicial e extrato de rendimentos/movimentações
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-4">Instituição & Ativo</th>
                <th className="py-3 px-4">Tipo de Ativo</th>
                <th className="py-3 px-4 text-right">Aporte Inicial</th>
                <th className="py-3 px-4 text-right">Rendimentos / Aportes</th>
                <th className="py-3 px-4 text-right">Saldo Atual Calculado</th>
                <th className="py-3 px-4 text-center">Conferência</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {investments.map((inv) => {
                const invTxs = investmentTransactions.filter((t) => t.investmentId === inv.id);
                const movementSum = invTxs.reduce((sum, t) => sum + t.amount, 0);
                const currentBal = inv.initialBalance + movementSum;

                return (
                  <tr
                    key={inv.id}
                    onClick={() => onOpenStatementModal('investment', inv)}
                    className="hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: inv.color }}
                        />
                        <div>
                          <span>{inv.assetName}</span>
                          <span className="text-xs font-normal text-slate-400 block">
                            {inv.institution}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50">
                        {inv.assetType}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 dark:text-slate-400 whitespace-nowrap">
                      {formatCurrency(inv.initialBalance)}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-medium whitespace-nowrap ${movementSum >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-red-600 dark:text-red-500 font-bold'}`}>
                      {movementSum >= 0 ? `+${formatCurrency(movementSum)}` : formatCurrency(movementSum)}
                    </td>

                    <td className={`py-3.5 px-4 text-right font-black whitespace-nowrap text-base ${currentBal < 0 ? 'text-red-600 dark:text-red-500 font-bold' : 'text-emerald-700 dark:text-emerald-300'}`}>
                      {formatCurrency(currentBal)}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 group-hover:underline">
                        <span>Ver Extrato</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* URGENT PAYMENTS NOTIFICATION MODAL */}
      {showUrgentModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-6 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/10 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-2xl">
                  <Bell className="w-6 h-6 animate-bounce" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <span>Alertas de Vencimento</span>
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-xs font-extrabold">
                      {urgentPayments.length} urgente(s)
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Sistema de monitoramento diário automático: contas a vencer em menos de 3 dias
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowUrgentModal(false)}
                className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content List */}
            <div className="p-6 max-h-[60vh] overflow-y-auto space-y-3">
              {urgentPayments.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-sm">
                  Nenhum compromisso com vencimento próximo de 3 dias.
                </div>
              ) : (
                urgentPayments.map((p) => (
                  <div
                    key={p.id}
                    className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      p.daysLeft < 0
                        ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                        : p.daysLeft === 0
                        ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                          {p.description}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {p.category}
                        </span>
                      </div>
                      <p className="text-xs font-semibold mt-1">
                        {p.daysLeft < 0 ? (
                          <span className="text-rose-600 dark:text-rose-400 font-bold">
                            Venceu há {Math.abs(p.daysLeft)} dia(s) ({formatDateBR(p.dueDate)}) - Pendente
                          </span>
                        ) : p.daysLeft === 0 ? (
                          <span className="text-amber-600 dark:text-amber-400 font-black">
                            Vence HOJE ({formatDateBR(p.dueDate)})
                          </span>
                        ) : (
                          <span className="text-amber-600 dark:text-amber-400 font-bold">
                            Vence em {p.daysLeft} dia(s) ({formatDateBR(p.dueDate)})
                          </span>
                        )}
                      </p>
                      {p.notes && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {p.notes}
                        </p>
                      )}
                    </div>

                    <div className="text-right flex-shrink-0">
                      <p className="text-base font-black text-rose-600 dark:text-rose-400">
                        -R$ {p.expectedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </p>
                      <span
                        className={`inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          p.daysLeft < 0
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {p.daysLeft < 0 ? 'Pendente (Atrasado)' : 'Em Aberto (Próximo)'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-5 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                O monitoramento é executado continuamente a partir do array de compromissos.
              </p>

              <div className="flex items-center gap-2">
                {onNavigateTab && (
                  <>
                    <button
                      onClick={() => {
                        setShowUrgentModal(false);
                        onNavigateTab('notifications');
                      }}
                      className="px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors flex items-center gap-1.5"
                    >
                      <Bell className="w-3.5 h-3.5" />
                      <span>Configurar Lembretes & Webhooks</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUrgentModal(false);
                        onNavigateTab('future-payments');
                      }}
                      className="px-3.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                    >
                      Ir para Contas a Pagar
                    </button>
                  </>
                )}
                <button
                  onClick={() => setShowUrgentModal(false)}
                  className="px-4 py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-xl text-xs font-bold transition-colors"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
