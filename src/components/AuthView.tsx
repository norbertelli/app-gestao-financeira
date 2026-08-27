import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Mail,
  UserCheck,
  KeyRound,
  ArrowRight,
  Sparkles,
  CloudCheck,
  CheckCircle2,
  AlertCircle,
  Laptop,
  Smartphone,
  Shield,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const AuthView: React.FC = () => {
  const { loginWithGoogle, loginWithEmail, registerWithEmail, loginAsAdmin, loading } = useAuth();

  const [authMode, setAuthMode] = useState<'login' | 'register' | 'admin'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [adminUser, setAdminUser] = useState('admin');
  const [adminPassword, setAdminPassword] = useState('admin');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleSignIn = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err: any) {
      console.error('Erro no login Google:', err);
      setErrorMessage(err.message || 'Falha ao conectar com o Google. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      if (authMode === 'login') {
        if (!email || !password) {
          setErrorMessage('Por favor, informe seu e-mail e senha.');
          setIsSubmitting(false);
          return;
        }
        await loginWithEmail(email, password);
      } else if (authMode === 'register') {
        if (!email || !password) {
          setErrorMessage('Por favor, informe seu e-mail e crie uma senha (mínimo 6 caracteres).');
          setIsSubmitting(false);
          return;
        }
        await registerWithEmail(email, password, displayName || 'Usuário FinFlow');
      } else if (authMode === 'admin') {
        if (adminUser.toLowerCase() === 'admin' && adminPassword.toLowerCase() === 'admin') {
          await loginAsAdmin(adminUser, adminPassword);
        } else {
          setErrorMessage('Credenciais de Administrador inválidas. Use usuário "admin" e senha "admin".');
        }
      }
    } catch (err: any) {
      console.error('Erro na autenticação:', err);
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        setErrorMessage('E-mail ou senha incorretos. Se não tiver conta, clique em "Criar Conta".');
      } else if (err.code === 'auth/email-already-in-use') {
        setErrorMessage('Este e-mail já está cadastrado. Por favor, faça login.');
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('A senha deve ter pelo menos 6 caracteres.');
      } else {
        setErrorMessage(err.message || 'Falha na autenticação. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Decorative Gradient Blobs */}
      <div className="absolute top-0 -left-4 w-72 sm:w-96 h-72 sm:h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-4 w-72 sm:w-96 h-72 sm:h-96 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        {/* Brand Header */}
        <div className="flex items-center justify-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-tr from-indigo-600 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 text-white">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-1.5">
              FinFlow <span className="text-emerald-400 text-xs px-2 py-0.5 bg-emerald-950/80 rounded-md border border-emerald-500/30">Nuvem</span>
            </h1>
            <p className="text-xs text-slate-400 font-medium">Gestão Financeira & Multi-Dispositivos</p>
          </div>
        </div>

        <h2 className="text-center text-xl font-bold text-slate-200 mt-2">
          {authMode === 'login' && 'Acesse sua conta na Nuvem'}
          {authMode === 'register' && 'Crie sua conta na Nuvem'}
          {authMode === 'admin' && 'Acesso Painel Administrador'}
        </h2>
        <p className="text-center text-xs text-slate-400 mt-1">
          Seus dados e cadastros sincronizados em tempo real no Firebase
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 relative z-10">
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl">
          {/* Mode Selector Tabs */}
          <div className="grid grid-cols-3 gap-1 bg-slate-950/80 p-1 rounded-2xl mb-6 border border-slate-800">
            <button
              id="tab-auth-login"
              type="button"
              onClick={() => {
                setAuthMode('login');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                authMode === 'login'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Entrar
            </button>
            <button
              id="tab-auth-register"
              type="button"
              onClick={() => {
                setAuthMode('register');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all ${
                authMode === 'register'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Criar Conta
            </button>
            <button
              id="tab-auth-admin"
              type="button"
              onClick={() => {
                setAuthMode('admin');
                setErrorMessage(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${
                authMode === 'admin'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Shield className="w-3 h-3" />
              <span>Admin</span>
            </button>
          </div>

          {/* Quick Google Sign In */}
          {authMode !== 'admin' && (
            <div className="mb-6">
              <button
                id="btn-login-google"
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting || loading}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 rounded-2xl font-bold text-sm shadow-md transition-all hover:scale-[1.01] cursor-pointer disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.35 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 10.04 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.35 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continuar com Google</span>
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-slate-900 px-3 text-slate-500 font-medium">
                    ou use com e-mail e senha
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-4 p-3 bg-rose-950/60 border border-rose-800/80 rounded-2xl flex items-start gap-2.5 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {authMode === 'admin' ? (
              <>
                <div className="p-3.5 bg-emerald-950/40 border border-emerald-600/30 rounded-2xl text-xs text-emerald-300 mb-2">
                  <p className="font-semibold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    Modo Administrador do Sistema
                  </p>
                  <p className="text-[11px] text-emerald-200/80 leading-relaxed">
                    Você pode acessar com o usuário <strong>admin</strong> e senha <strong>admin</strong> para gerenciar a base de dados central com permissões master.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Usuário Admin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <UserCheck className="w-4 h-4" />
                    </div>
                    <input
                      id="input-admin-user"
                      type="text"
                      value={adminUser}
                      onChange={(e) => setAdminUser(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      placeholder="admin"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha Admin
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      id="input-admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                      placeholder="admin"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-submit-admin"
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full mt-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isSubmitting ? 'Autenticando...' : 'Entrar como Administrador'}</span>
                </button>
              </>
            ) : (
              <>
                {authMode === 'register' && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                      Seu Nome Completo
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                        <UserCheck className="w-4 h-4" />
                      </div>
                      <input
                        id="input-register-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                        placeholder="Ex: Norberto Bertelli"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    E-mail
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      id="input-auth-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="seu.email@exemplo.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Senha
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                      <Lock className="w-4 h-4" />
                    </div>
                    <input
                      id="input-auth-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <button
                  id="btn-submit-auth"
                  type="submit"
                  disabled={isSubmitting || loading}
                  className="w-full mt-3 py-3 px-4 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white rounded-xl font-bold text-sm transition-all shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <span>
                    {isSubmitting
                      ? 'Processando...'
                      : authMode === 'login'
                      ? 'Entrar na Conta'
                      : 'Criar Minha Conta'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </form>
        </div>

        {/* Feature Highlights */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <CloudCheck className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-200">100% na Nuvem</p>
            <p className="text-[10px] text-slate-500">Firebase Firestore</p>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <Smartphone className="w-5 h-5 text-indigo-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-200">Multi-Aparelhos</p>
            <p className="text-[10px] text-slate-500">Sincronia instantânea</p>
          </div>

          <div className="p-3 bg-slate-900/50 border border-slate-800/80 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-amber-400 mx-auto mb-1" />
            <p className="text-[11px] font-bold text-slate-200">Segurança Total</p>
            <p className="text-[10px] text-slate-500">Criptografia de ponta</p>
          </div>
        </div>
      </div>
    </div>
  );
};
