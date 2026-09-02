import React, { useState, useRef, useEffect } from 'react';
import { ActiveTab } from '../types';
import {
  LayoutDashboard,
  Building2,
  Landmark,
  CreditCard,
  TrendingUp,
  FileText,
  ShieldCheck,
  Sparkles,
  RotateCcw,
  Wallet,
  CalendarClock,
  Settings,
  Tag,
  ShieldAlert,
  ChevronDown,
  Check,
  BellRing,
  Cloud,
  CloudCheck,
  User as UserIcon,
  LogOut,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenSmartReader: () => void;
  onResetData: () => void;
  onOpenSyncModal: () => void;
  netWorth: number;
  urgentBillsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  onOpenSmartReader,
  onResetData,
  onOpenSyncModal,
  netWorth,
  urgentBillsCount = 0,
}) => {
  const { user, isCloudSynced, isAdmin, logout } = useAuth();
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowSettingsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: {
    id: ActiveTab;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: number;
  }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'accounts', label: 'Contas Bancárias', icon: Building2 },
    { id: 'cards', label: 'Cartões de Crédito', icon: CreditCard },
    { id: 'debts', label: 'Dívidas & Empréstimos', icon: Landmark },
    { id: 'future-payments', label: 'Futuras Transações', icon: CalendarClock },
    { id: 'investments', label: 'Investimentos', icon: TrendingUp },
    { id: 'notifications', label: 'Lembretes & Alertas', icon: BellRing, badge: urgentBillsCount },
    { id: 'smart-reader', label: 'Leitor Inteligente', icon: FileText },
    { id: 'open-finance', label: 'Open Finance', icon: ShieldCheck },
  ];

  // Include Categorias in nav if active or for admin quick access
  if (isAdmin) {
    navItems.push({ id: 'categories', label: 'Categorias', icon: Tag });
  }

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-emerald-400 p-0.5 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <div className="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">
                  FinFlow
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded">
                  Open Finance
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Gestão Bancária, Cartões & Investimentos
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Multi-User & Cloud Sync Status Button */}
            <button
              id="btn-navbar-cloud-sync"
              onClick={onOpenSyncModal}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl text-xs font-semibold border transition-all ${
                isCloudSynced
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60'
                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
              }`}
              title={
                isCloudSynced
                  ? `Sincronizado na Nuvem: ${user?.email}`
                  : 'Modo Local. Clique para conectar sua conta Google e salvar na Nuvem Firestore'
              }
            >
              {isCloudSynced ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  {user?.photoURL ? (
                    <img
                      referrerPolicy="no-referrer"
                      src={user.photoURL}
                      alt="User"
                      className="w-4 h-4 rounded-full object-cover hidden sm:inline"
                    />
                  ) : (
                    <CloudCheck className="w-3.5 h-3.5 text-emerald-400" />
                  )}
                  <span className="hidden md:inline max-w-[100px] truncate">
                    {user?.displayName?.split(' ')[0] || 'Nuvem'}
                  </span>
                  <span className="md:hidden">Nuvem</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">Conectar Nuvem</span>
                  <span className="sm:hidden">Nuvem</span>
                </>
              )}
            </button>

            {/* Smart Import Button */}
            <button
              onClick={onOpenSmartReader}
              className="inline-flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-md shadow-indigo-900/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
              <span className="hidden xs:inline">Colar Extrato (IA)</span>
              <span className="xs:hidden">Colar</span>
            </button>

            {/* Configurações (Engrenagem) Button for Admin */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setShowSettingsMenu(!showSettingsMenu)}
                className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border ${
                  activeTab === 'categories' || activeTab === 'settings' || showSettingsMenu
                    ? 'bg-indigo-600 text-white border-indigo-500 shadow-md'
                    : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 border-slate-700'
                }`}
                title="Configurações e Painel do Administrador"
              >
                <Settings className={`w-4 h-4 ${showSettingsMenu ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Configurações</span>
                {isAdmin && (
                  <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-xs shadow-emerald-400" />
                )}
                <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>

              {/* Submenu Dropdown */}
              {showSettingsMenu && (
                <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-2xl shadow-2xl p-2 z-50 text-slate-100 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-2.5 border-b border-slate-700/80 mb-1 bg-slate-900/40 rounded-xl">
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">
                          {user?.displayName || 'Usuário FinFlow'}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {user?.email || 'Nuvem Conectada'}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 ${
                          isAdmin
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40'
                        }`}
                      >
                        {isAdmin ? 'ADMIN' : 'USUÁRIO'}
                      </span>
                    </div>
                  </div>

                  {/* Submenu Items */}
                  <div className="space-y-1">
                    <button
                      onClick={() => {
                        setActiveTab('notifications');
                        setShowSettingsMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        activeTab === 'notifications' || activeTab === 'settings'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-slate-700/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <BellRing className="w-4 h-4 text-amber-400" />
                        <span>Lembretes & Webhooks</span>
                      </div>
                      {urgentBillsCount > 0 ? (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black bg-red-500 text-white">
                          {urgentBillsCount}
                        </span>
                      ) : (
                        (activeTab === 'notifications' || activeTab === 'settings') && (
                          <Check className="w-4 h-4 text-white" />
                        )
                      )}
                    </button>

                    <button
                      onClick={() => {
                        setActiveTab('categories');
                        setShowSettingsMenu(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors ${
                        activeTab === 'categories'
                          ? 'bg-indigo-600 text-white font-bold'
                          : 'hover:bg-slate-700/80 text-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-4 h-4 text-indigo-400" />
                        <span>Categorias</span>
                      </div>
                      {activeTab === 'categories' && <Check className="w-4 h-4 text-white" />}
                    </button>

                    {/* Logout Option */}
                    <div className="pt-1.5 border-t border-slate-700/60 mt-1">
                      <button
                        id="btn-navbar-logout"
                        onClick={async () => {
                          setShowSettingsMenu(false);
                          await logout();
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400" />
                        <span>Sair da Conta (Logout)</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Reset Data Button */}
            <button
              onClick={onResetData}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-800 rounded-xl transition-colors border border-slate-700/60"
              title="Restaurar Dados Iniciais de Exemplo"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1 pb-2 border-t border-slate-800/80">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap relative ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`ml-0.5 px-1.5 py-0.2 rounded-full text-[10px] font-black leading-tight ${
                      isActive
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-red-500 text-white animate-pulse'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
