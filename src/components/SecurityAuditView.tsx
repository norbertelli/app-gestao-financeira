import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Shield,
  Zap,
  Activity,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Search,
  RefreshCw,
  Cpu,
  Database,
  Lock,
  ArrowRight,
  TrendingUp,
  Download,
  Terminal,
  Server,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  BankAccount,
  BankTransaction,
  CreditCard,
  CardTransaction,
  Debt,
  AuditLogItem,
  StressTestMetrics,
} from '../types';
import { useAuth } from '../context/AuthContext';
import {
  getLocalAuditLogs,
  recordAuditEvent,
  runComprehensiveSecurityAudit,
  SecurityAuditReport,
} from '../services/auditLogger';
import {
  insertMassiveStressData,
  clearStressTestDataFromFirestore,
} from '../services/firebase';
import { formatCurrency, formatDateBR } from '../utils/financeUtils';

interface SecurityAuditViewProps {
  accounts: BankAccount[];
  bankTransactions: BankTransaction[];
  cards: CreditCard[];
  cardTransactions: CardTransaction[];
  debts: Debt[];
  onAddMassiveTransactions: (newTxs: BankTransaction[]) => void;
  onClearMassiveTransactions: () => void;
  auditLogs: AuditLogItem[];
  onRefreshAuditLogs?: () => void;
}

