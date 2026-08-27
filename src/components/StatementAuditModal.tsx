import React, { useState } from 'react';
import {
  BankAccount,
  BankTransaction,
  CreditCard,
  CardTransaction,
  Investment,
  InvestmentTransaction,
} from '../types';
import {
  formatCurrency,
  formatDateBR,
  calculateAccountFinalBalance,
  calculateCardCurrentInvoice,
  calculateInvestmentCurrentBalance,
  getCurrentYearMonth,
  formatMonthBR,
} from '../utils/financeUtils';
import {
  exportBankStatementToPDF,
  exportBankStatementToExcel,
} from '../utils/exportUtils';
import { ExportDropdown } from './ExportDropdown';
import {
  X,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CreditCard as CardIcon,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface StatementAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  entityType: 'bank' | 'card' | 'investment';
  bankAccount?: BankAccount;
  creditCard?: CreditCard;
  investment?: Investment;
  bankTransactions: BankTransaction[];
  cardTransactions: CardTransaction[];
  investmentTransactions: InvestmentTransaction[];
  onAddBankTx?: (tx: Omit<BankTransaction, 'id'>) => void;
  onDeleteBankTx?: (id: string) => void;
  onAddCardTx?: (tx: Omit<CardTransaction, 'id'>) => void;
  onDeleteCardTx?: (id: string) => void;
  onAddInvestmentTx?: (tx: Omit<InvestmentTransaction, 'id'>) => void;
  onDeleteInvestmentTx?: (id: string) => void;
}

