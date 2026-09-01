import React, { useState } from 'react';
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
} from '../utils/financeUtils';
import {
  CreditCard as CardIcon,
  Plus,
  Calendar,
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

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc.trim() || !cardId) return;

    const totalVal = parseFloat(totalValue) || 0;
    const numParc = parseInt(numParcelas, 10) || 1;
    const parcAmount = totalVal / numParc;

    const [startYear, startMonthNum] = startDate.split('-').map(Number);
    const purchaseGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    for (let i = 0; i < numParc; i++) {
      const futureDate = new Date(startYear, startMonthNum - 1 + i, 1);
      const invoiceMonthTag = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

      onAddTransaction({
        cardId,
        date: startDate,
        description: desc.trim(),
        amount: Math.round(parcAmount * 100) / 100,
        category,
        currentInstallment: i + 1,
        totalInstallments: numParc,
        invoiceMonth: invoiceMonthTag,
        status: i === 0 ? 'Aberto' : 'Futuro',
        purchaseGroupId,
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Layers className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span>Lançar Compra Parcelada</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Gera automaticamente as parcelas projetadas para os próximos meses.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Cartão de Crédito</label>
            <select
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
            >
              {cards.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} (**** {c.lastFourDigits}) - Limite: {formatCurrency(c.totalLimit)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Descrição do Estabelecimento</label>
            <input
              type="text"
              placeholder="Ex: Notebook Dell ou Passagem CVC"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 1200.00"
                value={totalValue}
                onChange={(e) => setTotalValue(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nº de Parcelas</label>
              <select
                value={numParcelas}
                onChange={(e) => setNumParcelas(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}x {totalValue ? `de ${formatCurrency((parseFloat(totalValue) || 0) / n)}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.name}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data da Compra</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                required
              />
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
              Projetar Parcelas
            </button>
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

  React.useEffect(() => {
    if (tx) {
      setDesc(tx.description);
      setAmount(tx.amount.toString());
      setCategory(tx.category);
      setDate(tx.date);
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
            Parcela {tx.currentInstallment}/{tx.totalInstallments} referente ao mês {formatMonthBR(tx.invoiceMonth)}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data da Compra</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Descrição</label>
            <input
              type="text"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
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
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-red-600 dark:text-red-400"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Categoria</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Fatura Projetada: {selectedCard.name}</span>
                </h2>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-500 dark:text-slate-400">
                  <span>Limite: <strong className="text-slate-800 dark:text-slate-200">{formatCurrency(selectedCard.totalLimit)}</strong></span>
                  <span>•</span>
                  <span>Disponível: <strong className="text-emerald-600 dark:text-emerald-400">{formatCurrency(calculateCardAvailableLimit(selectedCard, cardTransactions))}</strong></span>
                  <span>•</span>
                  <span>Total Comprometido: <strong className="text-rose-600 dark:text-rose-400">{formatCurrency(calculateCardTotalOutstanding(selectedCard.id, cardTransactions))}</strong></span>
                </div>
              </div>

              {/* Month Selector Carousel / Tabs */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
                {availableMonths.map((m) => {
                  const isSelectedM = m === selectedMonth;
                  const isCurrent = m === currentMonth;
                  const mInvoiceTotal = calculateCardCurrentInvoice(selectedCard.id, cardTransactions, m);

                  return (
                    <button
                      key={m}
                      onClick={() => setSelectedMonth(m)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex flex-col items-center ${
                        isSelectedM
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-purple-50 dark:hover:bg-purple-950/30'
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {isCurrent && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                        {formatMonthBR(m)}
                      </span>
                      <span className="text-[10px] opacity-80 mt-0.5">
                        {formatCurrency(mInvoiceTotal)}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Statement Table for Selected Month */}
          <div className="p-6">
            {cardTransactions.filter((t) => t.cardId === selectedCard.id && t.invoiceMonth === selectedMonth).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50 text-slate-400" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhum gasto ou parcela para este mês ({formatMonthBR(selectedMonth)}).</p>
                <p className="text-xs mt-1 text-slate-400">Sua fatura deste mês está quitada ou não possui compras cadastradas.</p>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto relative border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Data da Compra</th>
                      <th className="py-3 px-3">Descrição</th>
                      <th className="py-3 px-3">Parcela</th>
                      <th className="py-3 px-3">Categoria</th>
                      <th className="py-3 px-3 text-right">Valor Na Fatura</th>
                      <th className="py-3 px-3 text-center">Ações (Alterar/Excluir)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {cardTransactions
                      .filter((t) => t.cardId === selectedCard.id && t.invoiceMonth === selectedMonth)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-medium whitespace-nowrap">{formatDateBR(t.date)}</td>
                          <td className="py-3 px-3 font-semibold text-slate-800 dark:text-slate-100">{t.description}</td>
                          <td className="py-3 px-3">
                            <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200/50">
                              {t.currentInstallment}/{t.totalInstallments}
                            </span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800">
                              {t.category}
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
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ISOLATED MODALS */}
      <AddCardModal
        isOpen={showAddCardModal}
        onClose={() => setShowAddCardModal(false)}
        onAdd={onAddCard}
      />

      <EditCardModal
        key={editingCard?.id || 'edit-card-modal'}
        card={editingCard}
        onClose={() => setEditingCard(null)}
        onSave={onEditCard}
        onDeleteRequest={(c) => setCardToDelete(c)}
      />

      <InstallmentModal
        isOpen={showInstallmentModal}
        cards={cards}
        selectedCardId={selectedCardId}
        categories={activeCategories}
        onClose={() => setShowInstallmentModal(false)}
        onAddTransaction={onAddCardTransaction}
      />

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
