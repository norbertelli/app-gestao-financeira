import React, { useState } from 'react';
import { BankAccount, CategoryItem, FuturePayment, PaymentNature, TransactionCategory } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import { formatCurrency, formatDateBR } from '../utils/financeUtils';
import {
  exportFuturePaymentsToPDF,
  exportFuturePaymentsToExcel,
} from '../utils/exportUtils';
import { ExportDropdown } from './ExportDropdown';
import {
  CalendarClock,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  AlertCircle,
  Building2,
  Receipt,
  ArrowRight,
  DollarSign,
  Search,
  RefreshCw,
  Filter,
  ArrowDownCircle,
  ArrowUpCircle,
} from 'lucide-react';

interface FuturePaymentsViewProps {
  futurePayments: FuturePayment[];
  accounts: BankAccount[];
  categories?: CategoryItem[];
  onAddPayment?: (payment: Omit<FuturePayment, 'id'>) => void;
  onEditPayment?: (payment: FuturePayment) => void;
  onDeletePayment?: (id: string) => void;
  onAddFuturePayment?: (payment: Omit<FuturePayment, 'id'>) => void;
  onEditFuturePayment?: (payment: FuturePayment) => void;
  onDeleteFuturePayment?: (id: string) => void;
  onPayPayment: (
    paymentId: string,
    details: { paymentDate: string; bankAccountId: string; paidAmount: number }
  ) => void;
}

const getTodayStr = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// ISOLATED SUB-COMPONENT: Add Future Payment Modal
interface AddFuturePaymentModalProps {
  isOpen: boolean;
  categories?: CategoryItem[];
  onClose: () => void;
  onAdd: (payment: Omit<FuturePayment, 'id'>) => void;
}

const AddFuturePaymentModal: React.FC<AddFuturePaymentModalProps> = ({ isOpen, categories = INITIAL_CATEGORIES, onClose, onAdd }) => {
  const todayStr = getTodayStr();
  const [nature, setNature] = useState<PaymentNature>('Pagar');
  const [dueDate, setDueDate] = useState(todayStr);
  const [description, setDescription] = useState('');
  const [expectedAmount, setExpectedAmount] = useState('');
  const [category, setCategory] = useState<TransactionCategory>(() => categories[0]?.name || 'Moradia');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const calculatedStatus = dueDate < todayStr ? 'Pendente' : 'Em Aberto';

    onAdd({
      dueDate,
      description: description.trim(),
      expectedAmount: parseFloat(expectedAmount) || 0,
      category,
      type: nature,
      paymentType: nature,
      notes: notes.trim(),
      status: calculatedStatus,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-5 h-5 text-amber-500 dark:text-amber-400" />
            <span>Incluir Futuro Lançamento</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre contas a pagar (despesas/boletos) ou contas a receber na previsão de vencimentos.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Nature selector */}
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Tipo de Lançamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setNature('Pagar');
                  if (category === 'Outros') setCategory('Moradia');
                }}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  nature === 'Pagar'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:border-rose-500 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                <span>Conta a Pagar (Saída -)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setNature('Receber');
                }}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  nature === 'Receber'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                <span>Conta a Receber (Entrada +)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Data de Vencimento / Previsão
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              {nature === 'Receber' ? 'Descrição do Recebimento / Cliente' : 'Descrição da Conta / Boleto'}
            </label>
            <input
              type="text"
              placeholder={nature === 'Receber' ? 'Ex: Venda de Consultoria ou Aluguel Recebido' : 'Ex: Boleto Faculdade ou Conta de Luz Enel'}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Valor Previsto (R$)
              </label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 350.00"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                className={`w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black ${
                  nature === 'Receber' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                }`}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observações (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ex: Código de barras, chave PIX ou instruções"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all ${
                nature === 'Receber'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-amber-500 hover:bg-amber-600 text-slate-950 font-black'
              }`}
            >
              Salvar Lançamento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Edit Future Payment Modal
