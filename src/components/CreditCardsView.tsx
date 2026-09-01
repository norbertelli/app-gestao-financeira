import React, { useState, useEffect, useMemo } from 'react';
import { CreditCard, CardTransaction, TransactionCategory, CategoryItem } from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import {
  formatCurrency,
  formatDateBR,
  formatMonthBR,
  calculateCardCurrentInvoice,
  calculateCardTotalOutstanding,
  calculateCardAvailableLimit,
  calculateCardUsedLimitPercent,
  getCurrentYearMonth,
  calculateFirstInvoiceMonth,
  getNextInvoiceMonth,
  generateInstallmentsSchedule,
} from '../utils/financeUtils';
import {
  CreditCard as CardIcon,
  Plus,
  Calendar,
  Check,
  Trash2,
  Edit3,
  ExternalLink,
  AlertCircle,
  Clock,
  Layers,
  AlertTriangle,
  ShieldCheck,
  Percent,
  TrendingDown,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  Info,
} from 'lucide-react';

interface CreditCardsViewProps {
  cards: CreditCard[];
  cardTransactions: CardTransaction[];
  categories?: CategoryItem[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  onAddCardTransaction: (tx: Omit<CardTransaction, 'id'>) => void;
  onEditCardTransaction: (tx: CardTransaction) => void;
  onDeleteCardTransaction: (id: string) => void;
  onOpenStatementModal: (type: 'card', entity: CreditCard) => void;
}

const CARD_BANK_PRESETS = [
  { name: 'Nubank Ultravioleta', bankName: 'Nu Pagamentos (Nubank)', brand: 'mastercard', color: '#820AD1' },
  { name: 'Itaú Personalité Black', bankName: 'Itaú Unibanco', brand: 'mastercard', color: '#EC7000' },
  { name: 'Bradesco Prime Visa Infinite', bankName: 'Banco Bradesco', brand: 'visa', color: '#CC092F' },
  { name: 'Santander Unique Black', bankName: 'Banco Santander', brand: 'mastercard', color: '#EC0000' },
  { name: 'Banco do Brasil Ourocard', bankName: 'Banco do Brasil', brand: 'visa', color: '#0038A8' },
  { name: 'Inter Black Mastercard', bankName: 'Banco Inter', brand: 'mastercard', color: '#FF7A00' },
  { name: 'C6 Carbon Black', bankName: 'Banco C6', brand: 'mastercard', color: '#242424' },
  { name: 'XP Visa Infinite', bankName: 'XP Investimentos', brand: 'visa', color: '#10B981' },
  { name: 'BTG Pactual Black', bankName: 'BTG Pactual', brand: 'mastercard', color: '#0A2540' },
];

// ISOLATED SUB-COMPONENT: Add Card Modal
interface AddCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (card: Omit<CreditCard, 'id'>) => void;
}

