import React, { useState } from 'react';
import {
  Cloud,
  CloudCheck,
  LogIn,
  RefreshCw,
  Smartphone,
  Laptop,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface CloudSyncBannerProps {
  onOpenSyncModal: () => void;
  onMigrateLocalToCloud?: () => Promise<void>;
  itemsCount: {
    accounts: number;
    cards: number;
    investments: number;
  };
}

export const CloudSyncBanner: React.FC<CloudSyncBannerProps> = ({
  onOpenSyncModal,
  onMigrateLocalToCloud,
  itemsCount,
}) => {
  const { user, login, loading, isCloudSynced, lastSyncAt, deviceId } = useAuth();
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);

  const handleQuickLogin = async () => {
    try {
      await login();
    } catch (err: any) {
      console.error('Login error:', err);
    }
  };

  const handleQuickSync = async () => {
    if (!onMigrateLocalToCloud) return;
    setIsSyncing(true);
    try {
      await onMigrateLocalToCloud();
      setSyncFeedback('Dados sincronizados com a nuvem com sucesso!');
      setTimeout(() => setSyncFeedback(null), 4000);
    } catch (err) {
      setSyncFeedback('Erro ao sincronizar dados.');
      setTimeout(() => setSyncFeedback(null), 4000);
    } finally {
      setIsSyncing(false);
    }
  };

  const isMobile = deviceId.includes('mobile');

  if (!user) {
    return (
      <div
        id="cloud-sync-banner-offline"
        className="mb-6 bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-amber-500/10 dark:from-amber-950/40 dark:via-slate-900 dark:to-indigo-950/40 border border-amber-300/60 dark:border-amber-700/50 rounded-2xl p-4 shadow-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl shrink-0 mt-0.5">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Base de Dados Local (Armazenada apenas neste aparelho)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-200/60 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
                  Modo Convidado
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 max-w-2xl leading-relaxed">
                Suas alterações de cadastro ({itemsCount.accounts} contas, {itemsCount.cards} cartões e {itemsCount.investments} ativos) estão salvas apenas no navegador deste {isMobile ? 'celular' : 'computador'}. Para que fiquem salvas na <strong>Nuvem (Firebase Firestore)</strong> e sincronizadas automaticamente com seus outros aparelhos, conecte sua conta Google.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-center shrink-0">
            <button
              id="btn-banner-connect-google"
              onClick={handleQuickLogin}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.02] cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Conectar Conta Google e Salvar na Nuvem</span>
            </button>

            <button
              id="btn-banner-info"
              onClick={onOpenSyncModal}
              className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-xl transition-colors text-xs font-semibold"
              title="Informações de Sincronização"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="cloud-sync-banner-online"
      className="mb-6 bg-slate-900 text-white border border-emerald-500/30 rounded-2xl p-3.5 sm:px-5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3"
    >
      <div className="flex items-center gap-3">
        <div className="relative flex h-3 w-3 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
        </div>

        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-xs sm:text-sm text-emerald-400 flex items-center gap-1.5">
              <CloudCheck className="w-4 h-4 text-emerald-400 inline" />
              Base de Dados na Nuvem Conectada
            </span>
            <span className="text-slate-400 text-xs hidden sm:inline">•</span>
            <span className="text-xs text-slate-300 font-medium truncate max-w-xs">
              {user.email}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Toda alteração de cadastro ou movimentação é sincronizada em tempo real com todos os seus dispositivos.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
        {syncFeedback && (
          <span className="text-xs font-semibold text-emerald-400 animate-in fade-in">
            {syncFeedback}
          </span>
        )}

        {onMigrateLocalToCloud && (
          <button
            id="btn-banner-force-sync"
            onClick={handleQuickSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
            title="Enviar e forçar atualização na nuvem"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>Sincronizar</span>
          </button>
        )}

        <button
          id="btn-banner-manage-sync"
          onClick={onOpenSyncModal}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 rounded-xl text-xs font-semibold transition-colors"
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Dispositivos</span>
        </button>
      </div>
    </div>
  );
};
