import React, { useState } from 'react';
import { CreditCard, CardTransaction, TransactionCategory } from '../types';
import {
  formatCurrency,
  formatDateBR,
  formatMonthBR,
  calculateCardCurrentInvoice,
  calculateCardTotalOutstanding,
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
} from 'lucide-react';

interface CreditCardsViewProps {
  cards: CreditCard[];
  cardTransactions: CardTransaction[];
  onAddCard: (card: Omit<CreditCard, 'id'>) => void;
  onEditCard: (card: CreditCard) => void;
  onDeleteCard: (id: string) => void;
  onAddCardTransaction: (tx: Omit<CardTransaction, 'id'>) => void;
  onEditCardTransaction: (tx: CardTransaction) => void;
  onDeleteCardTransaction: (id: string) => void;
  onOpenStatementModal: (type: 'card', entity: CreditCard) => void;
}

export const CreditCardsView: React.FC<CreditCardsViewProps> = ({
  cards,
  cardTransactions,
  onAddCard,
  onEditCard,
  onDeleteCard,
  onAddCardTransaction,
  onEditCardTransaction,
  onDeleteCardTransaction,
  onOpenStatementModal,
}) => {
  const currentMonth = getCurrentYearMonth();
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState<string>(currentMonth);
  const [showAddCardModal, setShowAddCardModal] = useState(false);
  const [editingCard, setEditingCard] = useState<CreditCard | null>(null);

  // Deletion Modals state
  const [cardToDelete, setCardToDelete] = useState<CreditCard | null>(null);
  const [cardTxToDelete, setCardTxToDelete] = useState<CardTransaction | null>(null);

  // Installment Generator Modal
  const [showInstallmentModal, setShowInstallmentModal] = useState(false);

  // Single Card Transaction Edit Modal
  const [editingCardTx, setEditingCardTx] = useState<CardTransaction | null>(null);

  // Card Form State
  const [cardName, setCardName] = useState('');
  const [cardBankName, setCardBankName] = useState('Itaú Unibanco');
  const [cardTotalLimit, setCardTotalLimit] = useState('10000');
  const [cardClosingDay, setCardClosingDay] = useState('3');
  const [cardDueDay, setCardDueDay] = useState('10');
  const [cardBrand, setCardBrand] = useState<'mastercard' | 'visa' | 'elo' | 'amex'>('mastercard');
  const [cardLastFour, setCardLastFour] = useState('1234');
  const [cardColor, setCardColor] = useState('#820AD1');

  // Installment Form State
  const [instDesc, setInstDesc] = useState('');
  const [instTotalValue, setInstTotalValue] = useState('');
  const [instNumParcelas, setInstNumParcelas] = useState('10');
  const [instCategory, setInstCategory] = useState<TransactionCategory>('Lazer');
  const [instStartDate, setInstStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Single Card Tx Edit Form State
  const [txDesc, setTxDesc] = useState('');
  const [txAmount, setTxAmount] = useState('');
  const [txCategory, setTxCategory] = useState<TransactionCategory>('Outros');
  const [txDate, setTxDate] = useState('');

  const selectedCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  // Unique months available in card transactions
  const monthSet = new Set<string>();
  monthSet.add(currentMonth);

  // Generate 12 upcoming months
  const [y, m] = currentMonth.split('-').map(Number);
  for (let i = 0; i < 12; i++) {
    const d = new Date(y, m - 1 + i, 1);
    const mStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    monthSet.add(mStr);
  }

  cardTransactions.forEach((t) => monthSet.add(t.invoiceMonth));
  const availableMonths = Array.from(monthSet).sort();

  // Open Add Card Modal
  const handleOpenAddCard = () => {
    setCardName('');
    setCardBankName('Itaú Unibanco');
    setCardTotalLimit('10000');
    setCardClosingDay('3');
    setCardDueDay('10');
    setCardBrand('mastercard');
    setCardLastFour('1234');
    setCardColor('#820AD1');
    setShowAddCardModal(true);
  };

  const handleSaveAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName.trim()) return;
    onAddCard({
      name: cardName.trim(),
      bankName: cardBankName,
      totalLimit: parseFloat(cardTotalLimit) || 0,
      closingDay: parseInt(cardClosingDay, 10) || 5,
      dueDay: parseInt(cardDueDay, 10) || 12,
      brand: cardBrand,
      lastFourDigits: cardLastFour,
      color: cardColor,
    });
    setShowAddCardModal(false);
  };

  // Open Edit Card Modal
  const handleOpenEditCard = (card: CreditCard) => {
    setEditingCard(card);
    setCardName(card.name);
    setCardBankName(card.bankName);
    setCardTotalLimit(card.totalLimit.toString());
    setCardClosingDay(card.closingDay.toString());
    setCardDueDay(card.dueDay.toString());
    setCardBrand(card.brand);
    setCardLastFour(card.lastFourDigits);
    setCardColor(card.color);
  };

  const handleSaveEditCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCard || !cardName.trim()) return;
    onEditCard({
      ...editingCard,
      name: cardName.trim(),
      bankName: cardBankName,
      totalLimit: parseFloat(cardTotalLimit) || 0,
      closingDay: parseInt(cardClosingDay, 10) || 5,
      dueDay: parseInt(cardDueDay, 10) || 12,
      brand: cardBrand,
      lastFourDigits: cardLastFour,
      color: cardColor,
    });
    setEditingCard(null);
  };

  // Generate Installment Transactions
  const handleGenerateInstallments = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCard || !instDesc.trim()) return;

    const totalVal = parseFloat(instTotalValue) || 0;
    const numParc = parseInt(instNumParcelas, 10) || 1;
    const parcAmount = totalVal / numParc;

    const [startYear, startMonthNum] = instStartDate.split('-').map(Number);
    const purchaseGroupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;

    for (let i = 0; i < numParc; i++) {
      const futureDate = new Date(startYear, startMonthNum - 1 + i, 1);
      const invoiceMonthTag = `${futureDate.getFullYear()}-${String(futureDate.getMonth() + 1).padStart(2, '0')}`;

      onAddCardTransaction({
        cardId: selectedCard.id,
        date: instStartDate,
        description: instDesc.trim(),
        amount: Math.round(parcAmount * 100) / 100,
        category: instCategory,
        currentInstallment: i + 1,
        totalInstallments: numParc,
        invoiceMonth: invoiceMonthTag,
        status: i === 0 ? 'Aberto' : 'Futuro',
        purchaseGroupId,
      });
    }

    setInstDesc('');
    setInstTotalValue('');
    setShowInstallmentModal(false);
  };

  // Single Transaction Edit Handlers
  const handleOpenEditCardTx = (t: CardTransaction) => {
    setEditingCardTx(t);
    setTxDesc(t.description);
    setTxAmount(t.amount.toString());
    setTxCategory(t.category);
    setTxDate(t.date);
  };

  const handleSaveEditCardTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCardTx || !txDesc.trim()) return;

    onEditCardTransaction({
      ...editingCardTx,
      description: txDesc.trim(),
      amount: parseFloat(txAmount) || 0,
      category: txCategory,
      date: txDate,
    });

    setEditingCardTx(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <CardIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            <span>Cartões de Crédito & Faturas Futuras</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Controle de melhor dia de compra, vencimento, limites e alteração de registros.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddCard}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Cartão</span>
          </button>

          <button
            onClick={() => setShowInstallmentModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-purple-900/20"
          >
            <Layers className="w-4 h-4" />
            <span>Lançar Compra Parcelada</span>
          </button>
        </div>
      </div>

      {/* Credit Cards Summary Grid or Empty State */}
      {cards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 bg-purple-50 dark:bg-purple-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-purple-600 dark:text-purple-400">
            <CardIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Nenhum cartão de crédito cadastrado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Todos os cartões foram excluídos. Cadastre um novo cartão para gerenciar faturas e compras parceladas.
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
            const isSelected = card.id === selectedCardId;

            return (
              <div
                key={card.id}
                onClick={() => setSelectedCardId(card.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-purple-500 shadow-xl ring-2 ring-purple-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: card.color }}
                    >
                      {card.brand}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditCard(card);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Editar Cartão"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setCardToDelete(card);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-rose-600/30 rounded-lg text-rose-300 transition-colors"
                        title="Excluir Cartão e Transações"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStatementModal('card', card);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Ver Fatura Completa em Modal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black">{card.name}</h3>
                  <p className="text-xs opacity-75 mt-0.5">
                    **** {card.lastFourDigits} ({card.bankName})
                  </p>

                  {/* Due Date & Best Day Badges */}
                  <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-slate-800/50 dark:bg-slate-800 rounded-lg border border-slate-700/50">
                      <span className="text-[10px] opacity-70 block font-medium">Melhor Dia de Compra</span>
                      <span className="font-extrabold text-amber-400">Dia {card.closingDay}</span>
                    </div>

                    <div className="p-2 bg-slate-800/50 dark:bg-slate-800 rounded-lg border border-slate-700/50">
                      <span className="text-[10px] opacity-70 block font-medium">Dia de Vencimento</span>
                      <span className="font-extrabold text-rose-400">Dia {card.dueDay}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-700/40 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] opacity-70 uppercase tracking-wider block">Fatura Atual ({formatMonthBR(currentMonth)})</span>
                    <span className={`text-2xl font-black ${currentInvoiceBal > 0 ? 'text-red-500 font-bold' : 'text-slate-200'}`}>
                      {formatCurrency(currentInvoiceBal)}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] opacity-70 uppercase tracking-wider block">Dívida Futura Total</span>
                    <span className={`text-sm font-bold ${totalOutstandingBal > 0 ? 'text-red-400 font-bold' : 'text-slate-300'}`}>
                      {formatCurrency(totalOutstandingBal)}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Extrato do Cartão Selecionado */}
      {selectedCard && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <span>Fatura Projetada: {selectedCard.name}</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Navegue pelos meses a frente para visualizar as parcelas futuras já contratadas
                </p>
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
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border hover:bg-purple-50 dark:hover:bg-purple-950/30'
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
                <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="font-semibold">Nenhum gasto ou parcela para este mês ({formatMonthBR(selectedMonth)}).</p>
                <p className="text-xs mt-1">Sua fatura deste mês está quitada ou não possui compras cadastradas.</p>
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
                                onClick={() => handleOpenEditCardTx(t)}
                                className="p-1 text-slate-400 hover:text-indigo-600"
                                title="Alterar este lançamento"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setCardTxToDelete(t)}
                                className="p-1 text-slate-400 hover:text-rose-600"
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

      {/* Modal Add Card */}
      {showAddCardModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-xl">
            <h3 className="text-xl font-bold mb-4">Adicionar Cartão de Crédito</h3>
            <form onSubmit={handleSaveAddCard} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Nome do Cartão</label>
                <input
                  type="text"
                  placeholder="Ex: Nubank Ultravioleta ou Itaú Black"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Instituição Emissora</label>
                <input
                  type="text"
                  value={cardBankName}
                  onChange={(e) => setCardBankName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Limite Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cardTotalLimit}
                    onChange={(e) => setCardTotalLimit(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Melhor Dia de Compra (Fechamento)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Dia do Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddCardModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Salvar Cartão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Card */}
      {editingCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-xl">
            <h3 className="text-xl font-bold mb-4">Alterar Cartão de Crédito</h3>
            <form onSubmit={handleSaveEditCard} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Nome do Cartão</label>
                <input
                  type="text"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Instituição Emissora</label>
                <input
                  type="text"
                  value={cardBankName}
                  onChange={(e) => setCardBankName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Limite Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cardTotalLimit}
                    onChange={(e) => setCardTotalLimit(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Últimos 4 Dígitos</label>
                  <input
                    type="text"
                    maxLength={4}
                    value={cardLastFour}
                    onChange={(e) => setCardLastFour(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Melhor Dia de Compra (Fechamento)</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={cardClosingDay}
                    onChange={(e) => setCardClosingDay(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold">Dia do Vencimento</label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    value={cardDueDay}
                    onChange={(e) => setCardDueDay(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const card = editingCard;
                    setEditingCard(null);
                    setCardToDelete(card);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Cartão</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingCard(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-medium text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-purple-600 text-white rounded-xl font-medium text-xs shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Lançar Compra Parcelada */}
      {showInstallmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Lançar Compra Parcelada</h3>
            <p className="text-xs text-slate-500 mb-4">
              O app criará automaticamente os lançamentos nos meses a frente!
            </p>

            <form onSubmit={handleGenerateInstallments} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Cartão de Crédito</label>
                <select
                  value={selectedCardId}
                  onChange={(e) => setSelectedCardId(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                >
                  {cards.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Descrição do Estabelecimento</label>
                <input
                  type="text"
                  placeholder="Ex: Computador Dell ou Passagem CVC"
                  value={instDesc}
                  onChange={(e) => setInstDesc(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Valor Total (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Ex: 1200.00"
                    value={instTotalValue}
                    onChange={(e) => setInstTotalValue(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold">Nº de Parcelas</label>
                  <select
                    value={instNumParcelas}
                    onChange={(e) => setInstNumParcelas(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  >
                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                      <option key={n} value={n}>
                        {n}x {instTotalValue ? `de ${formatCurrency((parseFloat(instTotalValue) || 0) / n)}` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold">Data da Primeira Parcela</label>
                <input
                  type="date"
                  value={instStartDate}
                  onChange={(e) => setInstStartDate(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowInstallmentModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Projetar Parcelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Card Transaction */}
      {editingCardTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-xl">
            <h3 className="text-xl font-bold mb-4">Alterar Registro de Cartão</h3>
            <form onSubmit={handleSaveEditCardTx} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Data da Compra</label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Descrição</label>
                <input
                  type="text"
                  value={txDesc}
                  onChange={(e) => setTxDesc(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold">Valor na Fatura (R$)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={txAmount}
                    onChange={(e) => setTxAmount(e.target.value)}
                    className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                    required
                  />
                </div>

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
                    <option value="Serviços">Serviços</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setEditingCardTx(null)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
                Emissor: {cardToDelete.bankName} | Final: **** {cardToDelete.lastFourDigits}
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
