import React, { useState } from 'react';
import {
  Cloud,
  CloudCheck,
  Smartphone,
  Laptop,
  Users,
  ShieldCheck,
  LogOut,
  LogIn,
  CheckCircle2,
  RefreshCw,
  X,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface MultiUserSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMigrateLocalToCloud?: () => Promise<void>;
  itemsCount: {
    accounts: number;
    transactions: number;
    cards: number;
    investments: number;
    futurePayments: number;
  };
}

export const MultiUserSyncModal: React.FC<MultiUserSyncModalProps> = ({
  isOpen,
  onClose,
  onMigrateLocalToCloud,
  itemsCount,
}) => {
  const { user, login, logout, isCloudSynced, lastSyncAt, deviceId, loading } = useAuth();
  const [isMigrating, setIsMigrating] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLogin = async () => {
    try {
      await login();
      setSyncFeedback('Login realizado com sucesso! Seus dados foram conectados à nuvem.');
    } catch (err: any) {
      setSyncFeedback(`Erro no login: ${err?.message || 'Falha ao autenticar'}`);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setSyncFeedback('Desconectado. A aplicação retornou ao modo local neste dispositivo.');
    } catch (err: any) {
      setSyncFeedback('Erro ao desconectar.');
    }
  };

  const handleSyncNow = async () => {
    if (!onMigrateLocalToCloud) return;
    setIsMigrating(true);
    try {
      await onMigrateLocalToCloud();
      setSyncFeedback('Sincronização forçada concluída com sucesso!');
    } catch (err) {
      setSyncFeedback('Falha ao sincronizar dados com o Firestore.');
    } finally {
      setIsMigrating(false);
    }
  };

  const isMobile = deviceId.includes('mobile');

  return (
    <div
      id="multi-user-sync-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-slate-850 w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/30">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-50 dark:bg-indigo-950/60 rounded-xl text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Sincronização Multi-Usuário & Multi-Dispositivo
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Banco de Dados Nuvem em Tempo Real (Firebase Firestore)
              </p>
            </div>
          </div>
          <button
            id="btn-close-sync-modal"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-600 dark:text-slate-300">
          {/* User Status Card */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-900/50 flex items-center justify-between">
            {user ? (
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    referrerPolicy="no-referrer"
                    src={user.photoURL}
                    alt={user.displayName || 'Avatar'}
                    className="w-12 h-12 rounded-full border-2 border-indigo-500 object-cover shadow-xs"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-indigo-600 text-white font-bold text-base flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white text-sm">
                      {user.displayName || 'Usuário Conectado'}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Nuvem Ativa
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    {user.email}
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-500">
                  <Users className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                      Modo Convidado (Local)
                    </span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200">
                      Apenas este dispositivo
                    </span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">
                    Faça login com o Google para sincronizar em outros aparelhos.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Device & Sync Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                {isMobile ? <Smartphone className="w-4 h-4 text-indigo-500" /> : <Laptop className="w-4 h-4 text-indigo-500" />}
                <span className="font-semibold text-[11px] uppercase tracking-wider">Dispositivo</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                {isMobile ? 'Celular / Tablet' : 'Computador / Web'}
              </p>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5 truncate">
                ID: {deviceId}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
              <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                <CloudCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-semibold text-[11px] uppercase tracking-wider">Status Nuvem</span>
              </div>
              <p className="text-sm font-bold text-slate-800 dark:text-slate-100">
                {isCloudSynced ? 'Tempo Real Ativo' : 'Offline / Local'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {lastSyncAt ? `Última sinc: ${lastSyncAt.toLocaleTimeString('pt-BR')}` : 'Não sincronizado'}
              </p>
            </div>
          </div>

          {/* Features Highlights */}
          <div className="space-y-2.5 p-4 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/40">
            <h4 className="font-bold text-indigo-900 dark:text-indigo-200 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              Benefícios do Banco de Dados em Nuvem:
            </h4>
            <ul className="space-y-1.5 text-indigo-900/80 dark:text-indigo-300 text-xs">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong>Multi-Dispositivo:</strong> Acesse do celular, notebook e tablet com os mesmos dados sincronizados instantaneamente.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong>Multi-Usuário Seguro:</strong> Cada conta Google possui sua base criptografada e isolada por regras ABAC Zero-Trust.</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span><strong>Sem Perda de Dados:</strong> Mesmo limpando o cache do navegador ou trocando de aparelho, seu histórico financeiro permanece intacto.</span>
              </li>
            </ul>
          </div>

          {/* Counts overview */}
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/40 text-xs">
            <span className="font-semibold text-slate-700 dark:text-slate-300 block mb-2">
              Registros no Banco de Dados:
            </span>
            <div className="grid grid-cols-3 gap-2 text-slate-600 dark:text-slate-400 text-[11px]">
              <div>🏦 <strong>{itemsCount.accounts}</strong> contas</div>
              <div>💳 <strong>{itemsCount.cards}</strong> cartões</div>
              <div>📈 <strong>{itemsCount.investments}</strong> investimentos</div>
              <div>📝 <strong>{itemsCount.transactions}</strong> transações</div>
              <div>📅 <strong>{itemsCount.futurePayments}</strong> pagamentos</div>
            </div>
          </div>

          {syncFeedback && (
            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-500 shrink-0" />
              <span>{syncFeedback}</span>
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/50 flex items-center justify-between gap-3">
          <button
            id="btn-close-sync-modal-footer"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            {user ? (
              <>
                {onMigrateLocalToCloud && (
                  <button
                    id="btn-force-sync"
                    onClick={handleSyncNow}
                    disabled={isMigrating}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isMigrating ? 'animate-spin' : ''}`} />
                    <span>Forçar Sincronização</span>
                  </button>
                )}
                <button
                  id="btn-logout"
                  onClick={handleLogout}
                  disabled={loading}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 border border-rose-200 dark:border-rose-800 flex items-center gap-1.5 transition-colors"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sair da Conta</span>
                </button>
              </>
            ) : (
              <button
                id="btn-login-google"
                onClick={handleLogin}
                disabled={loading}
                className="px-5 py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md hover:shadow-lg shadow-indigo-500/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Entrar com Google e Sincronizar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
