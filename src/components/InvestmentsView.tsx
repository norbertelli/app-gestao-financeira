import React, { useState } from 'react';
import { Investment, InvestmentTransaction, AssetType, InvestmentMovementType } from '../types';
import {
  formatCurrency,
  formatDateBR,
  calculateInvestmentCurrentBalance,
} from '../utils/financeUtils';
import {
  TrendingUp,
  Plus,
  Trash2,
  Edit3,
  ExternalLink,
  AlertTriangle,
} from 'lucide-react';

interface InvestmentsViewProps {
  investments: Investment[];
  investmentTransactions: InvestmentTransaction[];
  onAddInvestment: (inv: Omit<Investment, 'id'>) => void;
  onEditInvestment: (inv: Investment) => void;
  onDeleteInvestment: (id: string) => void;
  onAddInvestmentTx: (tx: Omit<InvestmentTransaction, 'id'>) => void;
  onEditInvestmentTx: (tx: InvestmentTransaction) => void;
  onDeleteInvestmentTx: (id: string) => void;
  onOpenStatementModal: (type: 'investment', entity: Investment) => void;
}

export const InvestmentsView: React.FC<InvestmentsViewProps> = ({
  investments,
  investmentTransactions,
  onAddInvestment,
  onEditInvestment,
  onDeleteInvestment,
  onAddInvestmentTx,
  onEditInvestmentTx,
  onDeleteInvestmentTx,
  onOpenStatementModal,
}) => {
  const [selectedInvId, setSelectedInvId] = useState<string>(investments[0]?.id || '');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingInv, setEditingInv] = useState<Investment | null>(null);

  // Deletion Modals State
  const [invToDelete, setInvToDelete] = useState<Investment | null>(null);
  const [invTxToDelete, setInvTxToDelete] = useState<InvestmentTransaction | null>(null);

  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState<InvestmentTransaction | null>(null);

  // New/Edit Investment Form State
  const [institution, setInstitution] = useState('XP Investimentos');
  const [assetName, setAssetName] = useState('CDB 110% CDI');
  const [assetType, setAssetType] = useState<AssetType>('Renda Fixa');
  const [initialBal, setInitialBal] = useState('5000');
  const [color, setColor] = useState('#E53935');

  // New/Edit Movement Form State
  const [txType, setTxType] = useState<InvestmentMovementType>('Rendimento');
  const [txAmount, setTxAmount] = useState('');
  const [txNotes, setTxNotes] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);

  const selectedInv = investments.find((i) => i.id === selectedInvId) || investments[0];

  const handleOpenAddModal = () => {
    setInstitution('XP Investimentos');
    setAssetName('CDB 110% CDI');
    setAssetType('Renda Fixa');
    setInitialBal('5000');
    setColor('#E53935');
    setShowAddModal(true);
  };

  const handleCreateInvestment = (e: React.FormEvent) => {
    e.preventDefault();
    onAddInvestment({
      institution,
      assetName,
      assetType,
      initialBalance: parseFloat(initialBal) || 0,
      color,
    });
    setShowAddModal(false);
  };

  const handleOpenEditInv = (inv: Investment) => {
    setEditingInv(inv);
    setInstitution(inv.institution);
    setAssetName(inv.assetName);
    setAssetType(inv.assetType);
    setInitialBal(inv.initialBalance.toString());
    setColor(inv.color);
  };

  const handleSaveEditInv = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInv) return;

    onEditInvestment({
      ...editingInv,
      institution,
      assetName,
      assetType,
      initialBalance: parseFloat(initialBal) || 0,
      color,
    });

    setEditingInv(null);
  };

  const handleOpenAddTx = () => {
    setTxType('Rendimento');
    setTxAmount('');
    setTxNotes('');
    setTxDate(new Date().toISOString().split('T')[0]);
    setShowTxModal(true);
  };

  const handleCreateTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInv) return;
    const val = parseFloat(txAmount) || 0;
    const finalVal = txType === 'Resgate' || txType === 'Taxa/Custódia' ? -Math.abs(val) : Math.abs(val);

    onAddInvestmentTx({
      investmentId: selectedInv.id,
      date: txDate,
      type: txType,
      amount: finalVal,
      notes: txNotes,
    });

    setTxAmount('');
    setTxNotes('');
    setShowTxModal(false);
  };

  const handleOpenEditTx = (t: InvestmentTransaction) => {
    setEditingTx(t);
    setTxType(t.type);
    setTxAmount(Math.abs(t.amount).toString());
    setTxNotes(t.notes || '');
    setTxDate(t.date);
  };

  const handleSaveEditTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTx) return;

    const val = parseFloat(txAmount) || 0;
    const finalVal = txType === 'Resgate' || txType === 'Taxa/Custódia' ? -Math.abs(val) : Math.abs(val);

    onEditInvestmentTx({
      ...editingTx,
      date: txDate,
      type: txType,
      amount: finalVal,
      notes: txNotes,
    });

    setEditingTx(null);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
            <span>Investimentos & Rendimentos Aportados</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Gestão com inclusão, alteração e exclusão de investimentos e movimentações de rendimento.
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md shadow-emerald-900/20"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Ativo / Carteira</span>
        </button>
      </div>

      {/* Grid of Investments or Empty State */}
      {investments.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center shadow-2xs">
          <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Nenhum ativo ou investimento cadastrado</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto mt-1 mb-6">
            Todos os ativos foram excluídos. Cadastre novos ativos e fundos para acompanhar rendimentos e evolução patrimonial.
          </p>
          <button
            onClick={handleOpenAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Cadastrar Novo Ativo</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {investments.map((inv) => {
            const curBal = calculateInvestmentCurrentBalance(inv, investmentTransactions);
            const isSelected = inv.id === selectedInvId;

            return (
              <div
                key={inv.id}
                onClick={() => setSelectedInvId(inv.id)}
                className={`p-6 rounded-2xl border cursor-pointer transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-900 text-white border-emerald-500 shadow-xl ring-2 ring-emerald-500/50'
                    : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {inv.assetType}
                    </span>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenEditInv(inv);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Editar Ativo"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setInvToDelete(inv);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-rose-600/30 rounded-lg text-rose-300 transition-colors"
                        title="Excluir Ativo e Rendimentos"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenStatementModal('investment', inv);
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-colors"
                        title="Abrir Extrato de Rendimentos em Modal"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-black">{inv.assetName}</h3>
                  <p className="text-xs opacity-75 mt-0.5">{inv.institution}</p>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-700/40">
                  <span className="text-[10px] opacity-70 uppercase tracking-wider block">Saldo Atual Calculado</span>
                  <span className={`text-2xl font-black ${curBal < 0 ? 'text-red-500 font-bold' : 'text-emerald-400'}`}>
                    {formatCurrency(curBal)}
                  </span>
                  <span className={`text-[10px] opacity-60 block mt-0.5 ${inv.initialBalance < 0 ? 'text-red-400 font-bold' : ''}`}>
                    Aporte Inicial: {formatCurrency(inv.initialBalance)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Selected Investment Statement */}
      {selectedInv && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs overflow-hidden">
          <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50 dark:bg-slate-800/30">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Movimentações & Rendimentos: {selectedInv.assetName}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {selectedInv.institution} ({selectedInv.assetType})
              </p>
            </div>

            <button
              onClick={handleOpenAddTx}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Rendimento / Aporte</span>
            </button>
          </div>

          <div className="p-6">
            {investmentTransactions.filter((t) => t.investmentId === selectedInv.id).length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                Nenhum rendimento ou resgate registrado ainda.
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto relative border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Tipo</th>
                      <th className="py-3 px-3">Observações</th>
                      <th className="py-3 px-3 text-right">Valor</th>
                      <th className="py-3 px-3 text-center">Ações (Alterar/Excluir)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {investmentTransactions
                      .filter((t) => t.investmentId === selectedInv.id)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((t) => {
                        const isPos = t.amount >= 0;
                        return (
                          <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                            <td className="py-3 px-3 font-medium whitespace-nowrap">{formatDateBR(t.date)}</td>
                            <td className="py-3 px-3">
                              <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                                {t.type}
                              </span>
                            </td>
                            <td className="py-3 px-3 font-medium">{t.notes || '-'}</td>
                            <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${isPos ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500 font-bold'}`}>
                              {isPos ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount)}
                            </td>
                            <td className="py-3 px-3 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  onClick={() => handleOpenEditTx(t)}
                                  className="p-1 text-slate-400 hover:text-indigo-600"
                                  title="Alterar Movimentação"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setInvTxToDelete(t)}
                                  className="p-1 text-slate-400 hover:text-rose-600"
                                  title="Excluir Movimentação"
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

      {/* Modal Add Investment */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Adicionar Novo Investimento</h3>
            <form onSubmit={handleCreateInvestment} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Instituição (Corretora / Banco)</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Nome do Ativo / Aplicação</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Tipo do Ativo</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Tesouro Direto">Tesouro Direto</option>
                  <option value="FIIs">FIIs (Fundos Imobiliários)</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos">Fundos de Investimento</option>
                  <option value="Cripto">Criptomoedas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Aporte / Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBal}
                  onChange={(e) => setInitialBal(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Cadastrar Investimento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Investment */}
      {editingInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-2xl">
            <h3 className="text-xl font-bold mb-4">Alterar Investimento</h3>
            <form onSubmit={handleSaveEditInv} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Instituição</label>
                <input
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Nome do Ativo</label>
                <input
                  type="text"
                  value={assetName}
                  onChange={(e) => setAssetName(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Tipo do Ativo</label>
                <select
                  value={assetType}
                  onChange={(e) => setAssetType(e.target.value as any)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <option value="Renda Fixa">Renda Fixa</option>
                  <option value="Tesouro Direto">Tesouro Direto</option>
                  <option value="FIIs">FIIs (Fundos Imobiliários)</option>
                  <option value="Ações">Ações</option>
                  <option value="Fundos">Fundos de Investimento</option>
                  <option value="Cripto">Criptomoedas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Aporte / Saldo Inicial (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  value={initialBal}
                  onChange={(e) => setInitialBal(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const inv = editingInv;
                    setEditingInv(null);
                    setInvToDelete(inv);
                  }}
                  className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Ativo</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingInv(null)}
                    className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded-xl font-medium text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-medium text-xs shadow-md"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Movement */}
      {(showTxModal || editingTx) && selectedInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-2xl">
            <h3 className="text-xl font-bold mb-4">
              {editingTx ? 'Alterar Movimentação' : 'Lançar Movimentação'}
            </h3>
            <form onSubmit={editingTx ? handleSaveEditTx : handleCreateTx} className="space-y-3">
              <div>
                <label className="text-xs font-semibold">Tipo de Movimento</label>
                <select
                  value={txType}
                  onChange={(e) => setTxType(e.target.value as any)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <option value="Rendimento">Rendimento / Dividendos (+)</option>
                  <option value="Aporte">Novo Aporte (+)</option>
                  <option value="Resgate">Resgate (-)</option>
                  <option value="Taxa/Custódia">Taxa ou Imposto (-)</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Ex: 78.50"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold">Observações</label>
                <input
                  type="text"
                  placeholder="Ex: Dividendos referentes a Agosto"
                  value={txNotes}
                  onChange={(e) => setTxNotes(e.target.value)}
                  className="w-full p-2 border rounded mt-1 bg-slate-50 dark:bg-slate-800 text-sm"
                />
              </div>

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

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowTxModal(false);
                    setEditingTx(null);
                  }}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded font-medium text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 text-white rounded font-medium text-xs shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete Investment Asset */}
      {invToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Ativo de Investimento</h3>
                <p className="text-xs text-slate-500">Ação irreversível</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-2 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {invToDelete.assetName} ({invToDelete.assetType})
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Instituição: {invToDelete.institution}
              </p>

              {(() => {
                const linkedTxs = investmentTransactions.filter((t) => t.investmentId === invToDelete.id).length;
                return (
                  <div className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Atenção: Ao excluir este ativo, <strong>{linkedTxs} movimentação(ões)/rendimento(s)</strong> vinculados
                      serão excluídos permanentemente.
                    </span>
                  </div>
                );
              })()}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  const idToDelete = invToDelete.id;
                  onDeleteInvestment(idToDelete);
                  const remaining = investments.filter((i) => i.id !== idToDelete);
                  setSelectedInvId(remaining[0]?.id || '');
                  setInvToDelete(null);
                }}
                className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-900/30 transition-colors"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal - Delete Investment Movement */}
      {invTxToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Movimentação</h3>
                <p className="text-xs text-slate-500">Confirmar exclusão de rendimento ou resgate</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Tipo: {invTxToDelete.type}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data: {formatDateBR(invTxToDelete.date)} | Obs: {invTxToDelete.notes || '-'}
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white pt-1">
                Valor: {formatCurrency(invTxToDelete.amount)}
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setInvTxToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-semibold transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteInvestmentTx(invTxToDelete.id);
                  setInvTxToDelete(null);
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
