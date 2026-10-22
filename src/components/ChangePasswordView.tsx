import React, { useState } from 'react';
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  ShieldCheck,
  Mail,
  Sparkles,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChangePasswordViewProps {
  onBackToDashboard: () => void;
}

export const ChangePasswordView: React.FC<ChangePasswordViewProps> = ({ onBackToDashboard }) => {
  const { user, updateUserPassword, sendPasswordReset } = useAuth();

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSendingResetEmail, setIsSendingResetEmail] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Password strength checks
  const hasMinLength = newPassword.length >= 6;
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!hasMinLength) {
      setErrorMessage('A nova senha deve possuir no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('As senhas digitadas não coincidem. Por favor, verifique.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserPassword(newPassword);
      setSuccessMessage('Senha atualizada com sucesso no Firebase!');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      if (err.code === 'auth/requires-recent-login') {
        setErrorMessage(
          'Por motivos de segurança do Firebase, a alteração direta de senha requer login recente. Você pode clicar no botão abaixo para receber um link de redefinição no seu e-mail ou fazer logout e login novamente.'
        );
      } else if (err.code === 'auth/weak-password') {
        setErrorMessage('Senha muito fraca. Escolha uma senha mais segura.');
      } else {
        setErrorMessage(err.message || 'Falha ao atualizar senha. Tente novamente.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendResetEmail = async () => {
    if (!user?.email) {
      setErrorMessage('Nenhum endereço de e-mail associado a esta conta.');
      return;
    }

    setIsSendingResetEmail(true);
    setErrorMessage(null);
    setSuccessMessage(null);
    try {
      await sendPasswordReset(user.email);
      setSuccessMessage(
        `Enviamos um link oficial de redefinição para o e-mail: ${user.email}. Verifique sua caixa de entrada e spam!`
      );
    } catch (err: any) {
      console.error('Erro ao enviar e-mail de redefinição:', err);
      setErrorMessage(err.message || 'Falha ao enviar e-mail de redefinição.');
    } finally {
      setIsSendingResetEmail(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      {/* Top Breadcrumb & Return Button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onBackToDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 transition-all cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Dashboard</span>
        </button>

        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Segurança da Conta</span>
        </span>
      </div>

      {/* Main Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl">
        {/* Title Header */}
        <div className="flex items-start gap-4 pb-6 border-b border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/30">
            <KeyRound className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Alterar Senha de Acesso
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Atualize sua senha do FinFlow para manter sua conta e lançamentos protegidos na Nuvem.
            </p>
          </div>
        </div>

        {/* Current User Info Banner */}
        <div className="mt-6 p-4 bg-slate-950/70 border border-slate-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-400 font-medium">Conta conectada:</span>
            <p className="text-white font-bold text-sm mt-0.5">{user?.email || 'Usuário Local'}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold border border-indigo-500/30">
              {user?.displayName || 'FinFlow User'}
            </span>
          </div>
        </div>

        {/* Feedback Messages */}
        {successMessage && (
          <div className="mt-6 p-4 bg-emerald-950/60 border border-emerald-600/60 rounded-2xl flex items-start gap-3 text-emerald-200 text-xs sm:text-sm animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-400" />
            <div className="leading-relaxed">
              <strong className="block font-bold text-white mb-0.5">Sucesso!</strong>
              <span>{successMessage}</span>
            </div>
          </div>
        )}

        {errorMessage && (
          <div className="mt-6 p-4 bg-rose-950/60 border border-rose-600/60 rounded-2xl flex items-start gap-3 text-rose-200 text-xs sm:text-sm animate-in fade-in">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-rose-400" />
            <div className="leading-relaxed">
              <strong className="block font-bold text-white mb-0.5">Aviso</strong>
              <span>{errorMessage}</span>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-new-password"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Digite a nova senha (mínimo 6 caracteres)"
                className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showNewPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirmar Nova Senha */}
          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
              Confirmar Nova Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                <Lock className="w-4 h-4" />
              </div>
              <input
                id="input-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repita a nova senha"
                className="w-full pl-10 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all font-medium"
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 cursor-pointer"
                title={showConfirmPassword ? 'Ocultar senha' : 'Exibir senha'}
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Password Validation Indicators */}
          <div className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-2xl space-y-2">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
              Requisitos de Segurança:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    hasMinLength
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ✓
                </span>
                <span className={hasMinLength ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  Pelo menos 6 caracteres
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    hasNumber
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ✓
                </span>
                <span className={hasNumber ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  Contém números
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    hasSpecial
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ✓
                </span>
                <span className={hasSpecial ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  Símbolo especial (!@#$...)
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span
                  className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-black ${
                    passwordsMatch
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  ✓
                </span>
                <span className={passwordsMatch ? 'text-emerald-300 font-semibold' : 'text-slate-400'}>
                  Senhas são idênticas
                </span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <button
              id="btn-save-new-password"
              type="submit"
              disabled={isSubmitting || !hasMinLength || !passwordsMatch}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 active:from-indigo-700 active:to-purple-700 text-white font-extrabold rounded-xl text-sm transition-all shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01]"
            >
              <KeyRound className="w-4 h-4" />
              <span>{isSubmitting ? 'Atualizando Senha...' : 'Salvar Nova Senha'}</span>
            </button>
          </div>
        </form>

        {/* Alternative: Send Password Reset Link to Email */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950/80 p-4 rounded-2xl border border-slate-800/80">
            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-white">Prefere redefinir pelo seu e-mail?</p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Enviaremos o link oficial do Firebase para redefinição segura na sua caixa postal.
                </p>
              </div>
            </div>
            <button
              id="btn-send-reset-email-inpage"
              type="button"
              onClick={handleSendResetEmail}
              disabled={isSendingResetEmail || !user?.email}
              className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-indigo-300 hover:text-white rounded-xl text-xs font-bold border border-slate-700/80 transition-all shrink-0 cursor-pointer disabled:opacity-50"
            >
              {isSendingResetEmail ? 'Enviando Link...' : 'Enviar Link por E-mail'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