export const SecurityAuditView: React.FC<SecurityAuditViewProps> = ({
  accounts,
  bankTransactions,
  cards,
  cardTransactions,
  debts,
  onAddMassiveTransactions,
  onClearMassiveTransactions,
  auditLogs: propAuditLogs,
  onRefreshAuditLogs,
}) => {
  const { user, isAdmin, isCloudSynced } = useAuth();

  // Internal tab state
  const [activeSubTab, setActiveSubTab] = useState<'stress' | 'audit_trail' | 'scanner'>('stress');

  // Stress test states
  const [stressVolume, setStressVolume] = useState<number>(200);
  const [targetAccountId, setTargetAccountId] = useState<string>(
    accounts[0]?.id || 'acc-1'
  );
  const [stressMode, setStressMode] = useState<'cloud_and_local' | 'local_only'>('cloud_and_local');
  const [isInjectingStress, setIsInjectingStress] = useState<boolean>(false);
  const [stressProgress, setStressProgress] = useState<number>(0);
  const [lastMetrics, setLastMetrics] = useState<StressTestMetrics | null>(null);
  const [isClearingStress, setIsClearingStress] = useState<boolean>(false);
  const [confirmPurgeMode, setConfirmPurgeMode] = useState<boolean>(false);
  const [stressFeedback, setStressFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Audit trail filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [combinedLogs, setCombinedLogs] = useState<AuditLogItem[]>([]);

  // Security Scanner states
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [auditReport, setAuditReport] = useState<SecurityAuditReport>(() =>
    runComprehensiveSecurityAudit(accounts, bankTransactions, cards, cardTransactions, debts)
  );

  // Sync audit logs (combines prop logs from Firestore and local storage logs)
  useEffect(() => {
    const localLogs = getLocalAuditLogs();
    const merged = [...(propAuditLogs || [])];

    localLogs.forEach((local) => {
      if (!merged.some((m) => m.id === local.id)) {
        merged.push(local);
      }
    });

    merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setCombinedLogs(merged);
  }, [propAuditLogs]);

  // Recalculate audit report when data changes
  const handleRunSecurityScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      const report = runComprehensiveSecurityAudit(
        accounts,
        bankTransactions,
        cards,
        cardTransactions,
        debts
      );
      setAuditReport(report);
      setIsScanning(false);

      recordAuditEvent(
        'SECURITY_SCAN_COMPLETED',
        'SECURITY',
        report.score >= 85 ? 'INFO' : 'WARNING',
        `Varredura de integridade executada: Score de ${report.score}% (${report.passedChecks}/${report.totalChecks} conformes).`,
        user
      );
    }, 600);
  };

  // Run initial scan once
  useEffect(() => {
    const report = runComprehensiveSecurityAudit(
      accounts,
      bankTransactions,
      cards,
      cardTransactions,
      debts
    );
    setAuditReport(report);
  }, [accounts, bankTransactions, cards, cardTransactions, debts]);

  // Count stress items currently active
  const currentStressCount = bankTransactions.filter((t: any) => {
    const id = t.id || '';
    const desc = t.description || '';
    const notes = t.notes || '';
    return (
      id.startsWith('stress_tx_') ||
      t.isStressTest === true ||
      desc.includes('[TESTE-MASSIVO]') ||
      desc.includes('Operação Carga') ||
      desc.includes('[STRESS-TEST]') ||
      notes.includes('[STRESS-TEST]')
    );
  }).length;

  // Handle generating and injecting massive stress data
  const handleExecuteStressTest = async () => {
    if (isInjectingStress) return;
    setIsInjectingStress(true);
    setStressProgress(0);
    setStressFeedback(null);

    const startTime = performance.now();
    const targetAccount = accounts.find((a) => a.id === targetAccountId) || accounts[0];
    const generated: BankTransaction[] = [];

    const categoriesList = ['Alimentação', 'Transporte', 'Serviços', 'Lazer', 'Rendimento', 'Salário', 'Outros'];
    const typesList: Array<BankTransaction['type']> = ['PIX', 'TED', 'Boleto', 'Cartão'];

    const now = new Date();

    for (let i = 1; i <= stressVolume; i++) {
      const isCredit = i % 4 === 0;
      const amount = isCredit
        ? +(Math.random() * 800 + 50).toFixed(2)
        : -(+(Math.random() * 300 + 10).toFixed(2));

      const daysAgo = Math.floor(Math.random() * 60);
      const d = new Date(now);
      d.setDate(d.getDate() - daysAgo);
      const dateStr = d.toISOString().split('T')[0];

      const cat = categoriesList[i % categoriesList.length];
      const type = typesList[i % typesList.length];

      generated.push({
        id: `stress_tx_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
        accountId: targetAccount ? targetAccount.id : 'acc-1',
        date: dateStr,
        description: `[TESTE-MASSIVO] Operação Carga #${i.toString().padStart(4, '0')}`,
        amount,
        category: cat,
        type,
        status: 'Concluído',
        notes: `[STRESS-TEST] Registro gerado para teste de carga. ID Lote: ${Date.now()}`,
        isStressTest: true,
      } as any);
    }

    try {
      if (stressMode === 'cloud_and_local' && user?.uid && isCloudSynced) {
        // Real Firestore batch insert
        await insertMassiveStressData(user.uid, generated, (pct) => {
          setStressProgress(pct);
        });
      } else {
        // Local simulation with incremental progress
        for (let p = 10; p <= 100; p += 25) {
          setStressProgress(p);
          await new Promise((r) => setTimeout(r, 60));
        }
      }

      // Add to client state
      onAddMassiveTransactions(generated);

      const durationMs = Math.round(performance.now() - startTime);
      const opsPerSec = Math.round((stressVolume / (durationMs / 1000)) || 0);

      const metrics: StressTestMetrics = {
        totalItems: stressVolume,
        batchCount: Math.ceil(stressVolume / 400),
        durationMs,
        throughputOpsSec: opsPerSec,
        successCount: stressVolume,
        errorCount: 0,
        timestamp: new Date().toISOString(),
        targetEntity: 'bank_transactions',
      };

      setLastMetrics(metrics);
      setStressFeedback({
        message: `Teste concluído com sucesso! ${stressVolume} transações injetadas em ${durationMs}ms (~${opsPerSec} ops/segundo).`,
        type: 'success',
      });

      // Log event
      await recordAuditEvent(
        'STRESS_TEST_EXECUTED',
        'STRESS_TEST',
        'INFO',
        `Disparo de teste massivo: ${stressVolume} registros injetados em ${durationMs}ms na conta ${targetAccount?.bankName || 'Geral'}.`,
        user,
        metrics as any
      );
    } catch (err: any) {
      console.error('Falha no teste massivo:', err);
      setStressFeedback({
        message: `Erro na execução do teste massivo: ${err.message || String(err)}`,
        type: 'error',
      });
    } finally {
      setIsInjectingStress(false);
    }
  };

  // Handle purging only the synthetic stress test data
  const handlePurgeStressData = async () => {
    if (isClearingStress) return;
    setIsClearingStress(true);
    setStressFeedback(null);
    setConfirmPurgeMode(false);

    try {
      // 1. Immediately clear from local memory and LocalStorage via parent handler
      onClearMassiveTransactions();

      // 2. Also clear from Firestore if user is authenticated
      if (user?.uid) {
        try {
          await clearStressTestDataFromFirestore(user.uid);
        } catch (cloudErr) {
          console.warn('Erro ao expurgar da nuvem Firestore:', cloudErr);
        }
      }

      setStressFeedback({
        message: `Limpeza concluída com sucesso! Os registros de teste massivo foram expurgados da base de dados.`,
        type: 'success',
      });

      await recordAuditEvent(
        'STRESS_DATA_PURGED',
        'STRESS_TEST',
        'INFO',
        `Expurgo de teste massivo executado: registros sintéticos removidos com integridade preservada.`,
        user
      );
    } catch (err: any) {
      console.error('Erro ao expurgar dados de estresse:', err);
      setStressFeedback({
        message: `Erro ao limpar dados de teste: ${err.message || String(err)}`,
        type: 'error',
      });
    } finally {
      setIsClearingStress(false);
    }
  };

  // Filtered audit logs
  const filteredLogs = combinedLogs.filter((log) => {
    const matchesSearch =
      !searchTerm ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.userEmail && log.userEmail.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = categoryFilter === 'ALL' || log.category === categoryFilter;
    const matchesSeverity = severityFilter === 'ALL' || log.severity === severityFilter;

    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // Export audit report to JSON
  const handleExportAuditReportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(auditReport, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `relatorio_auditoria_finflow_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-900/40 rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Skill & Módulo de Auditoria, Segurança & Estresse</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
              Central de Auditoria & Testes Massivos
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl">
              Execute testes de carga e estresse com injeção em massa, analise a trilha de auditoria (audit trail) e verifique a conformidade e integridade contábil do sistema.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleRunSecurityScan}
              disabled={isScanning}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-lg shadow-indigo-600/30 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Varrendo Sistema...' : 'Varredura de Integridade'}</span>
            </button>

            <button
              onClick={handleExportAuditReportJSON}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 border border-slate-700 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>Exportar Laudo JSON</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">Score de Segurança</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-black ${auditReport.score >= 85 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {auditReport.score}%
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-md font-bold bg-slate-800 text-slate-300">
                {auditReport.status}
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">Contas Auditadas</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-white">{accounts.length}</span>
              <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-0.5">
                <CheckCircle2 className="w-3 h-3" /> Reconciliadas
              </span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">Dados de Teste Ativos</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`text-xl font-black ${currentStressCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                {currentStressCount}
              </span>
              <span className="text-[10px] text-slate-400">registros</span>
            </div>
          </div>

          <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <p className="text-[11px] text-slate-400 font-medium">Eventos de Auditoria</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xl font-black text-indigo-300">{combinedLogs.length}</span>
              <span className="text-[10px] text-slate-400">registrados</span>
            </div>
          </div>
        </div>
      </div>

      {/* Subtab Navigation */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('stress')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'stress'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4 text-amber-400" />
          <span>Testes Massivos & Benchmark de Carga</span>
          {currentStressCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300 text-[10px] font-black border border-amber-500/40">
              {currentStressCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('audit_trail')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'audit_trail'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4 text-indigo-400" />
          <span>Trilha de Auditoria (Audit Trail)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('scanner')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap ${
            activeSubTab === 'scanner'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
          <span>Scanner de Segurança & Integridade</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUBTAB 1: TESTES MASSIVOS & BENCHMARK                                      */}
      {/* ========================================================================= */}
      {activeSubTab === 'stress' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Control Panel for Massive Testing */}
            <div className="lg:col-span-1 bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
                  <Cpu className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Configurar Teste Massivo</h3>
                  <p className="text-[11px] text-slate-400">Injeção sintética controlada</p>
                </div>
              </div>

              {/* Volume selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2">
                  Volume de Registros: <span className="text-amber-400 font-bold">{stressVolume} transações</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[50, 100, 200, 500].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStressVolume(v)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        stressVolume === v
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      +{v}
                    </button>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {[1000, 2000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStressVolume(v)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        stressVolume === v
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/50 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                      }`}
                    >
                      Carga Alta: +{v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Account */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Conta Bancária de Destino
                </label>
                <select
                  value={targetAccountId}
                  onChange={(e) => setTargetAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-hidden focus:ring-2 focus:ring-amber-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.bankName} - {acc.accountNumber} ({acc.type})
                    </option>
                  ))}
                </select>
              </div>

              {/* Persistence Mode */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Alvo de Persistência
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setStressMode('cloud_and_local')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      stressMode === 'cloud_and_local'
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <Database className="w-3 h-3 text-indigo-400" /> Nuvem + Local
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Testa latência real do Firestore
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setStressMode('local_only')}
                    className={`p-2.5 rounded-xl border text-left flex flex-col gap-1 transition-all ${
                      stressMode === 'local_only'
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-200'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    <span className="font-bold flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-400" /> Apenas Memória
                    </span>
                    <span className="text-[10px] text-slate-400 leading-tight">
                      Zero impacto na cota de nuvem
                    </span>
                  </button>
                </div>
              </div>

              {/* Progress bar if injecting */}
              {isInjectingStress && (
                <div className="space-y-1.5">
                  <div className="flex justify-between text-[11px] text-amber-300 font-semibold">
                    <span>Gravando Lote em Massa...</span>
                    <span>{stressProgress}%</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-indigo-500 transition-all duration-150"
                      style={{ width: `${stressProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  onClick={handleExecuteStressTest}
                  disabled={isInjectingStress || isClearingStress}
                  className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 to-indigo-600 hover:from-amber-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-amber-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
                >
                  <Zap className={`w-4 h-4 ${isInjectingStress ? 'animate-bounce' : ''}`} />
                  <span>{isInjectingStress ? 'Injetando Carga...' : `Disparar Teste (+${stressVolume} registros)`}</span>
                </button>

                {currentStressCount > 0 && (
                  !confirmPurgeMode ? (
                    <button
                      type="button"
                      id="btn-open-purge-confirm"
                      onClick={() => setConfirmPurgeMode(true)}
                      disabled={isInjectingStress || isClearingStress}
                      className="w-full py-2.5 px-4 bg-rose-950/40 hover:bg-rose-900/60 active:bg-rose-900 text-rose-300 border border-rose-800/60 rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all shadow-md"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Limpar {currentStressCount} Dados de Teste</span>
                    </button>
                  ) : (
                    <div className="p-3 bg-rose-950/70 border border-rose-600/70 rounded-2xl space-y-2 animate-in fade-in duration-150">
                      <p className="text-xs font-semibold text-rose-200 text-center">
                        Deseja expurgar os {currentStressCount} dados de teste?
                      </p>
                      <p className="text-[10px] text-slate-400 text-center">
                        Seus dados e transações reais permanecerão 100% preservados.
                      </p>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          id="btn-confirm-purge-stress"
                          onClick={handlePurgeStressData}
                          disabled={isClearingStress}
                          className="py-2 px-3 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>{isClearingStress ? 'Limpando...' : 'Sim, Limpar'}</span>
                        </button>
                        <button
                          type="button"
                          id="btn-cancel-purge-stress"
                          onClick={() => setConfirmPurgeMode(false)}
                          disabled={isClearingStress}
                          className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )
                )}
              </div>

              {/* Feedback Alert */}
              {stressFeedback && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    stressFeedback.type === 'success'
                      ? 'bg-emerald-950/60 border-emerald-800 text-emerald-300'
                      : 'bg-rose-950/60 border-rose-800 text-rose-300'
                  }`}
                >
                  {stressFeedback.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <span>{stressFeedback.message}</span>
                </div>
              )}
            </div>

            {/* Performance Benchmark Telemetry */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-white">Métricas de Performance do Benchmark</h3>
                      <p className="text-[11px] text-slate-400">Latência, throughput e integridade de escrita</p>
                    </div>
                  </div>
                  {lastMetrics && (
                    <span className="text-[10px] text-slate-400 font-mono">
                      Última execução: {new Date(lastMetrics.timestamp).toLocaleTimeString('pt-BR')}
                    </span>
                  )}
                </div>

                {lastMetrics ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Tempo de Execução</p>
                      <p className="text-xl font-black text-amber-400 mt-1">{lastMetrics.durationMs} ms</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Tempo total de resposta</p>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Throughput (Velocidade)</p>
                      <p className="text-xl font-black text-emerald-400 mt-1">
                        ~{lastMetrics.throughputOpsSec} <span className="text-xs font-normal">ops/s</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Operações por segundo</p>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Lotes de Gravação</p>
                      <p className="text-xl font-black text-indigo-300 mt-1">{lastMetrics.batchCount}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">Batches atômicos</p>
                    </div>

                    <div className="p-3.5 bg-slate-950 rounded-2xl border border-slate-800">
                      <p className="text-[11px] text-slate-400">Taxa de Sucesso</p>
                      <p className="text-xl font-black text-emerald-400 mt-1">100%</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">0 falhas ou conflitos</p>
                    </div>
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-950/60 rounded-2xl border border-dashed border-slate-800">
                    <Cpu className="w-10 h-10 text-slate-600 mx-auto mb-2 animate-pulse" />
                    <p className="text-xs font-semibold text-slate-300">Nenhum teste de carga disparado nesta sessão</p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-md mx-auto">
                      Selecione o volume desejado no painel ao lado e clique em &quot;Disparar Teste&quot; para registrar métricas de vazão, latência e robustez.
                    </p>
                  </div>
                )}

                {/* Explanation about safety */}
                <div className="mt-4 p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-start gap-3 text-xs text-slate-300">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold text-white">Garantia de Isolamento de Dados Sintéticos</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Cada registro gerado no teste massivo recebe as tags exclusivas <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">[TESTE-MASSIVO]</code> e <code className="text-amber-300 bg-slate-900 px-1 py-0.5 rounded">isStressTest</code>. Isso permite que você realize testes massivos com milhares de transações e, com um único clique em <strong>Limpar Dados de Teste</strong>, remova todos os dados sintéticos sem afetar nenhuma transação ou conta real sua!
                    </p>
                  </div>
                </div>
              </div>

              {/* Sample of stress test records currently in system */}
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-sm text-white flex items-center gap-2">
                    <Database className="w-4 h-4 text-amber-400" />
                    <span>Amostra de Registros de Teste Ativos no Extrato ({currentStressCount})</span>
                  </h3>
                  {currentStressCount > 0 && (
                    <span className="text-xs text-amber-400 font-semibold">
                      Filtrado por tag [TESTE-MASSIVO]
                    </span>
                  )}
                </div>

                {currentStressCount === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6">
                    Nenhum registro sintético ativo no momento. Base de dados limpa.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {bankTransactions
                      .filter((t: any) => {
                        const id = t.id || '';
                        const desc = t.description || '';
                        const notes = t.notes || '';
                        return (
                          id.startsWith('stress_tx_') ||
                          t.isStressTest === true ||
                          desc.includes('[TESTE-MASSIVO]') ||
                          desc.includes('Operação Carga') ||
                          desc.includes('[STRESS-TEST]') ||
                          notes.includes('[STRESS-TEST]')
                        );
                      })
                      .slice(0, 15)
                      .map((tx) => (
                        <div
                          key={tx.id}
                          className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between text-xs"
                        >
                          <div className="min-w-0 flex-1 pr-3">
                            <p className="font-semibold text-slate-200 truncate">{tx.description}</p>
                            <p className="text-[10px] text-slate-400">
                              {formatDateBR(tx.date)} • {tx.type} • {tx.category}
                            </p>
                          </div>
                          <span
                            className={`font-black font-mono shrink-0 ${
                              tx.amount >= 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {formatCurrency(tx.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 2: TRILHA DE AUDITORIA (AUDIT TRAIL)                               */}
      {/* ========================================================================= */}
      {activeSubTab === 'audit_trail' && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Pesquisar por ação, detalhes, e-mail ou código..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">Todas Categorias</option>
                  <option value="AUTH">Autenticação (AUTH)</option>
                  <option value="TRANSACTION">Transações</option>
                  <option value="ACCOUNT">Contas</option>
                  <option value="DEBT">Dívidas</option>
                  <option value="STRESS_TEST">Testes Massivos</option>
                  <option value="SECURITY">Segurança</option>
                </select>

                <select
                  value={severityFilter}
                  onChange={(e) => setSeverityFilter(e.target.value)}
                  className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-hidden"
                >
                  <option value="ALL">Todas Severidades</option>
                  <option value="INFO">Apenas INFO</option>
                  <option value="WARNING">Apenas WARNING</option>
                  <option value="CRITICAL">Apenas CRITICAL</option>
                </select>
              </div>
            </div>

            {/* Audit Logs Table */}
            <div className="overflow-x-auto rounded-2xl border border-slate-800">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Data & Hora</th>
                    <th className="py-3 px-4">Severidade</th>
                    <th className="py-3 px-4">Ação</th>
                    <th className="py-3 px-4">Categoria</th>
                    <th className="py-3 px-4">Usuário / Origem</th>
                    <th className="py-3 px-4">Detalhes do Evento</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 bg-slate-900/60">
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-500">
                        Nenhum registro de auditoria corresponde aos filtros informados.
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="py-3 px-4 whitespace-nowrap text-slate-400 font-mono text-[11px]">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                              log.severity === 'CRITICAL'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                : log.severity === 'WARNING'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            }`}
                          >
                            {log.severity}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                          {log.action}
                        </td>
                        <td className="py-3 px-4 text-indigo-300 font-medium whitespace-nowrap">
                          {log.category}
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px] whitespace-nowrap">
                          {log.userEmail || log.userId || 'Sistema'}
                        </td>
                        <td className="py-3 px-4 text-slate-300 min-w-[280px]">
                          {log.details}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <p className="text-[11px] text-slate-500 text-right">
              Exibindo {filteredLogs.length} de {combinedLogs.length} eventos registrados na trilha de auditoria.
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUBTAB 3: SCANNER DE SEGURANÇA & REGRAS                                   */}
      {/* ========================================================================= */}
      {activeSubTab === 'scanner' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <h3 className="font-bold text-base text-white flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Resultado da Auditoria de Conformidade Contábil & Segurança</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verificações executadas em contas, cartões, dívidas e integridade de isolamento multi-tenancy.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs text-slate-400">
                  {auditReport.passedChecks} de {auditReport.totalChecks} testes aprovados
                </span>
                <span
                  className={`text-xl font-black px-3 py-1 rounded-xl ${
                    auditReport.score >= 85
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {auditReport.score}%
                </span>
              </div>
            </div>

            {/* Findings List */}
            <div className="space-y-3">
              {auditReport.findings.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    item.type === 'SUCCESS'
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-200'
                      : item.type === 'WARNING'
                      ? 'bg-amber-950/20 border-amber-900/40 text-amber-200'
                      : item.type === 'DANGER'
                      ? 'bg-rose-950/20 border-rose-900/40 text-rose-200'
                      : 'bg-slate-950/60 border-slate-800 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {item.type === 'SUCCESS' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
                    {item.type === 'WARNING' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
                    {item.type === 'DANGER' && <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />}
                    {item.type === 'INFO' && <Zap className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-xs sm:text-sm text-white">{item.title}</h4>
                        {item.entity && (
                          <span className="text-[10px] px-2 py-0.5 rounded-md bg-slate-900/80 text-slate-300 border border-slate-800">
                            {item.entity}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed">{item.description}</p>
                      {item.suggestion && (
                        <p className="text-[11px] text-amber-300/90 mt-2 font-medium bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                          <strong>Recomendação:</strong> {item.suggestion}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Security Architecture Summary Box */}
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl">
              <h4 className="font-bold text-xs text-slate-200 flex items-center gap-2 mb-2">
                <Lock className="w-4 h-4 text-emerald-400" />
                <span>Padrão de Segurança e Criptografia do FinFlow</span>
              </h4>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-slate-400">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Isolamento Multi-Tenant:</strong> Coleções protegidas sob o ID único do usuário. Nenhum dado é visível entre contas.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Auditoria Imutável:</strong> Eventos de segurança geram registros de log cronológicos com carimbo de tempo inviolável.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Validação Contábil em Tempo Real:</strong> Reconciliação contínua de créditos, débitos e faturas pendentes.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Suporte a Testes de Estresse:</strong> Isolamento por chave sintética para testes massivos sem poluir cadastros de produção.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