export const StatementAuditModal: React.FC<StatementAuditModalProps> = ({
  isOpen,
  onClose,
  entityType,
  bankAccount,
  creditCard,
  investment,
  bankTransactions,
  cardTransactions,
  investmentTransactions,
  onAddBankTx,
  onDeleteBankTx,
  onAddCardTx,
  onDeleteCardTx,
  onAddInvestmentTx,
  onDeleteInvestmentTx,
}) => {
  if (!isOpen) return null;

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentYearMonth());
  const [showAddForm, setShowAddForm] = useState(false);

  // Form states for manual additions
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newDesc, setNewDesc] = useState('');
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState<any>('Alimentação');
  const [newType, setNewType] = useState<any>('PIX');

  // Filtered transactions & Balance calculations
  let initialBal = 0;
  let finalBal = 0;
  let totalCredits = 0;
  let totalDebits = 0;
  let title = '';
  let subtitle = '';
  let entityColor = '#0038A8';

  if (entityType === 'bank' && bankAccount) {
    title = `${bankAccount.bankName} (Banco ${bankAccount.bankCode})`;
    subtitle = `Agência ${bankAccount.agency} | Conta ${bankAccount.accountNumber} - Extrato Completo`;
    entityColor = bankAccount.color || '#0038A8';
    initialBal = bankAccount.initialBalance;

    const txs = bankTransactions.filter((t) => t.accountId === bankAccount.id);
    finalBal = calculateAccountFinalBalance(bankAccount, bankTransactions);

    totalCredits = txs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    totalDebits = txs.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  } else if (entityType === 'card' && creditCard) {
    title = creditCard.name;
    subtitle = `Cartão ${creditCard.brand.toUpperCase()} ****${creditCard.lastFourDigits} | Melhor Dia: ${creditCard.closingDay} | Vencimento: Dia ${creditCard.dueDay}`;
    entityColor = creditCard.color || '#820AD1';
    initialBal = 0; // Card invoice balance

    finalBal = calculateCardCurrentInvoice(creditCard.id, cardTransactions, selectedMonth);
    const cardTxs = cardTransactions.filter((t) => t.cardId === creditCard.id && t.invoiceMonth === selectedMonth);
    totalDebits = cardTxs.reduce((sum, t) => sum + Math.abs(t.amount), 0);
  } else if (entityType === 'investment' && investment) {
    title = `${investment.assetName} - ${investment.institution}`;
    subtitle = `Investimento (${investment.assetType}) | Aporte/Saldo Inicial: ${formatCurrency(investment.initialBalance)}`;
    entityColor = investment.color || '#E53935';
    initialBal = investment.initialBalance;

    finalBal = calculateInvestmentCurrentBalance(investment, investmentTransactions);
    const invTxs = investmentTransactions.filter((t) => t.investmentId === investment.id);
    totalCredits = invTxs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
    totalDebits = invTxs.filter((t) => t.amount < 0).reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(newAmount);
    if (isNaN(parsedAmount) || !newDesc.trim()) return;

    if (entityType === 'bank' && bankAccount && onAddBankTx) {
      onAddBankTx({
        accountId: bankAccount.id,
        date: newDate,
        description: newDesc.trim(),
        amount: parsedAmount,
        category: newCategory,
        type: newType,
        status: 'Concluído',
      });
    } else if (entityType === 'card' && creditCard && onAddCardTx) {
      onAddCardTx({
        cardId: creditCard.id,
        date: newDate,
        description: newDesc.trim(),
        amount: Math.abs(parsedAmount),
        category: newCategory,
        currentInstallment: 1,
        totalInstallments: 1,
        invoiceMonth: selectedMonth,
        status: 'Aberto',
      });
    } else if (entityType === 'investment' && investment && onAddInvestmentTx) {
      onAddInvestmentTx({
        investmentId: investment.id,
        date: newDate,
        type: parsedAmount >= 0 ? 'Rendimento' : 'Resgate',
        amount: parsedAmount,
        notes: newDesc.trim(),
      });
    }

    setNewDesc('');
    setNewAmount('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-800 my-8">
        {/* Modal Header */}
        <div
          className="p-6 text-white flex items-start justify-between relative overflow-hidden"
          style={{ backgroundColor: entityColor }}
        >
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md mb-2">
              {entityType === 'bank' && <Building2 className="w-3.5 h-3.5" />}
              {entityType === 'card' && <CardIcon className="w-3.5 h-3.5" />}
              {entityType === 'investment' && <TrendingUp className="w-3.5 h-3.5" />}
              <span>
                {entityType === 'bank' ? 'Conferência de Conta Bancária' : entityType === 'card' ? 'Fatura / Extrato do Cartão' : 'Movimentação do Investimento'}
              </span>
            </div>
            <h2 className="text-2xl font-bold">{title}</h2>
            <p className="text-sm opacity-90 mt-1">{subtitle}</p>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition-colors text-white z-10"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Balance Reconciliation Summary Bar */}
        <div className="bg-slate-50 dark:bg-slate-800/80 p-5 border-b border-slate-200 dark:border-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-center sm:text-left">
            {entityType !== 'card' && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Saldo Inicial</span>
                <span className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {formatCurrency(initialBal)}
                </span>
              </div>
            )}

            {entityType === 'card' && (
              <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                <span className="text-xs text-slate-500 dark:text-slate-400 block font-medium">Mês da Fatura</span>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="mt-1 text-sm font-semibold bg-transparent border border-slate-300 dark:border-slate-700 rounded px-2 py-0.5 text-slate-800 dark:text-slate-200"
                />
              </div>
            )}

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-emerald-600 dark:text-emerald-400 block font-medium">Total Entradas</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 justify-center sm:justify-start">
                <ArrowUpRight className="w-4 h-4" />
                {formatCurrency(totalCredits)}
              </span>
            </div>

            <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
              <span className="text-xs text-rose-600 dark:text-rose-400 block font-medium">Total Saídas / Gastos</span>
              <span className="text-lg font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1 justify-center sm:justify-start">
                <ArrowDownRight className="w-4 h-4" />
                {formatCurrency(totalDebits)}
              </span>
            </div>

            <div className={`p-3 rounded-xl border shadow-2xs ${
              entityType === 'card'
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                : finalBal < 0
                ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-800'
                : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
            }`}>
              <div className={`flex items-center gap-1.5 justify-center sm:justify-start text-xs font-semibold ${
                entityType === 'card'
                  ? 'text-red-700 dark:text-red-300'
                  : finalBal < 0
                  ? 'text-red-700 dark:text-red-300'
                  : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                <CheckCircle2 className={`w-4 h-4 ${entityType === 'card' || finalBal < 0 ? 'text-red-600' : 'text-emerald-600'}`} />
                <span>
                  {entityType === 'card' ? 'Valor da Fatura' : 'Saldo Final Calculado'}
                </span>
              </div>
              <span className={`text-xl font-black mt-0.5 block ${
                entityType === 'card'
                  ? 'text-red-600 dark:text-red-400 font-bold'
                  : finalBal < 0
                  ? 'text-red-600 dark:text-red-400 font-bold'
                  : 'text-emerald-800 dark:text-emerald-200'
              }`}>
                {entityType === 'card' ? `-${formatCurrency(finalBal)}` : formatCurrency(finalBal)}
              </span>
            </div>
          </div>
        </div>

        {/* Filters & Actions Bar */}
        <div className="p-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-1 min-w-[240px]">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por descrição..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg border border-transparent focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-1.5 px-3 text-sm bg-slate-100 dark:bg-slate-800 rounded-lg border border-transparent focus:border-indigo-500 text-slate-700 dark:text-slate-200 outline-none"
            >
              <option value="all">Todas as Categorias</option>
              <option value="Alimentação">Alimentação</option>
              <option value="Transporte">Transporte</option>
              <option value="Moradia">Moradia</option>
              <option value="Saúde">Saúde</option>
              <option value="Lazer">Lazer</option>
              <option value="Salário">Salário</option>
              <option value="Investimentos">Investimentos</option>
              <option value="Tarifa/Imposto">Tarifa/Imposto</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            {entityType === 'bank' && bankAccount && (
              <ExportDropdown
                onExportPDF={() => {
                  const filtered = bankTransactions
                    .filter((t) => t.accountId === bankAccount.id)
                    .filter((t) => {
                      const matchesSearch = searchTerm.trim() === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
                      return matchesSearch && matchesCat;
                    });
                  exportBankStatementToPDF({
                    account: bankAccount,
                    transactions: filtered,
                    filters: {
                      searchTerm: searchTerm.trim() || undefined,
                      category: selectedCategory,
                    },
                    initialBalance: initialBal,
                    finalBalance: finalBal,
                    totalIncomes: totalCredits,
                    totalExpenses: totalDebits,
                  });
                }}
                onExportXLSX={() => {
                  const filtered = bankTransactions
                    .filter((t) => t.accountId === bankAccount.id)
                    .filter((t) => {
                      const matchesSearch = searchTerm.trim() === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
                      return matchesSearch && matchesCat;
                    });
                  exportBankStatementToExcel(
                    {
                      account: bankAccount,
                      transactions: filtered,
                      filters: {
                        searchTerm: searchTerm.trim() || undefined,
                        category: selectedCategory,
                      },
                      initialBalance: initialBal,
                      finalBalance: finalBal,
                      totalIncomes: totalCredits,
                      totalExpenses: totalDebits,
                    },
                    'xlsx'
                  );
                }}
                onExportCSV={() => {
                  const filtered = bankTransactions
                    .filter((t) => t.accountId === bankAccount.id)
                    .filter((t) => {
                      const matchesSearch = searchTerm.trim() === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchesCat = selectedCategory === 'all' || t.category === selectedCategory;
                      return matchesSearch && matchesCat;
                    });
                  exportBankStatementToExcel(
                    {
                      account: bankAccount,
                      transactions: filtered,
                      filters: {
                        searchTerm: searchTerm.trim() || undefined,
                        category: selectedCategory,
                      },
                      initialBalance: initialBal,
                      finalBalance: finalBal,
                      totalIncomes: totalCredits,
                      totalExpenses: totalDebits,
                    },
                    'csv'
                  );
                }}
                label="Exportar"
              />
            )}

            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-2xs"
            >
              <Plus className="w-4 h-4" />
              <span>{showAddForm ? 'Cancelar' : 'Novo Lançamento'}</span>
            </button>
          </div>
        </div>

        {/* Form to add manual transaction */}
        {showAddForm && (
          <form onSubmit={handleCreateTransaction} className="p-4 bg-indigo-50/70 dark:bg-indigo-950/30 border-b border-indigo-200 dark:border-indigo-900 grid grid-cols-1 sm:grid-cols-5 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Data</label>
              <input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
                className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border rounded text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Descrição</label>
              <input
                type="text"
                placeholder="Ex: Compra Mercado"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                required
                className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border rounded text-slate-800 dark:text-slate-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: -150.00 ou 500"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                required
                className="w-full px-2 py-1 text-sm bg-white dark:bg-slate-800 border rounded text-slate-800 dark:text-slate-100"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded shadow-2xs transition-colors"
              >
                Salvar
              </button>
            </div>
          </form>
        )}

        {/* Statement Items Table */}
        <div className="p-4 max-h-[420px] overflow-y-auto">
          {entityType === 'bank' && bankAccount && (
            <BankStatementList
              account={bankAccount}
              transactions={bankTransactions}
              searchTerm={searchTerm}
              categoryFilter={selectedCategory}
              onDelete={onDeleteBankTx}
            />
          )}

          {entityType === 'card' && creditCard && (
            <CardStatementList
              card={creditCard}
              transactions={cardTransactions}
              selectedMonth={selectedMonth}
              searchTerm={searchTerm}
              categoryFilter={selectedCategory}
              onDelete={onDeleteCardTx}
            />
          )}

          {entityType === 'investment' && investment && (
            <InvestmentStatementList
              investment={investment}
              transactions={investmentTransactions}
              searchTerm={searchTerm}
              onDelete={onDeleteInvestmentTx}
            />
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Conferência de extrato sincronizada com Saldo Inicial</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors"
          >
            Fechar Extrato
          </button>
        </div>
      </div>
    </div>
  );
};

// Helper component for Bank Statements list
function BankStatementList({
  account,
  transactions,
  searchTerm,
  categoryFilter,
  onDelete,
}: {
  account: BankAccount;
  transactions: BankTransaction[];
  searchTerm: string;
  categoryFilter: string;
  onDelete?: (id: string) => void;
}) {
  const filtered = transactions
    .filter((t) => t.accountId === account.id)
    .filter((t) => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
        <p className="font-medium">Nenhum lançamento encontrado no extrato.</p>
        <p className="text-xs opacity-75 mt-0.5">Utilize o leitor de extratos ou adicione um novo lançamento.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-3">Data</th>
            <th className="py-3 px-3">Descrição</th>
            <th className="py-3 px-3">Tipo</th>
            <th className="py-3 px-3">Categoria</th>
            <th className="py-3 px-3 text-right">Valor</th>
            <th className="py-3 px-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((t) => {
            const isIncome = t.amount > 0;
            return (
              <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatDateBR(t.date)}
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">
                  {t.description}
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    {t.type}
                  </span>
                </td>
                <td className="py-2.5 px-3">
                  <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                    {t.category}
                  </span>
                </td>
                <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500 font-bold'}`}>
                  {isIncome ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// Helper component for Credit Card Statements list
function CardStatementList({
  card,
  transactions,
  selectedMonth,
  searchTerm,
  categoryFilter,
  onDelete,
}: {
  card: CreditCard;
  transactions: CardTransaction[];
  selectedMonth: string;
  searchTerm: string;
  categoryFilter: string;
  onDelete?: (id: string) => void;
}) {
  const filtered = transactions
    .filter((t) => t.cardId === card.id && t.invoiceMonth === selectedMonth)
    .filter((t) => t.description.toLowerCase().includes(searchTerm.toLowerCase()))
    .filter((t) => (categoryFilter === 'all' ? true : t.category === categoryFilter))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
        <p className="font-medium">Nenhum lançamento nesta fatura ({formatMonthBR(selectedMonth)}).</p>
        <p className="text-xs opacity-75 mt-0.5">Selecione outro mês para visualizar faturas futuras ou passadas.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-3">Data Compra</th>
            <th className="py-3 px-3">Descrição</th>
            <th className="py-3 px-3">Parcela</th>
            <th className="py-3 px-3">Categoria</th>
            <th className="py-3 px-3 text-right">Valor Na Fatura</th>
            <th className="py-3 px-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((t) => (
            <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
              <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {formatDateBR(t.date)}
              </td>
              <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">
                {t.description}
              </td>
              <td className="py-2.5 px-3 whitespace-nowrap">
                <span className="px-2 py-0.5 rounded text-xs font-semibold bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200/50">
                  {t.currentInstallment}/{t.totalInstallments}
                </span>
              </td>
              <td className="py-2.5 px-3">
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                  {t.category}
                </span>
              </td>
              <td className="py-2.5 px-3 text-right font-bold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                {formatCurrency(t.amount)}
              </td>
              <td className="py-2.5 px-3 text-center">
                {onDelete && (
                  <button
                    onClick={() => onDelete(t.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Helper component for Investment Statements list
function InvestmentStatementList({
  investment,
  transactions,
  searchTerm,
  onDelete,
}: {
  investment: Investment;
  transactions: InvestmentTransaction[];
  searchTerm: string;
  onDelete?: (id: string) => void;
}) {
  const filtered = transactions
    .filter((t) => t.investmentId === investment.id)
    .filter((t) => (t.notes || '').toLowerCase().includes(searchTerm.toLowerCase()))
    .sort((a, b) => b.date.localeCompare(a.date));

  if (filtered.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
        <p className="font-medium">Nenhuma movimentação registrada para este investimento.</p>
        <p className="text-xs opacity-75 mt-0.5">Registre aportes, resgates ou rendimentos recebidos.</p>
      </div>
    );
  }

  return (
    <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
      <table className="w-full text-left border-collapse text-sm">
        <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
          <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            <th className="py-3 px-3">Data</th>
            <th className="py-3 px-3">Tipo de Movimentação</th>
            <th className="py-3 px-3">Observações</th>
            <th className="py-3 px-3 text-right">Valor</th>
            <th className="py-3 px-3 text-center">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
          {filtered.map((t) => {
            const isPositive = t.amount >= 0;
            return (
              <tr key={t.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                  {formatDateBR(t.date)}
                </td>
                <td className="py-2.5 px-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-semibold ${t.type === 'Rendimento' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : t.type === 'Aporte' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' : 'bg-amber-100 text-amber-800'}`}>
                    {t.type}
                  </span>
                </td>
                <td className="py-2.5 px-3 font-medium text-slate-800 dark:text-slate-100">
                  {t.notes || '-'}
                </td>
                <td className={`py-2.5 px-3 text-right font-bold whitespace-nowrap ${isPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                  {isPositive ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {onDelete && (
                    <button
                      onClick={() => onDelete(t.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors"
                      title="Excluir lançamento"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
