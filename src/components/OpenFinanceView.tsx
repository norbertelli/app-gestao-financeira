import React, { useState } from 'react';
import { OpenFinanceConnection } from '../types';
import {
  ShieldCheck,
  RefreshCw,
  Plus,
  CheckCircle2,
  Lock,
  Building2,
  ExternalLink,
  Clock,
  Zap,
} from 'lucide-react';

interface OpenFinanceViewProps {
  connections: OpenFinanceConnection[];
  onSyncConnections: () => void;
}

export const OpenFinanceView: React.FC<OpenFinanceViewProps> = ({
  connections,
  onSyncConnections,
}) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncLogs, setSyncLogs] = useState<string[]>([]);
  const [showConnectModal, setShowConnectModal] = useState(false);

  const handleRunOpenFinanceSync = () => {
    setIsSyncing(true);
    setSyncLogs(['Iniciando protocolo de sincronização Open Finance (Banco Central do Brasil)...']);

    setTimeout(() => {
      setSyncLogs((prev) => [...prev, 'Autenticando mTLS com Itaú Unibanco (Banco 341)...']);
    }, 600);

    setTimeout(() => {
      setSyncLogs((prev) => [...prev, 'Obtendo extrato bancário & faturas de cartão de Nubank (Banco 260)...']);
    }, 1200);

    setTimeout(() => {
      setSyncLogs((prev) => [...prev, 'Sincronizando investimentos de XP & BTG Pactual...']);
    }, 1800);

    setTimeout(() => {
      setSyncLogs((prev) => [...prev, '✓ Sincronização concluída com sucesso! Todos os extratos e faturas atualizados.']);
      setIsSyncing(false);
      onSyncConnections();
    }, 2400);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-emerald-800/40">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-full text-xs font-semibold mb-3">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Regulado pelo Banco Central do Brasil</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Central Open Finance Brasil
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl">
          Conexão bancária direta, segura e em tempo real com todos os seus bancos, operadoras de cartão de crédito e corretoras de investimento.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            onClick={handleRunOpenFinanceSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-sm shadow-md transition-all"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Sincronizando Open Finance...' : 'Sincronizar Todas as Instituições'}</span>
          </button>

          <button
            onClick={() => setShowConnectModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-sm transition-all border border-white/20"
          >
            <Plus className="w-4 h-4" />
            <span>Conectar Novo Banco</span>
          </button>
        </div>
      </div>

      {/* Sync Console Logs */}
      {syncLogs.length > 0 && (
        <div className="bg-slate-900 text-slate-200 p-4 rounded-xl border border-slate-800 font-mono text-xs space-y-1">
          {syncLogs.map((log, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-emerald-400">&gt;</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}

      {/* Connected Institutions Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-extrabold text-sm shadow-sm"
                    style={{ backgroundColor: conn.logoColor }}
                  >
                    {conn.institutionCode}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                      {conn.institutionName}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      Cód. BACEN: {conn.institutionCode}
                    </span>
                  </div>
                </div>

                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{conn.status}</span>
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-slate-400 block">Contas & Cartões Vinculados:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {conn.accountsLinkedCount} produtos Open Finance
                  </span>
                </div>

                <div>
                  <span className="text-slate-400 block">Última Sincronização:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200 mt-0.5 block">
                    {conn.lastSync}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Consentimento válido até {conn.consentExpiresAt}</span>
              </span>

              <span className="text-indigo-600 dark:text-indigo-400 font-semibold cursor-pointer hover:underline">
                Gerenciar Consentimento
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Connect New Bank */}
      {showConnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border shadow-2xl">
            <h3 className="text-xl font-bold mb-2">Conectar Novo Banco via Open Finance</h3>
            <p className="text-xs text-slate-500 mb-4">
              Redirecionamento seguro para autenticação oficial no app do seu banco.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {['Bradesco S.A.', 'Banco Santander', 'C6 Bank', 'Banco BTG Pactual', 'Caixa Econômica Federal'].map((banco, i) => (
                <div
                  key={i}
                  onClick={() => {
                    alert(`Iniciando fluxo de consentimento Open Finance para ${banco}...`);
                    setShowConnectModal(false);
                  }}
                  className="p-3 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-xl border border-slate-200 dark:border-slate-700 cursor-pointer flex items-center justify-between text-sm font-semibold transition-colors"
                >
                  <span>{banco}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400" />
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowConnectModal(false)}
                className="px-4 py-2 bg-slate-200 dark:bg-slate-800 rounded text-sm font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
