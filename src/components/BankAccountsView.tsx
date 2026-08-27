import React, { useState } from 'react';
import { BankAccount, BankTransaction, CreditCard, TransactionCategory, TransactionType } from '../types';
import {
  formatCurrency,
  calculateAccountFinalBalance,
  formatDateBR,
  getCurrentYearMonth,
  formatMonthBR,
} from '../utils/financeUtils';
import {
  exportBankStatementToPDF,
  exportBankStatementToExcel,
} from '../utils/exportUtils';
import { ExportDropdown } from './ExportDropdown';
import {
  Building2,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  CheckCircle2,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  AlertTriangle,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface BankAccountsViewProps {
  accounts: BankAccount[];
  bankTransactions: BankTransaction[];
  cards?: CreditCard[];
  onAddAccount: (account: Omit<BankAccount, 'id'>) => void;
  onEditAccount: (account: BankAccount) => void;
  onDeleteAccount: (id: string) => void;
  onAddTransaction: (tx: Omit<BankTransaction, 'id'>) => void;
  onEditTransaction: (tx: BankTransaction) => void;
  onDeleteTransaction: (id: string) => void;
  onOpenStatementModal: (type: 'bank', entity: BankAccount) => void;
}

export const BankAccountsView: React.FC<BankAccountsViewProps> = ({
  accounts,
  bankTransactions,
  cards = [],
  onAddAccount,
  onEditAccount,
  onDeleteAccount,
  onAddTransaction,
  onEditTransaction,
  onDeleteTransaction,
  onOpenStatementModal,
}) => {
  const [selectedAccountId, setSelectedAccountId] = useState<string>(accounts[0]?.id || '');
  const [showAddAccModal, setShowAddAccModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);

  // Deletion Modals state
  const [accountToDelete, setAccountToDelete] = useState<BankAccount | null>(null);
  const [transactionToDelete, setTransactionToDelete] = useState<BankTransaction | null>(null);

  // Transaction modals
  const [showAddTxModal, setShowAddTxModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<BankTransaction | null>(null);

  // Account Form state
  const [bankCode, setBankCode] = useState('341');
  const [bankName, setBankName] = useState('Itaú Unibanco');
  const [agency, setAgency] = useState('0001');
  const [accountNumber, setAccountNumber] = useState('12345-6');
  const [accType, setAccType] = useState<any>('Corrente');
  const [initialBal, setInitialBal] = useState('1000');
  const [color, setColor] = useState('#3B82F6');

  // Transaction Form state
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<TransactionCategory>('Outros');
  const [txType, setTxType] = useState<TransactionType>('PIX');
  const [txIsExpense, setTxIsExpense] = useState(true);

  // Filter states for Extrato Bancário
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');

  const selectedAccount = accounts.find((a) => a.id === selectedAccountId) || accounts[0];

  // Filtered transactions for selected account
  const accountTransactions = bankTransactions.filter((t) => t.accountId === selectedAccount?.id);
  const filteredTransactions = accountTransactions.filter((t) => {
    const matchesSearch = searchTerm.trim() === '' || t.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    const matchesMonth = selectedMonth === 'all' || t.date.startsWith(selectedMonth);
    return matchesSearch && matchesCategory && matchesType && matchesMonth;
  });

  const totalIncomes = filteredTransactions.filter((t) => t.amount > 0).reduce((acc, t) => acc + t.amount, 0);
  const totalExpenses = Math.abs(filteredTransactions.filter((t) => t.amount < 0).reduce((acc, t) => acc + t.amount, 0));
  const periodBalance = totalIncomes - totalExpenses;
  const calculatedFinalBal = selectedAccount ? calculateAccountFinalBalance(selectedAccount, bankTransactions) : 0;

  // Available unique months from transactions for filter dropdown
  const availableMonths = Array.from(new Set<string>(accountTransactions.map((t) => t.date.substring(0, 7)))).sort().reverse();

  // Export handlers
  const handleExportPDF = () => {
    if (!selectedAccount) return;
    exportBankStatementToPDF({
      account: selectedAccount,
      transactions: filteredTransactions,
      filters: {
        searchTerm: searchTerm.trim() || undefined,
        category: selectedCategory,
        type: selectedType,
        month: selectedMonth,
      },
      initialBalance: selectedAccount.initialBalance,
      finalBalance: calculatedFinalBal,
      totalIncomes,
      totalExpenses,
    });
  };

  const handleExportXLSX = () => {
    if (!selectedAccount) return;
    exportBankStatementToExcel(
      {
        account: selectedAccount,
        transactions: filteredTransactions,
        filters: {
          searchTerm: searchTerm.trim() || undefined,
          category: selectedCategory,
          type: selectedType,
          month: selectedMonth,
        },
        initialBalance: selectedAccount.initialBalance,
        finalBalance: calculatedFinalBal,
        totalIncomes,
        totalExpenses,
      },
      'xlsx'
    );
  };

  const handleExportCSV = () => {
    if (!selectedAccount) return;
    exportBankStatementToExcel(
      {
        account: selectedAccount,
        transactions: filteredTransactions,
        filters: {
          searchTerm: searchTerm.trim() || undefined,
          category: selectedCategory,
          type: selectedType,
          month: selectedMonth,
        },
        initialBalance: selectedAccount.initialBalance,
        finalBalance: calculatedFinalBal,
        totalIncomes,
        totalExpenses,
      },
      'csv'
    );
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    onAddAccount({
      bankCode,
      bankName,
      agency,
      accountNumber,
      type: accType,
      initialBalance: parseFloat(initialBal) || 0,
      color,
      openFinanceConnected: true,
      lastSyncAt: new Date().toISOString(),
    });
    setShowAddAccModal(false);
  };

  const handleOpenEditAccount = (acc: BankAccount) => {
    setEditingAccount(acc);
    setBankCode(acc.bankCode);
    setBankName(acc.bankName);
    setAgency(acc.agency);
    setAccountNumber(acc.accountNumber);
    setAccType(acc.type);
    setInitialBal(acc.initialBalance.toString());
    setColor(acc.color);
  };

  const handleSaveEditAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    onEditAccount({
      ...editingAccount,
      bankCode,
      bankName,
      agency,
      accountNumber,
      type: accType,
      initialBalance: parseFloat(initialBal) || 0,
      color,
    });
    setEditingAccount(null);
  };

  // Transaction Handlers
  const handleOpenAddTx = () => {
    setTxDate(new Date().toISOString().split('T')[0]);
    setTxDesc('');
    setTxAmount('');
    setTxCategory('Outros');
    setTxType('PIX');
    setTxIsExpense(true);
    setShowAddTxModal(true);
  };

  const handleSaveAddTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !txDesc.trim()) return;
    const val = parseFloat(txAmount) || 0;
    const finalVal = txIsExpense ? -Math.abs(val) : Math.abs(val);

    onAddTransaction({
      accountId: selectedAccount.id,
      date: txDate,
      description: txDesc.trim(),
      amount: finalVal,
      category: txCategory,
      type: txType,
      status: 'Concluído',
    });

    setShowAddTxModal(false);
  };

  const handleOpenEditTx = (t: BankTransaction) => {
    setEditingTransaction(t);
    setTxDate(t.date);
    setTxDesc(t.description);
    setTxAmount(Math.abs(t.amount).toString());
    setTxCategory(t.category);
    setTxType(t.type);
    setTxIsExpense(t.amount < 0);
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction || !txDesc.trim()) return;
    const val = parseFloat(txAmount) || 0;
    const finalVal = txIsExpense ? -Math.abs(val) : Math.abs(val);

    onEditTransaction({
      ...editingTransaction,
      date: txDate,
      description: txDesc.trim(),
      amount: finalVal,
      category: txCategory,
      type: txType,
    });

    setEditingTransaction(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Building2 className="w-7 h-7 text-indigo-600 dark:text-indigo-400" />
            <span>Contas Bancárias & Extratos por Banco</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gerencie e realize inclusão, alteração e exclusão de contas e transações bancárias.
          </p>
        </div>

        <button
          onClick={() => setShowAddAccModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-indigo-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta Bancária</span>
        </button>
      </div>

      {/* Grid of Bank Accounts Cards or Empty State */}
      {accounts.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-indigo-600 dark:text-indigo-400">
            <Building2 className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Nenhuma conta bancária cadastrada</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Todas as contas foram excluídas com sucesso. Clique abaixo para cadastrar uma nova conta.
          </p>
          <button
            onClick={() => setShowAddAccModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Nova Conta</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => {
            const finalBal = calculateAccountFinalBalance(acc, bankTransactions);
            const isSelected = acc.id === selectedAccountId;

            return (
              <div
                key={acc.id}
                onClick={() => setSelectedAccountId(acc.id)}
                className={`p-5 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-indigo-500 shadow-lg ring-2 ring-indigo-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                      Banco {acc.bankCode}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditAccount(acc);
                        }}
                        className="p-1 text-slate-400 hover:text-white transition-colors"
                        title="Editar Conta Bancária"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAccountToDelete(acc);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir Conta Bancária e Transações"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-bold text-lg leading-tight">{acc.bankName}</h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    Ag: {acc.agency} | C/C: {acc.accountNumber} ({acc.type})
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-700/40">
                  <span className="text-[11px] opacity-70 block uppercase tracking-wider">
                    Saldo Final Calculado
                  </span>
                  <span className={`text-xl font-black ${finalBal < 0 ? 'text-red-500 font-bold' : 'text-emerald-400'}`}>
                    {formatCurrency(finalBal)}
                  </span>
                  <span className={`text-[10px] opacity-60 block mt-0.5 ${acc.initialBalance < 0 ? 'text-red-400 font-bold' : ''}`}>
                    Saldo Inicial: {formatCurrency(acc.initialBalance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Account Detail & Extrato Section */}
      {selectedAccount && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: selectedAccount.color }} />
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                  Extrato: {selectedAccount.bankName}
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Agência {selectedAccount.agency} | Conta {selectedAccount.accountNumber} ({selectedAccount.type})
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ExportDropdown
                onExportPDF={handleExportPDF}
                onExportXLSX={handleExportXLSX}
                onExportCSV={handleExportCSV}
                label="Exportar Extrato"
                totalRecordsCount={filteredTransactions.length}
              />

              <button
                onClick={handleOpenAddTx}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Incluir Lançamento</span>
              </button>

              <button
                onClick={() => onOpenStatementModal('bank', selectedAccount)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Auditar Extrato</span>
              </button>
            </div>
          </div>

          {/* Filter Bar & Consolidated Summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800 space-y-3">
            {/* Filter Inputs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Buscar lançamentos no extrato (ex: PIX, Salário, Mercado)..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 text-slate-800 dark:text-slate-200"
                />
              </div>

              {/* Month */}
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">Todos os Meses</option>
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {formatMonthBR(m)}
                  </option>
                ))}
              </select>

              {/* Category */}
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">Todas Categorias</option>
                <option value="Salário/Renda">Salário/Renda</option>
                <option value="Alimentação">Alimentação</option>
                <option value="Transporte">Transporte</option>
                <option value="Moradia">Moradia</option>
                <option value="Saúde">Saúde</option>
                <option value="Educação">Educação</option>
                <option value="Lazer">Lazer</option>
                <option value="Investimentos">Investimentos</option>
                <option value="Transferência">Transferência</option>
                <option value="Tarifa/Imposto">Tarifa/Imposto</option>
                <option value="Outros">Outros</option>
              </select>

              {/* Type */}
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">Todos os Tipos</option>
                <option value="PIX">PIX</option>
                <option value="TED/DOC">TED/DOC</option>
                <option value="Boleto">Boleto</option>
                <option value="Cartão">Cartão</option>
                <option value="Transferência">Transferência</option>
                <option value="Dinheiro">Dinheiro</option>
                <option value="Outro">Outro</option>
              </select>

              {(searchTerm || selectedCategory !== 'all' || selectedType !== 'all' || selectedMonth !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                    setSelectedType('all');
                    setSelectedMonth('all');
                  }}
                  className="px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-semibold transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Limpar</span>
                </button>
              )}
            </div>

            {/* Consolidated KPI Summary for Filtered View */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-700/60">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Lançamentos Filtrados
                </span>
                <span className="text-sm font-black text-slate-800 dark:text-slate-200">
                  {filteredTransactions.length} de {accountTransactions.length}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-emerald-200/70 dark:border-emerald-900/40">
                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                  Total Entradas (+)
                </span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                  +{formatCurrency(totalIncomes)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-rose-200/70 dark:border-rose-900/40">
                <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
                  Total Saídas (-)
                </span>
                <span className="text-sm font-black text-rose-600 dark:text-rose-400">
                  -{formatCurrency(totalExpenses)}
                </span>
              </div>

              <div className="bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-indigo-200/70 dark:border-indigo-900/40">
                <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider block">
                  Saldo do Período
                </span>
                <span
                  className={`text-sm font-black ${
                    periodBalance < 0 ? 'text-red-500 font-bold' : 'text-indigo-600 dark:text-indigo-400'
                  }`}
                >
                  {formatCurrency(periodBalance)}
                </span>
              </div>
            </div>
          </div>

          {/* Extrato Table for Selected Account */}
          <div className="p-6">
            {filteredTransactions.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                {accountTransactions.length === 0
                  ? 'Nenhum lançamento no extrato desta conta. Clique em "Incluir Lançamento" para cadastrar.'
                  : 'Nenhum lançamento corresponde aos filtros selecionados. Tente ajustar a busca.'}
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto relative border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Descrição</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3 text-right">Valor</th>
                      <th className="py-3 px-3 text-center">Ações (Alterar/Excluir)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredTransactions
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((t) => {
                        const isIncome = t.amount > 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-medium whitespace-nowrap">{formatDateBR(t.date)}</td>
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">{t.description}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800">
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                                {t.category}
                              </span>
                            </td>
                            <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${isIncome ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500 font-bold'}`}>
                              {isIncome ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditTx(t)}
                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                  title="Alterar Registro"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setTransactionToDelete(t)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Excluir Registro"
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
        </div>
      )}

      {/* Modal Add Account */}
      {showAddAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-xl">
            <h3 className="text-xl font-bold mb-4">Adicionar Nova Conta Bancária</h3>
            <form onSubmit={handleCreateAccount} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Código do Banco (ex: 341)</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Nome do Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Agência</label>
                  <input
                    type="text"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Número da Conta</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBal}
                  onChange={(e) => setInitialBal(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAccModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Cadastrar Conta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Account */}
      {editingAccount && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-xl">
            <h3 className="text-xl font-bold mb-4">Alterar Conta Bancária</h3>
            <form onSubmit={handleSaveEditAccount} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Código do Banco</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Nome do Banco</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Agência</label>
                  <input
                    type="text"
                    value={agency}
                    onChange={(e) => setAgency(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Número da Conta</label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBal}
                  onChange={(e) => setInitialBal(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const acc = editingAccount;
                    setEditingAccount(null);
                    setAccountToDelete(acc);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Conta</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingAccount(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-medium text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-xs shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add / Edit Transaction */}
      {(showAddTxModal || editingTransaction) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-xl">
            <h3 className="text-xl font-bold mb-4">
              {editingTransaction ? 'Alterar Lançamento Bancário' : 'Incluir Lançamento Bancário'}
            </h3>
            <form onSubmit={editingTransaction ? handleSaveEditTx : handleSaveAddTx} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Data</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Descrição do Lançamento</label>
                <input
                  type="text"
                  placeholder="Ex: Salário, Supermercado, Pix Recebido"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Valor (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 150.00"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">Natureza</label>
                  <select
                    value={txIsExpense ? 'debit' : 'credit'}
                    onChange={(e) => setTxIsExpense(e.target.value === 'debit')}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  >
                    <option value="debit">Débito / Saída (-)</option>
                    <option value="credit">Crédito / Entrada (+)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Categoria</label>
                  <select
                    value={txCategory}
                    onChange={(e) => setTxCategory(e.target.value as any)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  >
                    <option value="Alimentação">Alimentação</option>
                    <option value="Transporte">Transporte</option>
                    <option value="Moradia">Moradia</option>
                    <option value="Saúde">Saúde</option>
                    <option value="Lazer">Lazer</option>
                    <option value="Salário">Salário</option>
                    <option value="Serviços">Serviços</option>
                    <option value="Tarifa/Imposto">Tarifa/Imposto</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold">Tipo</label>
                  <select
                    value={txType}
                    onChange={(e) => setTxType(e.target.value as any)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  >
                    <option value="PIX">PIX</option>
                    <option value="TED">TED</option>
                    <option value="Boleto">Boleto</option>
                    <option value="Cartão">Cartão</option>
                    <option value="Tarifa">Tarifa</option>
                    <option value="Rendimento">Rendimento</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddTxModal(false);
                    setEditingTransaction(null);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete Account */}
      {accountToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Conta Bancária</h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {accountToDelete.bankName} (Banco {accountToDelete.bankCode})
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Agência: {accountToDelete.agency} | C/C: {accountToDelete.accountNumber} ({accountToDelete.type})
              </p>

              {(() => {
                const linkedTxs = bankTransactions.filter((t) => t.accountId === accountToDelete.id).length;
                const linkedCards = cards.filter((c) => c.bankId === accountToDelete.id).length;
                return (
                  <div className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Atenção: Ao excluir esta conta, <strong>{linkedTxs} transação(ões)</strong> do extrato bancário
                      {linkedCards > 0 ? ` e ${linkedCards} cartão(ões) de crédito vinculado(s)` : ''} serão excluídos permanentemente.
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setAccountToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = accountToDelete.id;
                  onDeleteAccount(idToDelete);
                  const remaining = accounts.filter((a) => a.id !== idToDelete);
                  setSelectedAccountId(remaining[0]?.id || '');
                  setAccountToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 transition-colors"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete Bank Transaction */}
      {transactionToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Lançamento</h3>
                <p className="text-xs text-slate-500">Confirmar exclusão no extrato</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {transactionToDelete.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data: {formatDateBR(transactionToDelete.date)} | Categoria: {transactionToDelete.category}
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white pt-1">
                Valor: {formatCurrency(transactionToDelete.amount)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTransactionToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteTransaction(transactionToDelete.id);
                  setTransactionToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 transition-colors"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