interface EditFuturePaymentModalProps {
  payment: FuturePayment | null;
  categories?: CategoryItem[];
  onClose: () => void;
  onSave: (payment: FuturePayment) => void;
}

const EditFuturePaymentModal: React.FC<EditFuturePaymentModalProps> = ({ payment, categories = INITIAL_CATEGORIES, onClose, onSave }) => {
  if (!payment) return null;

  const todayStr = getTodayStr();
  const [nature, setNature] = useState<PaymentNature>(payment.type || payment.paymentType || 'Pagar');
  const [dueDate, setDueDate] = useState(payment.dueDate);
  const [description, setDescription] = useState(payment.description);
  const [expectedAmount, setExpectedAmount] = useState(payment.expectedAmount.toString());
  const [category, setCategory] = useState<TransactionCategory>(payment.category);
  const [notes, setNotes] = useState(payment.notes || '');

  React.useEffect(() => {
    if (payment) {
      setNature(payment.type || payment.paymentType || 'Pagar');
      setDueDate(payment.dueDate);
      setDescription(payment.description);
      setExpectedAmount(payment.expectedAmount.toString());
      setCategory(payment.category);
      setNotes(payment.notes || '');
    }
  }, [payment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const calculatedStatus =
      payment.status === 'Pago' ? 'Pago' : dueDate < todayStr ? 'Pendente' : 'Em Aberto';

    onSave({
      ...payment,
      dueDate,
      description: description.trim(),
      expectedAmount: parseFloat(expectedAmount) || 0,
      category,
      type: nature,
      paymentType: nature,
      notes: notes.trim(),
      status: calculatedStatus,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <span>Alterar Compromisso Futuro</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Edite as informações da conta antes de liquidar.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
              Tipo de Lançamento
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setNature('Pagar')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  nature === 'Pagar'
                    ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/60 dark:border-rose-500 dark:text-rose-300 ring-2 ring-rose-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <ArrowDownCircle className="w-4 h-4 text-rose-600" />
                <span>Conta a Pagar (Saída -)</span>
              </button>
              <button
                type="button"
                onClick={() => setNature('Receber')}
                className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  nature === 'Receber'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/60 dark:border-emerald-500 dark:text-emerald-300 ring-2 ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                }`}
              >
                <ArrowUpCircle className="w-4 h-4 text-emerald-600" />
                <span>Conta a Receber (Entrada +)</span>
              </button>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Data de Vencimento / Previsão
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Descrição
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Valor Previsto (R$)
              </label>
              <input
                type="number"
                step="0.01"
                value={expectedAmount}
                onChange={(e) => setExpectedAmount(e.target.value)}
                className={`w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black ${
                  nature === 'Receber' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100'
                }`}
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Categoria
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name} ({cat.type})
                  </option>
                ))}
                {!categories.some((c) => c.name === category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Observações
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-900/30 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Pay / Liquidate Modal
interface PayFuturePaymentModalProps {
  payment: FuturePayment | null;
  accounts: BankAccount[];
  onClose: () => void;
  onConfirmPay: (paymentId: string, details: { paymentDate: string; bankAccountId: string; paidAmount: number }) => void;
}

const PayFuturePaymentModal: React.FC<PayFuturePaymentModalProps> = ({
  payment,
  accounts,
  onClose,
  onConfirmPay,
}) => {
  if (!payment) return null;

  const todayStr = getTodayStr();
  const isReceipt = payment.type === 'Receber' || payment.paymentType === 'Receber';
  const [payDate, setPayDate] = useState(todayStr);
  const [selectedBankAccountId, setSelectedBankAccountId] = useState(accounts[0]?.id || '');
  const [paidAmount, setPaidAmount] = useState(payment.expectedAmount.toString());

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBankAccountId) return;

    const finalPaidVal = parseFloat(paidAmount) || payment.expectedAmount;

    onConfirmPay(payment.id, {
      paymentDate: payDate,
      bankAccountId: selectedBankAccountId,
      paidAmount: finalPaidVal,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <CheckCircle2 className="w-6 h-6" />
            <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
              {isReceipt ? 'Confirmar Recebimento (Entrada +)' : 'Liquidar Pagamento (Saída -)'}
            </h3>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {isReceipt
              ? 'O valor recebido será creditado com sinal POSITIVO (+) no extrato bancário.'
              : 'O valor pago será debitado com sinal NEGATIVO (-) no extrato bancário.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div
            className={`p-3 rounded-xl border ${
              isReceipt
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800'
            }`}
          >
            <span
              className={`text-[11px] font-bold block uppercase tracking-wider ${
                isReceipt ? 'text-emerald-800 dark:text-emerald-300' : 'text-amber-800 dark:text-amber-300'
              }`}
            >
              {isReceipt ? 'Recebimento a Confirmar:' : 'Conta a Liquidar:'}
            </span>
            <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block mt-0.5">
              {payment.description}
            </span>
            <span className="text-xs text-slate-500">
              Valor previsto: {formatCurrency(payment.expectedAmount)}
            </span>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isReceipt ? 'Data do Recebimento Efetuado' : 'Data do Pagamento Efetuado'}
            </label>
            <input
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isReceipt ? 'Conta Bancária de Destino (Crédito +)' : 'Banco Utilizado para Pagamento (Débito -)'}
            </label>
            <select
              value={selectedBankAccountId}
              onChange={(e) => setSelectedBankAccountId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-900 dark:text-slate-100"
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.bankName} (Banco {acc.bankCode}) - Ag: {acc.agency} C/C: {acc.accountNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
              {isReceipt ? 'Valor Efetivamente Recebido (R$)' : 'Valor Efetivamente Pago (R$)'}
            </label>
            <input
              type="number"
              step="0.01"
              value={paidAmount}
              onChange={(e) => setPaidAmount(e.target.value)}
              className={`w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black ${
                isReceipt ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={`px-4 py-2.5 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5 ${
                isReceipt ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>
                {isReceipt
                  ? 'Confirmar Recebimento e Creditar (+) no Extrato'
                  : 'Confirmar Pagamento e Debitar (-) no Extrato'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const FuturePaymentsView: React.FC<FuturePaymentsViewProps> = ({
  futurePayments,
  accounts,
  categories = INITIAL_CATEGORIES,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
  onAddFuturePayment,
  onEditFuturePayment,
  onDeleteFuturePayment,
  onPayPayment,
}) => {
  const activeCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;
  const handleAdd = onAddPayment || onAddFuturePayment;
  const handleEdit = onEditPayment || onEditFuturePayment;
  const handleDelete = onDeletePayment || onDeleteFuturePayment;

  const todayStr = getTodayStr();

  const getComputedStatus = (item: FuturePayment) => {
    if (item.status === 'Pago') return 'Pago';
    if (item.dueDate < todayStr) return 'Pendente';
    return 'Em Aberto';
  };

  const unpaidPayments = futurePayments.filter((p) => p.status !== 'Pago');
  const pendingPayments = unpaidPayments.filter((p) => p.dueDate < todayStr);
  const openPayments = unpaidPayments.filter((p) => p.dueDate >= todayStr);

  // Modal triggers
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<FuturePayment | null>(null);
  const [payingPayment, setPayingPayment] = useState<FuturePayment | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<FuturePayment | null>(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'unpaid' | 'Pendente' | 'Em Aberto' | 'Pago'>('unpaid');
  const [natureFilter, setNatureFilter] = useState<'all' | 'Pagar' | 'Receber'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Filtered payments
  const filteredPayments = futurePayments.filter((p) => {
    const computedStatus = getComputedStatus(p);
    const itemNature: PaymentNature = p.type || p.paymentType || 'Pagar';
    const matchesSearch =
      searchTerm.trim() === '' ||
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.notes && p.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCat = categoryFilter === 'all' || p.category === categoryFilter;
    const matchesNature = natureFilter === 'all' || itemNature === natureFilter;

    let matchesStatus = true;
    if (statusFilter === 'unpaid') {
      matchesStatus = p.status !== 'Pago';
    } else if (statusFilter === 'Pendente') {
      matchesStatus = computedStatus === 'Pendente';
    } else if (statusFilter === 'Em Aberto') {
      matchesStatus = computedStatus === 'Em Aberto';
    } else if (statusFilter === 'Pago') {
      matchesStatus = p.status === 'Pago';
    }

    return matchesSearch && matchesCat && matchesStatus && matchesNature;
  });

  const filteredPendingVal = filteredPayments
    .filter((p) => getComputedStatus(p) === 'Pendente')
    .reduce((acc, p) => acc + p.expectedAmount, 0);

  const filteredOpenVal = filteredPayments
    .filter((p) => getComputedStatus(p) === 'Em Aberto')
    .reduce((acc, p) => acc + p.expectedAmount, 0);

  const filteredPaidVal = filteredPayments
    .filter((p) => p.status === 'Pago')
    .reduce((acc, p) => acc + p.expectedAmount, 0);

  const filteredUnpaidVal = filteredPendingVal + filteredOpenVal;

  // Export handlers
  const handleExportPDF = () => {
    exportFuturePaymentsToPDF({
      payments: filteredPayments,
      filters: {
        status: statusFilter === 'unpaid' ? 'all' : (statusFilter as any),
        category: categoryFilter,
        searchTerm: searchTerm.trim() || undefined,
      },
      totalPending: filteredPendingVal,
      totalOpen: filteredOpenVal,
      totalPaid: filteredPaidVal,
      totalUnpaid: filteredUnpaidVal,
    });
  };

  const handleExportXLSX = () => {
    exportFuturePaymentsToExcel(
      {
        payments: filteredPayments,
        filters: {
          status: statusFilter === 'unpaid' ? 'all' : (statusFilter as any),
          category: categoryFilter,
          searchTerm: searchTerm.trim() || undefined,
        },
        totalPending: filteredPendingVal,
        totalOpen: filteredOpenVal,
        totalPaid: filteredPaidVal,
        totalUnpaid: filteredUnpaidVal,
      },
      'xlsx'
    );
  };

  const handleExportCSV = () => {
    exportFuturePaymentsToExcel(
      {
        payments: filteredPayments,
        filters: {
          status: statusFilter === 'unpaid' ? 'all' : (statusFilter as any),
          category: categoryFilter,
          searchTerm: searchTerm.trim() || undefined,
        },
        totalPending: filteredPendingVal,
        totalOpen: filteredOpenVal,
        totalPaid: filteredPaidVal,
        totalUnpaid: filteredUnpaidVal,
      },
      'csv'
    );
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="w-7 h-7 text-amber-500 dark:text-amber-400" />
            <span>Futuros Pagamentos (Contas a Pagar & Receber)</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Projete compromissos futuros. Ao dar baixa, contas a pagar debitam (-R$) e contas a receber creditam (+R$) no extrato bancário.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportDropdown
            onExportPDF={handleExportPDF}
            onExportXLSX={handleExportXLSX}
            onExportCSV={handleExportCSV}
            label="Exportar Contas"
            totalRecordsCount={filteredPayments.length}
          />

          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs transition-all shadow-md shadow-amber-900/20"
          >
            <Plus className="w-4 h-4" />
            <span>Incluir Novo Pagamento / Recebimento</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
          <span className="text-xs font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider block">
            Pendente (Vencidos)
          </span>
          <span className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1 block">
            {formatCurrency(filteredPendingVal)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredPayments.filter((p) => getComputedStatus(p) === 'Pendente').length} conta(s) com vencimento retroativo
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
          <span className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider block">
            Em Aberto (A Vencer)
          </span>
          <span className="text-2xl font-black text-amber-500 mt-1 block">
            {formatCurrency(filteredOpenVal)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredPayments.filter((p) => getComputedStatus(p) === 'Em Aberto').length} conta(s) a vencer
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
            Total a Liquidar
          </span>
          <span className="text-2xl font-black text-slate-800 dark:text-slate-100 mt-1 block">
            {formatCurrency(filteredUnpaidVal)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredPayments.filter((p) => p.status !== 'Pago').length} compromisso(s) em aberto
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
          <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
            Já Liquidados (Histórico)
          </span>
          <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">
            {formatCurrency(filteredPaidVal)}
          </span>
          <span className="text-xs text-slate-400 mt-1 block">
            {filteredPayments.filter((p) => p.status === 'Pago').length} conta(s) quitadas
          </span>
        </div>
      </div>

      {/* Table of Future Payments */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-500" />
            <span>Tabela de Compromissos Futuros a Pagar ou Receber</span>
          </h2>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-200/60">
              {pendingPayments.length} Pendentes
            </span>
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200/60">
              {openPayments.length} Em Aberto
            </span>
            <ExportDropdown
              onExportPDF={handleExportPDF}
              onExportXLSX={handleExportXLSX}
              onExportCSV={handleExportCSV}
              label="Exportar"
              totalRecordsCount={filteredPayments.length}
            />
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar contas por descrição ou observação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 text-slate-800 dark:text-slate-200"
              />
            </div>

            {/* Nature / Type Filter (Pagar / Receber) */}
            <select
              value={natureFilter}
              onChange={(e) => setNatureFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-bold"
            >
              <option value="all">Todos os Tipos (Pagar & Receber)</option>
              <option value="Pagar">🔴 Contas a Pagar (Saídas -)</option>
              <option value="Receber">🟢 Contas a Receber (Entradas +)</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="unpaid">Contas a Liquidar (Pendentes + Em Aberto)</option>
              <option value="Pendente">Apenas Pendentes (Vencidos)</option>
              <option value="Em Aberto">Apenas Em Aberto (A Vencer)</option>
              <option value="Pago">Apenas Já Liquidados (Histórico)</option>
              <option value="all">Todas as Contas (Incluindo Liquidadas)</option>
            </select>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">Todas as Categorias</option>
              {activeCategories.map((cat) => (
                <option key={cat.id} value={cat.name}>
                  {cat.name}
                </option>
              ))}
            </select>

            {(searchTerm || statusFilter !== 'unpaid' || natureFilter !== 'all' || categoryFilter !== 'all') && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('unpaid');
                  setNatureFilter('all');
                  setCategoryFilter('all');
                }}
                className="px-2.5 py-1.5 text-xs text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl font-semibold transition-colors flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Limpar</span>
              </button>
            )}
          </div>
        </div>

        <div className="p-6">
          {filteredPayments.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <CheckCircle2 className="w-10 h-10 mx-auto mb-2 text-emerald-500 opacity-80" />
              <p className="font-bold text-slate-700 dark:text-slate-300 text-sm">
                Nenhum compromisso financeiro correspondente aos filtros!
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Tente ajustar a busca, tipo ou status selecionado acima, ou clique em "Incluir Novo Pagamento / Recebimento".
              </p>
            </div>
          ) : (
            <div className="max-h-[460px] overflow-y-auto relative border border-slate-200 dark:border-slate-800 rounded-xl">
              <table className="w-full text-left border-collapse text-sm">
                <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-3">Data Vencimento</th>
                    <th className="py-3 px-3">Tipo / Natureza</th>
                    <th className="py-3 px-3">Descrição da Conta / Boleto</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Categoria</th>
                    <th className="py-3 px-3">Observações</th>
                    <th className="py-3 px-3 text-right">Valor Previsto</th>
                    <th className="py-3 px-3 text-center">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredPayments
                    .slice()
                    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
                    .map((item) => {
                      const status = getComputedStatus(item);
                      const isReceipt = item.type === 'Receber' || item.paymentType === 'Receber';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-bold whitespace-nowrap text-slate-800 dark:text-slate-200">
                            {formatDateBR(item.dueDate)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {isReceipt ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                <ArrowUpCircle className="w-3 h-3 text-emerald-600" />
                                <span>A Receber</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                <ArrowDownCircle className="w-3 h-3 text-rose-600" />
                                <span>A Pagar</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">
                            {item.description}
                          </td>
                          <td className="py-3 px-3">
                            {status === 'Pendente' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
                                <AlertCircle className="w-3 h-3" />
                                <span>Pendente</span>
                              </span>
                            ) : status === 'Em Aberto' ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
                                <CalendarClock className="w-3 h-3" />
                                <span>Em Aberto</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-md bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
                                <CheckCircle2 className="w-3 h-3" />
                                <span>{isReceipt ? 'Recebido' : 'Pago'}</span>
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-xs text-slate-500 max-w-xs truncate">
                            {item.notes || '-'}
                          </td>
                          <td
                            className={`py-3 px-3 text-right font-black whitespace-nowrap ${
                              isReceipt
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-slate-900 dark:text-slate-100'
                            }`}
                          >
                            {isReceipt
                              ? `+ ${formatCurrency(item.expectedAmount)}`
                              : `- ${formatCurrency(item.expectedAmount)}`}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              {/* Liquidar / Pagar / Receber Button */}
                              {item.status !== 'Pago' ? (
                                <button
                                  onClick={() => setPayingPayment(item)}
                                  className={`inline-flex items-center gap-1 px-3 py-1 text-white rounded-lg text-xs font-bold transition-all shadow-xs ${
                                    isReceipt
                                      ? 'bg-emerald-600 hover:bg-emerald-700'
                                      : 'bg-indigo-600 hover:bg-indigo-700'
                                  }`}
                                  title={
                                    isReceipt
                                      ? 'Marcar como Recebido e creditar (+) no banco'
                                      : 'Marcar como Pago e debitar (-) no banco'
                                  }
                                >
                                  <DollarSign className="w-3.5 h-3.5" />
                                  <span>{isReceipt ? 'Receber' : 'Pagar'}</span>
                                </button>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs text-emerald-600 font-semibold bg-emerald-50 dark:bg-emerald-950/50 rounded-lg">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>{isReceipt ? 'Recebido' : 'Quitado'}</span>
                                </span>
                              )}

                              {/* Alterar / Edit Button */}
                              <button
                                onClick={() => setEditingPayment(item)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Alterar registro"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>

                              {/* Excluir / Delete Button */}
                              <button
                                onClick={() => setPaymentToDelete(item)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                title="Excluir registro"
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

      {/* ISOLATED MODALS */}
      <AddFuturePaymentModal
        isOpen={showAddModal}
        categories={activeCategories}
        onClose={() => setShowAddModal(false)}
        onAdd={(p) => {
          if (handleAdd) handleAdd(p);
        }}
      />

      <EditFuturePaymentModal
        key={editingPayment?.id || 'edit-payment-modal'}
        payment={editingPayment}
        categories={activeCategories}
        onClose={() => setEditingPayment(null)}
        onSave={(p) => {
          if (handleEdit) handleEdit(p);
        }}
      />

      <PayFuturePaymentModal
        payment={payingPayment}
        accounts={accounts}
        onClose={() => setPayingPayment(null)}
        onConfirmPay={(paymentId, details) => {
          onPayPayment(paymentId, details);
        }}
      />

      {/* Confirmation Modal - Delete Future Payment */}
      {paymentToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Compromisso Agendado</h3>
                <p className="text-xs text-slate-500">Confirmar exclusão de registro futuro</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {paymentToDelete.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Vencimento: {formatDateBR(paymentToDelete.dueDate)} | Categoria: {paymentToDelete.category}
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white pt-1">
                Valor Previsto: {formatCurrency(paymentToDelete.expectedAmount)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPaymentToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  if (handleDelete) {
                    handleDelete(paymentToDelete.id);
                  }
                  setPaymentToDelete(null);
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