const AddCardModal: React.FC<AddCardModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [name, setName] = useState('');
  const [bankName, setBankName] = useState('Itaú Unibanco');
  const [totalLimit, setTotalLimit] = useState('10000');
  const [closingDay, setClosingDay] = useState('3');
  const [dueDay, setDueDay] = useState('10');
  const [brand, setBrand] = useState<'mastercard' | 'visa' | 'elo' | 'amex'>('mastercard');
  const [lastFourDigits, setLastFourDigits] = useState('1234');
  const [color, setColor] = useState('#820AD1');

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setName('');
      setBankName('Itaú Unibanco');
      setTotalLimit('10000');
      setClosingDay('3');
      setDueDay('10');
      setBrand('mastercard');
      setLastFourDigits('1234');
      setColor('#820AD1');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectPreset = (presetName: string) => {
    const preset = CARD_BANK_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setName(preset.name);
      setBankName(preset.bankName);
      setBrand(preset.brand as any);
      setColor(preset.color);
    }
  };

  const handleClose = () => {
    setName('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({
      name: name.trim(),
      bankName: bankName.trim() || 'Banco',
      totalLimit: parseFloat(totalLimit) || 0,
      closingDay: parseInt(closingDay, 10) || 5,
      dueDay: parseInt(dueDay, 10) || 12,
      brand: brand || 'mastercard',
      lastFourDigits: lastFourDigits.trim() || '0000',
      color: color || '#820AD1',
    });
    setName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CardIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Adicionar Cartão de Crédito</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre o limite total, melhor dia de compra e dia de vencimento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Sugestão Rápida de Cartão</label>
            <select
              onChange={(e) => handleSelectPreset(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              defaultValue=""
            >
              <option value="" disabled>-- Selecione um modelo (opcional) --</option>
              {CARD_BANK_PRESETS.map((p) => (
                <option key={p.name} value={p.name}>
                  {p.name} ({p.bankName})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome do Cartão</label>
            <input
              type="text"
              placeholder="Ex: Nubank Ultravioleta ou Itaú Black"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Instituição Emissora</label>
            <input
              type="text"
              placeholder="Ex: Itaú Unibanco"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Limite Total (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 15000.00"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Últimos 4 Dígitos</label>
              <input
                type="text"
                maxLength={4}
                placeholder="1234"
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Melhor Dia (Fechamento)</label>
              <input
                type="number"
                min={1}
                max={31}
                placeholder="Dia 3"
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-amber-600 dark:text-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dia de Vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                placeholder="Dia 10"
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-rose-600 dark:text-rose-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bandeira</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as any)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cor do Cartão</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                />
                <span className="text-xs text-slate-500 font-mono">{color}</span>
              </div>
            </div>
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
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all"
            >
              Cadastrar Cartão
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Edit Card Modal
interface EditCardModalProps {
  card: CreditCard | null;
  onClose: () => void;
  onSave: (card: CreditCard) => void;
  onDeleteRequest: (card: CreditCard) => void;
}

const EditCardModal: React.FC<EditCardModalProps> = ({ card, onClose, onSave, onDeleteRequest }) => {
  if (!card) return null;

  const [name, setName] = useState(card.name);
  const [bankName, setBankName] = useState(card.bankName);
  const [totalLimit, setTotalLimit] = useState(card.totalLimit.toString());
  const [closingDay, setClosingDay] = useState(card.closingDay.toString());
  const [dueDay, setDueDay] = useState(card.dueDay.toString());
  const [brand, setBrand] = useState<'mastercard' | 'visa' | 'elo' | 'amex'>(card.brand);
  const [lastFourDigits, setLastFourDigits] = useState(card.lastFourDigits);
  const [color, setColor] = useState(card.color);

  React.useEffect(() => {
    if (card) {
      setName(card.name);
      setBankName(card.bankName);
      setTotalLimit(card.totalLimit.toString());
      setClosingDay(card.closingDay.toString());
      setDueDay(card.dueDay.toString());
      setBrand(card.brand);
      setLastFourDigits(card.lastFourDigits);
      setColor(card.color);
    }
  }, [card]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      ...card,
      name: name.trim(),
      bankName: bankName.trim() || 'Banco',
      totalLimit: parseFloat(totalLimit) || 0,
      closingDay: parseInt(closingDay, 10) || 5,
      dueDay: parseInt(dueDay, 10) || 12,
      brand: brand || 'mastercard',
      lastFourDigits: lastFourDigits.trim() || '0000',
      color: color || '#820AD1',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Alterar Cartão de Crédito</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atualize o limite, emissor, fechamento e vencimento deste cartão.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome do Cartão</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Instituição Emissora</label>
            <input
              type="text"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Limite Total (R$)</label>
              <input
                type="number"
                step="0.01"
                value={totalLimit}
                onChange={(e) => setTotalLimit(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-purple-600 dark:text-purple-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Últimos 4 Dígitos</label>
              <input
                type="text"
                maxLength={4}
                value={lastFourDigits}
                onChange={(e) => setLastFourDigits(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Melhor Dia (Fechamento)</label>
              <input
                type="number"
                min={1}
                max={31}
                value={closingDay}
                onChange={(e) => setClosingDay(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-amber-600 dark:text-amber-400"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Dia de Vencimento</label>
              <input
                type="number"
                min={1}
                max={31}
                value={dueDay}
                onChange={(e) => setDueDay(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-bold text-rose-600 dark:text-rose-400"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bandeira</label>
              <select
                value={brand}
                onChange={(e) => setBrand(e.target.value as any)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="mastercard">Mastercard</option>
                <option value="visa">Visa</option>
                <option value="elo">Elo</option>
                <option value="amex">American Express</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cor do Cartão</label>
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="w-9 h-9 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer p-0.5 bg-transparent"
                />
                <span className="text-xs text-slate-500 font-mono">{color}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteRequest(card);
              }}
              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Cartão</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Installment Generator Modal
interface InstallmentModalProps {
  isOpen: boolean;
  cards: CreditCard[];
  selectedCardId: string;
  categories?: CategoryItem[];
  onClose: () => void;
  onAddTransaction: (tx: Omit<CardTransaction, 'id'>) => void;
}

const InstallmentModal: React.FC<InstallmentModalProps> = ({
  isOpen,
  cards,
  selectedCardId,
  categories = INITIAL_CATEGORIES,
  onClose,
  onAddTransaction,
}) => {
  const [cardId, setCardId] = useState(selectedCardId || cards[0]?.id || '');
  const [desc, setDesc] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [numParcelas, setNumParcelas] = useState('10');
  const [category, setCategory] = useState<TransactionCategory>(() => categories[0]?.name || 'Outros');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Selected card object
  const selectedCard = cards.find((c) => c.id === cardId) || cards[0];

  // Auto calculate first invoice month based on purchase date and card closing day
  const currentMonthStr = getCurrentYearMonth();
  const nextMonthStr = getNextInvoiceMonth(currentMonthStr);
  const autoCalculatedMonth = calculateFirstInvoiceMonth(
    startDate,
    selectedCard?.closingDay || 5
  );

  const [firstInvoiceMonth, setFirstInvoiceMonth] = useState<string>(() => currentMonthStr);

  // Reset all fields whenever modal opens to prevent dirty persistence between launches
  useEffect(() => {
    if (isOpen) {
      const activeCardId = selectedCardId || cards[0]?.id || '';
      setCardId(activeCardId);
      setDesc('');
      setTotalValue('');
      setNumParcelas('10');
      setCategory(categories[0]?.name || 'Outros');
      const today = new Date().toISOString().split('T')[0];
      setStartDate(today);
      const activeCard = cards.find((c) => c.id === activeCardId) || cards[0];
      const autoM = calculateFirstInvoiceMonth(today, activeCard?.closingDay || 5);
      setFirstInvoiceMonth(autoM);
    }
  }, [isOpen, selectedCardId]);

  // Recalculate default firstInvoiceMonth when startDate or selectedCard changes
  useEffect(() => {
    if (startDate && selectedCard) {
      const autoMonth = calculateFirstInvoiceMonth(startDate, selectedCard.closingDay || 5);
      setFirstInvoiceMonth(autoMonth);
    }
  }, [startDate, selectedCard?.closingDay]);

  // Generate live preview of installments schedule
  const previewSchedule = useMemo(() => {
    if (!selectedCard || !startDate) return [];
    const totalVal = parseFloat(totalValue) || 0;
    const numParc = parseInt(numParcelas, 10) || 1;
    if (totalVal <= 0) return [];

    return generateInstallmentsSchedule({
      card: selectedCard,
      description: desc || 'Nova Compra',
      totalAmount: totalVal,
      totalInstallments: numParc,
      purchaseDate: startDate,
      firstInvoiceMonth,
      category,
    });
  }, [selectedCard, desc, totalValue, numParcelas, startDate, firstInvoiceMonth, category]);

  if (!isOpen) return null;

  const handleClose = () => {
    setDesc('');
    setTotalValue('');
    onClose();
  };

  const handleClearForm = () => {
    setDesc('');
    setTotalValue('');
    setNumParcelas('10');
    setCategory(categories[0]?.name || 'Outros');
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setFirstInvoiceMonth(calculateFirstInvoiceMonth(today, selectedCard?.closingDay || 5));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !selectedCard) return;

    const totalVal = parseFloat(totalValue) || 0;
    const numParc = parseInt(numParcelas, 10) || 1;
    if (totalVal <= 0) return;

    const schedule = generateInstallmentsSchedule({
      card: selectedCard,
      description: desc.trim(),
      totalAmount: totalVal,
      totalInstallments: numParc,
      purchaseDate: startDate,
      firstInvoiceMonth,
      category,
    });

    schedule.forEach((tx) => {
      onAddTransaction(tx);
    });

    setDesc('');
    setTotalValue('');
    onClose();
  };

  const purchaseDay = startDate ? parseInt(startDate.split('-')[2], 10) : 1;
  const isPostClosing = purchaseDay >= (selectedCard?.closingDay || 5);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 my-8 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>Lançar Compra / Parcelas Futuras</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Gera automaticamente o cronograma de parcelas futuras com as datas e faturas corretas para cada mês.
            </p>
          </div>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Card Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Cartão de Crédito</span>
              {selectedCard && (
                <span className="text-[11px] font-normal text-purple-600 dark:text-purple-400">
                  Fechamento dia {selectedCard.closingDay} • Vencimento dia {selectedCard.dueDay}
                </span>
              )}
            </label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (**** {c.lastFourDigits}) - Limite: {formatCurrency(c.totalLimit)} [Fecha dia {c.closingDay}]
                </option>
              ))}
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Descrição do Estabelecimento / Compra</label>
            <input
              type="text"
              placeholder="Ex: Notebook Dell, Passagem Aérea, Seguro Auto"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          {/* Value & Installments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor Total da Compra (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 1200.00"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nº de Parcelas</label>
              <select
                value={numParcelas}
                onChange={(e) => setNumParcelas(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="1">1x À vista ({totalValue ? formatCurrency(parseFloat(totalValue) || 0) : 'R$ 0,00'})</option>
                {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 15, 18, 24, 36, 48].map((n) => (
                  <option key={n} value={n}>
                    {n}x {totalValue ? `de ${formatCurrency((parseFloat(totalValue) || 0) / n)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dates and Category */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data da Compra</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                <span>1ª Fatura</span>
                <span className="text-[10px] text-slate-400">YYYY-MM</span>
              </label>
              <input
                type="month"
                value={firstInvoiceMonth}
                onChange={(e) => setFirstInvoiceMonth(e.target.value)}
                className="w-full p-2.5 border border-purple-300 dark:border-purple-800 rounded-xl mt-1 bg-purple-50/50 dark:bg-purple-950/30 text-sm font-bold text-purple-700 dark:text-purple-300"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick 1-Click Fatura Presets: Mês Corrente / Próximo Mês / Auto */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mr-1">
              Atalhos de 1ª Fatura:
            </span>
            <button
              type="button"
              onClick={() => setFirstInvoiceMonth(currentMonthStr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                firstInvoiceMonth === currentMonthStr
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>📅 Mês Corrente ({formatMonthBR(currentMonthStr)})</span>
              {firstInvoiceMonth === currentMonthStr && <Check className="w-3 h-3" />}
            </button>

            <button
              type="button"
              onClick={() => setFirstInvoiceMonth(nextMonthStr)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                firstInvoiceMonth === nextMonthStr
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
              }`}
            >
              <span>➡️ Próximo Mês ({formatMonthBR(nextMonthStr)})</span>
              {firstInvoiceMonth === nextMonthStr && <Check className="w-3 h-3" />}
            </button>

            {autoCalculatedMonth !== currentMonthStr && autoCalculatedMonth !== nextMonthStr && (
              <button
                type="button"
                onClick={() => setFirstInvoiceMonth(autoCalculatedMonth)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                  firstInvoiceMonth === autoCalculatedMonth
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}
              >
                <span>⚡ Auto Fechamento ({formatMonthBR(autoCalculatedMonth)})</span>
                {firstInvoiceMonth === autoCalculatedMonth && <Check className="w-3 h-3" />}
              </button>
            )}
          </div>

          {/* Informational badge about closing date */}
          <div className="p-2.5 bg-slate-100 dark:bg-slate-800/60 rounded-xl text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
            <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
            <span>
              {isPostClosing ? (
                <>Compra feita no dia {purchaseDay} (após fechamento dia {selectedCard?.closingDay}): 1ª parcela calculada para a fatura de <strong>{formatMonthBR(firstInvoiceMonth)}</strong>.</>
              ) : (
                <>Compra feita no dia {purchaseDay} (antes do fechamento dia {selectedCard?.closingDay}): 1ª parcela calculada para a fatura de <strong>{formatMonthBR(firstInvoiceMonth)}</strong>.</>
              )}
            </span>
          </div>

          {/* LIVE PREVIEW OF FUTURE INSTALLMENTS */}
          {previewSchedule.length > 0 && (
            <div className="border border-purple-200 dark:border-purple-900/50 bg-purple-50/30 dark:bg-purple-950/20 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-purple-900 dark:text-purple-200">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Cronograma Projetado ({previewSchedule.length} parcelas)</span>
                </span>
                <span>Total: {formatCurrency(parseFloat(totalValue) || 0)}</span>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1 pr-1 text-xs">
                {previewSchedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between bg-white dark:bg-slate-800/80 p-2 rounded-lg border border-slate-100 dark:border-slate-700/60"
                  >
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                        {item.currentInstallment}/{item.totalInstallments}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {formatMonthBR(item.invoiceMonth)}
                      </span>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        (Data: {formatDateBR(item.date)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 font-bold">
                      <span className="text-red-600 dark:text-red-400">
                        {formatCurrency(item.amount)}
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                          item.status === 'Aberto'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : item.status === 'Futuro'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={handleClearForm}
              className="px-3 py-2 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Limpar Campos
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Gerar e Salvar Parcelas</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Edit Card Transaction Modal
interface EditCardTxModalProps {
  tx: CardTransaction | null;
  categories?: CategoryItem[];
  onClose: () => void;
  onSave: (tx: CardTransaction) => void;
}

const EditCardTxModal: React.FC<EditCardTxModalProps> = ({ tx, categories = INITIAL_CATEGORIES, onClose, onSave }) => {
  if (!tx) return null;

  const [desc, setDesc] = useState(tx.description);
  const [amount, setAmount] = useState(tx.amount.toString());
  const [category, setCategory] = useState<TransactionCategory>(tx.category);
  const [date, setDate] = useState(tx.date);
  const [purchaseDate, setPurchaseDate] = useState(tx.purchaseDate || tx.date);
  const [invoiceMonth, setInvoiceMonth] = useState(tx.invoiceMonth);
  const [status, setStatus] = useState<'Faturado' | 'Aberto' | 'Futuro'>(tx.status || 'Aberto');

  useEffect(() => {
    if (tx) {
      setDesc(tx.description);
      setAmount(tx.amount.toString());
      setCategory(tx.category);
      setDate(tx.date);
      setPurchaseDate(tx.purchaseDate || tx.date);
      setInvoiceMonth(tx.invoiceMonth);
      setStatus(tx.status || 'Aberto');
    }
  }, [tx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim()) return;

    onSave({
      ...tx,
      description: desc.trim(),
      amount: parseFloat(amount) || 0,
      category,
      date,
      purchaseDate,
      invoiceMonth,
      status,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Alterar Lançamento do Cartão</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Parcela {tx.currentInstallment}/{tx.totalInstallments} • Fatura: {formatMonthBR(tx.invoiceMonth)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Descrição</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor na Fatura (R$)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-red-600 dark:text-red-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
                {!categories.some((c) => c.name === category) && (
                  <option value={category}>{category}</option>
                )}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data da Parcela (No Mês)</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data Original da Compra</label>
              <input
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Mês da Fatura (YYYY-MM)</label>
              <input
                type="month"
                value={invoiceMonth}
                onChange={(e) => setInvoiceMonth(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="Aberto">Aberto (Fatura Atual)</option>
                <option value="Futuro">Futuro (Projetada)</option>
                <option value="Faturado">Faturado / Pago</option>
              </select>
            </div>
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
              className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/30 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const CreditCardsView: React.FC<CreditCardsViewProps> = ({
  cards,
  cardTransactions,
  categories = INITIAL_CATEGORIES,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onAddCardTransaction,
  onEditCardTransaction,
  onDeleteCardTransaction,
  onOpenStatementModal,
}) => {
  const activeCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;
  const currentMonth = getCurrentYearMonth();
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [viewMode, setViewMode] = useState<'month' | 'all'>('month');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'CURRENT' | 'FUTURE' | 'BILLED'>('ALL');

  // Modal triggers
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);
  const [editingCardTx, setEditingCardTx] = useState<CardTransaction | null>(null);

  // Deletion Confirmation Modals
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [cardTxToDelete, setCardTxToDelete] = useState<CardTransaction | null>(null);

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  // Month Selector Tabs Setup
  const monthSet = new Set<string>();
  monthSet.add(currentMonth);

  const [y, m] = currentMonth.split('-').map(Number);
  for (let i = 0; i < 12; i++) {
    const d = new Date(y, m - 1 + i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(mStr);
  }

  cardTransactions.forEach((t) => monthSet.add(t.invoiceMonth));
  const availableMonths = Array.from(monthSet).sort();

  // Aggregate Stats across all cards
  const totalCombinedLimit = cards.reduce((sum, c) => sum + (c.totalLimit || 0), 0);
  const totalCombinedOutstanding = cards.reduce(
    (sum, c) => sum + calculateCardTotalOutstanding(c.id, cardTransactions),
    0
  );
  const totalCombinedAvailable = Math.max(0, totalCombinedLimit - totalCombinedOutstanding);
  const totalCurrentInvoiceSum = cards.reduce(
    (sum, c) => sum + calculateCardCurrentInvoice(c.id, cardTransactions, currentMonth),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CardIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>Cartões de Crédito & Gestão de Limites</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Acompanhe o limite total, saldo disponível, fatura atual e parcelamentos futuros com persistência completa.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCardModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>

          <button
            onClick={() => setShowInstallmentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-xs transition-all shadow-md shadow-purple-900/20"
          >
            <Layers className="w-4 h-4" />
            <span>Lançar Compra Parcelada</span>
          </button>
        </div>
      </div>

      {/* Global Credit KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Limite Total Global */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Limite Total de Crédito</span>
            <div className="p-2 bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 rounded-xl">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100">
            {formatCurrency(totalCombinedLimit)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {cards.length} cartão(ões) cadastrado(s)
          </span>
        </div>

        {/* Limite Disponível Global */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/50 shadow-2xs">
          <div className="flex items-center justify-between text-emerald-600 dark:text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Limite Disponível Livre</span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalCombinedAvailable)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {totalCombinedLimit > 0
              ? `${Math.round((totalCombinedAvailable / totalCombinedLimit) * 100)}% de limite livre`
              : 'Sem limite cadastrado'}
          </span>
        </div>

        {/* Total Comprometido (Todas as Faturas) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 shadow-2xs">
          <div className="flex items-center justify-between text-rose-600 dark:text-rose-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Comprometido</span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
            {formatCurrency(totalCombinedOutstanding)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Faturas em aberto + parcelas futuras
          </span>
        </div>

        {/* Fatura Consolidada do Mês Vigente */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-2xs">
          <div className="flex items-center justify-between text-amber-600 dark:text-amber-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Fatura Atual ({formatMonthBR(currentMonth)})</span>
            <div className="p-2 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-xl">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-500">
            {formatCurrency(totalCurrentInvoiceSum)}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            Valor a pagar no mês corrente
          </span>
        </div>
      </div>

      {/* Grid of Credit Cards or Empty State */}
      {cards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
            <CardIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Nenhum cartão de crédito cadastrado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Todos os cartões foram excluídos. Cadastre um novo cartão para gerenciar limites, faturas e compras parceladas.
          </p>
          <button
            onClick={() => setShowAddCardModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Cartão</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const currentInvoiceBal = calculateCardCurrentInvoice(card.id, cardTransactions, currentMonth);
            const totalOutstandingBal = calculateCardTotalOutstanding(card.id, cardTransactions);
            const availableLimit = calculateCardAvailableLimit(card, cardTransactions);
            const usedPercent = calculateCardUsedLimitPercent(card, cardTransactions);
            const isSelected = card.id === selectedCardId;

            // Determine limit utilization color
            let progressColor = 'bg-emerald-500';
            let progressTextColor = 'text-emerald-600 dark:text-emerald-400';
            if (usedPercent > 80) {
              progressColor = 'bg-rose-500';
              progressTextColor = 'text-rose-600 dark:text-rose-400';
            } else if (usedPercent > 50) {
              progressColor = 'bg-amber-500';
              progressTextColor = 'text-amber-600 dark:text-amber-400';
            }

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-purple-500 shadow-xl ring-2 ring-purple-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-xs"
                      style={{ backgroundColor: card.color }}
                    >
                      {card.brand}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingCard(card);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title="Editar Cartão"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToDelete(card);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-white/10 hover:bg-rose-600/30 text-rose-300'
                            : 'bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400'
                        }`}
                        title="Excluir Cartão e Transações"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStatementModal('card', card);
                        }}
                        className={`p-1.5 rounded-lg transition-colors ${
                          isSelected
                            ? 'bg-white/10 hover:bg-white/20 text-white'
                            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                        }`}
                        title="Ver Fatura Completa"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className={`text-xl font-black ${isSelected ? 'text-white' : 'text-slate-900 dark:text-white'}`}>
                    {card.name}
                  </h3>
                  <p className={`text-xs mt-0.5 ${isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                    **** {card.lastFourDigits} ({card.bankName})
                  </p>

                  {/* Limits and Balances Section */}
                  <div className={`mt-4 p-3.5 rounded-xl border space-y-2 ${
                    isSelected
                      ? 'bg-slate-800/60 border-slate-700/60'
                      : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/50'
                  }`}>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400 font-medium'}>
                        Limite Total:
                      </span>
                      <span className={`font-extrabold ${isSelected ? 'text-white' : 'text-slate-900 dark:text-slate-100'}`}>
                        {formatCurrency(card.totalLimit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400 font-medium'}>
                        Limite Disponível:
                      </span>
                      <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(availableLimit)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs">
                      <span className={isSelected ? 'text-slate-300 font-medium' : 'text-slate-500 dark:text-slate-400 font-medium'}>
                        Total Comprometido:
                      </span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">
                        {formatCurrency(totalOutstandingBal)}
                      </span>
                    </div>

                    {/* Limit Utilization Progress Bar */}
                    <div className="pt-1">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className={isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}>Uso do Limite</span>
                        <span className={`font-bold ${progressTextColor}`}>{usedPercent.toFixed(0)}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full overflow-hidden ${isSelected ? 'bg-slate-700' : 'bg-slate-200 dark:bg-slate-700'}`}>
                        <div
                          className={`h-full ${progressColor} transition-all duration-300`}
                          style={{ width: `${Math.min(100, Math.max(0, usedPercent))}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Best Day Badges */}
                  <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <div className={`p-2 rounded-lg border ${
                      isSelected
                        ? 'bg-slate-800/40 border-slate-700/50'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40'
                    }`}>
                      <span className={`text-[10px] block font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Melhor Dia de Compra
                      </span>
                      <span className="font-extrabold text-amber-600 dark:text-amber-400">Dia {card.closingDay}</span>
                    </div>

                    <div className={`p-2 rounded-lg border ${
                      isSelected
                        ? 'bg-slate-800/40 border-slate-700/50'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-700/40'
                    }`}>
                      <span className={`text-[10px] block font-medium ${isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
                        Dia de Vencimento
                      </span>
                      <span className="font-extrabold text-rose-600 dark:text-rose-400">Dia {card.dueDay}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Current Invoice */}
                <div className={`mt-5 pt-3 border-t flex items-center justify-between ${
                  isSelected ? 'border-slate-800' : 'border-slate-100 dark:border-slate-800'
                }`}>
                  <div>
                    <span className={`text-[10px] uppercase tracking-wider block ${
                      isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Fatura Atual ({formatMonthBR(currentMonth)})
                    </span>
                    <span className={`text-2xl font-black ${
                      currentInvoiceBal > 0
                        ? 'text-rose-600 dark:text-rose-400'
                        : isSelected ? 'text-slate-200' : 'text-slate-800 dark:text-slate-200'
                    }`}>
                      {formatCurrency(currentInvoiceBal)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] uppercase tracking-wider block ${
                      isSelected ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'
                    }`}>
                      Status Fatura
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                      currentInvoiceBal > 0
                        ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {currentInvoiceBal > 0 ? 'Aberta' : 'Zerada'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Card Invoice Details */}
      {selectedCard && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    <span>Fatura Projetada: {selectedCard.name}</span>
                  </h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                    **** {selectedCard.lastFourDigits}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <span>Limite: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedCard.totalLimit)}</strong></span>
                  <span>•</span>
                  <span>Disponível: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(calculateCardAvailableLimit(selectedCard, cardTransactions))}</strong></span>
                  <span>•</span>
                  <span>Total Comprometido: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(calculateCardTotalOutstanding(selectedCard.id, cardTransactions))}</strong></span>
                </div>
              </div>

              {/* Action and Navigation Controls */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-slate-200/80 dark:bg-slate-800 p-1 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setViewMode('month')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === 'month'
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Por Fatura Mensal
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      viewMode === 'all'
                        ? 'bg-white dark:bg-slate-900 text-purple-700 dark:text-purple-300 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    Todas as Parcelas
                  </button>
                </div>

                {/* Quick Jump to Mês Corrente */}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMonth(currentMonth);
                    setViewMode('month');
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-xs ${
                    selectedMonth === currentMonth && viewMode === 'month'
                      ? 'bg-amber-500 text-slate-950 border-amber-400 font-black'
                      : 'bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900/60'
                  }`}
                  title="Exibir imediatamente a fatura do mês atual"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Mês Corrente ({formatMonthBR(currentMonth)})</span>
                </button>
              </div>
            </div>

            {/* Month Selector Carousel (Shown when in monthly view) */}
            {viewMode === 'month' && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {availableMonths.map((m) => {
                  const isSelectedM = m === selectedMonth;
                  const isCurrent = m === currentMonth;
                  const mInvoiceTotal = calculateCardCurrentInvoice(selectedCard.id, cardTransactions, m);

                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex flex-col items-center flex-shrink-0 ${
                        isSelectedM
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {isCurrent && (
                          <span className="px-1 py-0.2 rounded text-[9px] font-black bg-amber-400 text-slate-950">
                            Atual
                          </span>
                        )}
                        {formatMonthBR(m)}
                      </span>
                      <span className="text-[10px] opacity-80 mt-0.5 font-bold">
                        {formatCurrency(mInvoiceTotal)}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filter pills when in "Todas as Parcelas" view */}
            {viewMode === 'all' && (
              <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">Filtrar parcelas:</span>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'ALL'
                      ? 'bg-purple-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  Todas ({cardTransactions.filter((t) => t.cardId === selectedCard.id).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('CURRENT')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'CURRENT'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-white dark:bg-slate-800 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50'
                  }`}
                >
                  Mês Corrente ({cardTransactions.filter((t) => t.cardId === selectedCard.id && t.invoiceMonth === currentMonth).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('FUTURE')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'FUTURE'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/50'
                  }`}
                >
                  Meses Futuros ({cardTransactions.filter((t) => t.cardId === selectedCard.id && t.invoiceMonth > currentMonth).length})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('BILLED')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === 'BILLED'
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/50'
                  }`}
                >
                  Faturadas / Anteriores ({cardTransactions.filter((t) => t.cardId === selectedCard.id && t.invoiceMonth < currentMonth).length})
                </button>
              </div>
            )}
          </div>

          {/* Statement Table */}
          <div className="p-6">
            {(() => {
              const txList = cardTransactions
                .filter((t) => {
                  if (t.cardId !== selectedCard.id) return false;
                  if (viewMode === 'month') {
                    return t.invoiceMonth === selectedMonth;
                  }
                  // 'all' view mode
                  if (statusFilter === 'CURRENT') return t.invoiceMonth === currentMonth;
                  if (statusFilter === 'FUTURE') return t.invoiceMonth > currentMonth;
                  if (statusFilter === 'BILLED') return t.invoiceMonth < currentMonth;
                  return true;
                })
                .sort((a, b) => {
                  // Sort primarily by invoice month then date
                  if (a.invoiceMonth !== b.invoiceMonth) {
                    return b.invoiceMonth.localeCompare(a.invoiceMonth);
                  }
                  return b.date.localeCompare(a.date);
                });

              if (txList.length === 0) {
                return (
                  <div className="text-center py-12 text-slate-500">
                    <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">
                      {viewMode === 'month'
                        ? `Nenhum gasto ou parcela para o mês de ${formatMonthBR(selectedMonth)}.`
                        : 'Nenhuma parcela encontrada para os filtros selecionados.'}
                    </p>
                    <p className="text-xs mt-1 text-slate-400">
                      Cadastre novos lançamentos ou compras parceladas para este cartão.
                    </p>
                  </div>
                );
              }

              return (
                <div className="max-h-[460px] overflow-y-auto relative border border-slate-200 dark:border-slate-800 rounded-xl">
                  <table className="w-full text-left border-collapse text-sm">
                    <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
                      <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        <th className="py-3 px-3">Fatura (Mês)</th>
                        <th className="py-3 px-3">Data Parcela</th>
                        <th className="py-3 px-3">Data Compra</th>
                        <th className="py-3 px-3">Descrição</th>
                        <th className="py-3 px-3">Parcela</th>
                        <th className="py-3 px-3">Categoria</th>
                        <th className="py-3 px-3">Status</th>
                        <th className="py-3 px-3 text-right">Valor Na Fatura</th>
                        <th className="py-3 px-3 text-center">Ações</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {txList.map((t) => {
                        const isCurrentMonthTx = t.invoiceMonth === currentMonth;
                        const isFutureTx = t.invoiceMonth > currentMonth;
                        const computedStatus = t.status || (isCurrentMonthTx ? 'Aberto' : isFutureTx ? 'Futuro' : 'Faturado');

                        const statusColor =
                          computedStatus === 'Faturado'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : computedStatus === 'Futuro'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300';

                        return (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                            <td className="py-3 px-3 font-extrabold text-slate-800 dark:text-slate-200 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isCurrentMonthTx
                                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200 font-black border border-amber-300/60'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold'
                              }`}>
                                {formatMonthBR(t.invoiceMonth || currentMonth)}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-bold text-slate-800 dark:text-slate-100 whitespace-nowrap">
                              {formatDateBR(t.date)}
                            </td>
                            <td className="py-3 px-3 font-medium text-slate-500 dark:text-slate-400 whitespace-nowrap text-xs">
                              {t.purchaseDate ? formatDateBR(t.purchaseDate) : formatDateBR(t.date)}
                            </td>
                            <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">{t.description}</td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/50">
                                {t.currentInstallment}/{t.totalInstallments}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800">
                                {t.category}
                              </span>
                            </td>
                            <td className="py-3 px-3 whitespace-nowrap">
                              <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${statusColor}`}>
                                {computedStatus}
                              </span>
                            </td>
                            <td className="py-3 px-3 text-right font-bold text-red-600 dark:text-red-500 whitespace-nowrap">
                              -{formatCurrency(t.amount)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => setEditingCardTx(t)}
                                  className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Alterar este lançamento"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setCardTxToDelete(t)}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                  title="Excluir este lançamento"
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
              );
            })()}
          </div>
        </div>
      )}

      {/* ISOLATED MODALS */}
      {showAddCardModal && (
        <AddCardModal
          isOpen={showAddCardModal}
          onClose={() => setShowAddCardModal(false)}
          onAdd={onAddCard}
        />
      )}

      <EditCardModal
        key={editingCard?.id || 'edit-card-modal'}
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onSave={onEditCard}
        onDeleteRequest={(c) => setCardToDelete(c)}
      />

      {showInstallmentModal && (
        <InstallmentModal
          isOpen={showInstallmentModal}
          cards={cards}
          selectedCardId={selectedCardId}
          categories={activeCategories}
          onClose={() => setShowInstallmentModal(false)}
          onAddTransaction={onAddCardTransaction}
        />
      )}

      <EditCardTxModal
        key={editingCardTx?.id || 'edit-card-tx-modal'}
        tx={editingCardTx}
        categories={activeCategories}
        onClose={() => setEditingCardTx(null)}
        onSave={onEditCardTransaction}
      />

      {/* Confirmation Modal - Delete Credit Card */}
      {cardToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Cartão de Crédito</h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {cardToDelete.name} ({cardToDelete.brand.toUpperCase()})
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emissor: {cardToDelete.bankName} | Final: **** {cardToDelete.lastFourDigits} | Limite: {formatCurrency(cardToDelete.totalLimit)}
              </p>

              {(() => {
                const linkedTxs = cardTransactions.filter((t) => t.cardId === cardToDelete.id).length;
                return (
                  <div className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Atenção: Ao excluir este cartão, <strong>{linkedTxs} lançamento(s) e fatura(s)</strong> vinculadas
                      serão excluídas permanentemente.
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCardToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = cardToDelete.id;
                  onDeleteCard(idToDelete);
                  const remaining = cards.filter((c) => c.id !== idToDelete);
                  setSelectedCardId(remaining[0]?.id || '');
                  setCardToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 transition-colors"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete Card Transaction */}
      {cardTxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Lançamento da Fatura</h3>
                <p className="text-xs text-slate-500">Confirmar exclusão de compra no cartão</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {cardTxToDelete.description}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data: {formatDateBR(cardTxToDelete.date)} | Parcela: {cardTxToDelete.currentInstallment}/{cardTxToDelete.totalInstallments}
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white pt-1">
                Valor na Fatura: {formatCurrency(cardTxToDelete.amount)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setCardTxToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteCardTransaction(cardTxToDelete.id);
                  setCardTxToDelete(null);
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
