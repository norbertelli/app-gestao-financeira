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

// ISOLATED SUB-COMPONENT: Add Investment Modal
interface AddInvestmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (inv: Omit<Investment, 'id'>) => void;
}

const AddInvestmentModal: React.FC<AddInvestmentModalProps> = ({ isOpen, onClose, onAdd }) => {
  const [institution, setInstitution] = useState('XP Investimentos');
  const [assetName, setAssetName] = useState('CDB 110% CDI');
  const [assetType, setAssetType] = useState<AssetType>('Renda Fixa');
  const [initialBal, setInitialBal] = useState('5000');
  const [color, setColor] = useState('#10B981');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    onAdd({
      institution: institution.trim() || 'Instituição',
      assetName: assetName.trim(),
      assetType,
      initialBalance: parseFloat(initialBal) || 0,
      color: color || '#10B981',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Cadastrar Novo Ativo / Carteira</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Cadastre títulos de renda fixa, fundos imobiliários, ações ou previdência.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Instituição / Corretora</label>
            <input
              type="text"
              placeholder="Ex: XP Investimentos, BTG, NuInvest"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome do Ativo</label>
            <input
              type="text"
              placeholder="Ex: Tesouro Selic 2029 ou FII HGLG11"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Classe de Ativo</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Ações">Ações</option>
                <option value="FIIs">FIIs (Imobiliário)</option>
                <option value="Fundos">Fundos</option>
                <option value="Cripto">Cripto</option>
                <option value="Previdência">Previdência</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aporte Inicial (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 5000.00"
                value={initialBal}
                onChange={(e) => setInitialBal(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
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
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition-all"
            >
              Cadastrar Ativo
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Edit Investment Modal
interface EditInvestmentModalProps {
  investment: Investment | null;
  onClose: () => void;
  onSave: (inv: Investment) => void;
  onDeleteRequest: (inv: Investment) => void;
}

const EditInvestmentModal: React.FC<EditInvestmentModalProps> = ({
  investment,
  onClose,
  onSave,
  onDeleteRequest,
}) => {
  if (!investment) return null;

  const [institution, setInstitution] = useState(investment.institution);
  const [assetName, setAssetName] = useState(investment.assetName);
  const [assetType, setAssetType] = useState<AssetType>(investment.assetType);
  const [initialBal, setInitialBal] = useState(investment.initialBalance.toString());
  const [color, setColor] = useState(investment.color);

  React.useEffect(() => {
    if (investment) {
      setInstitution(investment.institution);
      setAssetName(investment.assetName);
      setAssetType(investment.assetType);
      setInitialBal(investment.initialBalance.toString());
      setColor(investment.color);
    }
  }, [investment]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assetName.trim()) return;

    onSave({
      ...investment,
      institution: institution.trim() || 'Instituição',
      assetName: assetName.trim(),
      assetType,
      initialBalance: parseFloat(initialBal) || 0,
      color: color || '#10B981',
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Alterar Ativo de Investimento</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Atualize o nome, emissor, classe e valor do aporte inicial.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Instituição / Corretora</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Nome do Ativo</label>
            <input
              type="text"
              value={assetName}
              onChange={(e) => setAssetName(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-800 dark:text-slate-200"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Classe de Ativo</label>
              <select
                value={assetType}
                onChange={(e) => setAssetType(e.target.value as any)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
              >
                <option value="Renda Fixa">Renda Fixa</option>
                <option value="Ações">Ações</option>
                <option value="FIIs">FIIs (Imobiliário)</option>
                <option value="Fundos">Fundos</option>
                <option value="Cripto">Cripto</option>
                <option value="Previdência">Previdência</option>
                <option value="Outros">Outros</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aporte Inicial (R$)</label>
              <input
                type="number"
                step="0.01"
                value={initialBal}
                onChange={(e) => setInitialBal(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteRequest(investment);
              }}
              className="px-3 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 dark:text-rose-400 rounded-xl font-semibold text-xs transition-colors flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Excluir Ativo</span>
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
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition-all"
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

// ISOLATED SUB-COMPONENT: Add Investment Transaction Modal
interface AddInvestmentTxModalProps {
  isOpen: boolean;
  investment: Investment | null;
  onClose: () => void;
  onAdd: (tx: Omit<InvestmentTransaction, 'id'>) => void;
}

const AddInvestmentTxModal: React.FC<AddInvestmentTxModalProps> = ({
  isOpen,
  investment,
  onClose,
  onAdd,
}) => {
  if (!isOpen || !investment) return null;

  const [type, setType] = useState<InvestmentMovementType>('Rendimento');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    const finalVal = type === 'Resgate' || type === 'Taxa/Custódia' ? -Math.abs(val) : Math.abs(val);

    onAdd({
      investmentId: investment.id,
      date,
      type,
      amount: finalVal,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Lançar Movimentação de Investimento</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Ativo: <strong>{investment.assetName}</strong> ({investment.institution})
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo de Movimentação</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold text-slate-800 dark:text-slate-200"
            >
              <option value="Rendimento">Rendimento / Lucro (+)</option>
              <option value="Aporte">Novo Aporte (+)</option>
              <option value="Provento/Dividendo">Dividendo / JCP (+)</option>
              <option value="Resgate">Resgate Parcial (-)</option>
              <option value="Taxa/Custódia">Taxa / Custódia / IR (-)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                placeholder="Ex: 150.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Observação / Nota</label>
            <input
              type="text"
              placeholder="Ex: Rendimento do mês ou cupom semestral"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
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
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition-all"
            >
              Salvar Movimentação
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ISOLATED SUB-COMPONENT: Edit Investment Transaction Modal
interface EditInvestmentTxModalProps {
  tx: InvestmentTransaction | null;
  onClose: () => void;
  onSave: (tx: InvestmentTransaction) => void;
}

const EditInvestmentTxModal: React.FC<EditInvestmentTxModalProps> = ({ tx, onClose, onSave }) => {
  if (!tx) return null;

  const [type, setType] = useState<InvestmentMovementType>(tx.type);
  const [amount, setAmount] = useState(Math.abs(tx.amount).toString());
  const [notes, setNotes] = useState(tx.notes || '');
  const [date, setDate] = useState(tx.date);

  React.useEffect(() => {
    if (tx) {
      setType(tx.type);
      setAmount(Math.abs(tx.amount).toString());
      setNotes(tx.notes || '');
      setDate(tx.date);
    }
  }, [tx]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(amount) || 0;
    const finalVal = type === 'Resgate' || type === 'Taxa/Custódia' ? -Math.abs(val) : Math.abs(val);

    onSave({
      ...tx,
      date,
      type,
      amount: finalVal,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>Alterar Movimentação</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Edite a data, tipo ou valor do lançamento de rendimento.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tipo de Movimentação</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-semibold"
            >
              <option value="Rendimento">Rendimento / Lucro (+)</option>
              <option value="Aporte">Novo Aporte (+)</option>
              <option value="Provento/Dividendo">Dividendo / JCP (+)</option>
              <option value="Resgate">Resgate Parcial (-)</option>
              <option value="Taxa/Custódia">Taxa / Custódia / IR (-)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Data</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-black text-slate-900 dark:text-slate-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Observação / Nota</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-200 dark:border-slate-700 rounded-xl mt-1 bg-slate-50 dark:bg-slate-800 text-sm font-medium"
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
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-900/30 transition-all"
            >
              Salvar Alterações
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

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

  const selectedInv = investments.find((i) => i.id === selectedInvId) || investments[0];

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
            Gestão completa com inclusão, alteração e exclusão de investimentos e movimentações de rendimento.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
            onClick={() => setShowAddModal(true)}
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
                          setEditingInv(inv);
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
              onClick={() => setShowTxModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Lançar Rendimento / Aporte</span>
            </button>
          </div>

          <div className="p-6">
            {investmentTransactions.filter((t) => t.investmentId === selectedInv.id).length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <p className="font-semibold text-slate-700 dark:text-slate-300">Nenhuma movimentação ou rendimento lançado para este ativo.</p>
                <p className="text-xs mt-1">Clique em "Lançar Rendimento / Aporte" para atualizar o saldo patrimonial.</p>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto relative border border-slate-200 dark:border-slate-800 rounded-xl">
                <table className="w-full text-left border-collapse text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-slate-900 z-10 shadow-2xs">
                    <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-3">Data</th>
                      <th className="py-3 px-3">Tipo de Movimento</th>
                      <th className="py-3 px-3">Observação / Nota</th>
                      <th className="py-3 px-3 text-right">Valor</th>
                      <th className="py-3 px-3 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {investmentTransactions
                      .filter((t) => t.investmentId === selectedInv.id)
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-3 px-3 font-medium whitespace-nowrap">{formatDateBR(t.date)}</td>
                          <td className="py-3 px-3">
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                              t.type === 'Rendimento' || t.type === 'Provento/Dividendo' || t.type === 'Aporte'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                : 'bg-rose-50 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                            }`}>
                              {t.type}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-500 text-xs">{t.notes || '-'}</td>
                          <td className={`py-3 px-3 text-right font-bold whitespace-nowrap ${t.amount >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                            {t.amount >= 0 ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => setEditingTx(t)}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Alterar lançamento"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setInvTxToDelete(t)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                                title="Excluir lançamento"
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
      <AddInvestmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddInvestment}
      />

      <EditInvestmentModal
        key={editingInv?.id || 'edit-inv-modal'}
        investment={editingInv}
        onClose={() => setEditingInv(null)}
        onSave={onEditInvestment}
        onDeleteRequest={(inv) => setInvToDelete(inv)}
      />

      <AddInvestmentTxModal
        isOpen={showTxModal}
        investment={selectedInv}
        onClose={() => setShowTxModal(false)}
        onAdd={onAddInvestmentTx}
      />

      <EditInvestmentTxModal
        key={editingTx?.id || 'edit-tx-modal'}
        tx={editingTx}
        onClose={() => setEditingTx(null)}
        onSave={onEditInvestmentTx}
      />

      {/* Confirmation Modal - Delete Investment */}
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
                Corretora: {invToDelete.institution} | Aporte Inicial: {formatCurrency(invToDelete.initialBalance)}
              </p>

              {(() => {
                const linkedTxs = investmentTransactions.filter((t) => t.investmentId === invToDelete.id).length;
                return (
                  <div className="text-xs text-amber-600 dark:text-amber-400 pt-2 border-t border-slate-200 dark:border-slate-700/60 flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>
                      Atenção: Ao excluir este ativo, <strong>{linkedTxs} movimentação(ões) e rendimento(s)</strong> vinculados
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
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Excluir Movimentação de Rendimento</h3>
                <p className="text-xs text-slate-500">Confirmar exclusão de lançamento</p>
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl space-y-1.5 border border-slate-200/60 dark:border-slate-700/50">
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {invTxToDelete.type} - {invTxToDelete.notes || 'Sem observação'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Data: {formatDateBR(invTxToDelete.date)}
              </p>
              <p className="text-sm font-black text-slate-900 dark:text-white pt-1">
                Valor: {invTxToDelete.amount >= 0 ? `+${formatCurrency(invTxToDelete.amount)}` : formatCurrency(invTxToDelete.amount)}
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
