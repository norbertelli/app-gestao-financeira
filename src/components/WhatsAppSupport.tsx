import React, { useState } from 'react';
import { MessageCircle, ExternalLink, Copy, Check, Headphones, Phone, Clock } from 'lucide-react';

export const SUPPORT_PHONE_DISPLAY = '(11) 93205-873';
export const SUPPORT_PHONE_RAW = '551193205873';
export const DEFAULT_WHATSAPP_MESSAGE = 'Olá! Preciso de ajuda com o FinFlow Gestão Financeira.';

export const getWhatsAppUrl = (message: string = DEFAULT_WHATSAPP_MESSAGE) => {
  return `https://wa.me/${SUPPORT_PHONE_RAW}?text=${encodeURIComponent(message)}`;
};

interface WhatsAppButtonProps {
  variant?: 'banner' | 'card' | 'navbar' | 'floating';
  label?: string;
  className?: string;
}

/**
 * WhatsApp SVG icon component
 */
export const WhatsAppIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
  <svg
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
    aria-hidden="true"
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.456 5.711 1.457h.004c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.411z" />
  </svg>
);

/**
 * Standard button component for WhatsApp Support
 */
export const WhatsAppSupportButton: React.FC<WhatsAppButtonProps> = ({
  variant = 'banner',
  label = 'Suporte & Ajuda',
  className = '',
}) => {
  const [copied, setCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(SUPPORT_PHONE_DISPLAY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const openWhatsAppDirectly = () => {
    window.open(getWhatsAppUrl(), '_blank', 'noopener,noreferrer');
  };

  if (variant === 'banner') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-2.5 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/40 border border-emerald-400/40 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${className}`}
          title={`Suporte ou Ajuda via WhatsApp: ${SUPPORT_PHONE_DISPLAY}`}
        >
          <div className="w-6 h-6 rounded-lg bg-emerald-700/60 flex items-center justify-center shrink-0">
            <WhatsAppIcon className="w-4 h-4 text-emerald-100" />
          </div>
          <div className="text-left leading-tight">
            <div className="flex items-center gap-1.5">
              <span>{label}</span>
              <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse" />
            </div>
            <span className="text-[10px] text-emerald-100/90 font-medium block">
              {SUPPORT_PHONE_DISPLAY}
            </span>
          </div>
        </button>

        {showModal && (
          <SupportDetailsModal
            onClose={() => setShowModal(false)}
            onCopyPhone={handleCopyPhone}
            copied={copied}
            onOpenWhatsApp={openWhatsAppDirectly}
          />
        )}
      </>
    );
  }

  if (variant === 'card') {
    return (
      <div className={`bg-gradient-to-br from-emerald-950/50 via-slate-900 to-slate-900 border border-emerald-500/30 rounded-2xl p-5 shadow-xl text-white relative overflow-hidden ${className}`}>
        <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
          <WhatsAppIcon className="w-32 h-32 text-emerald-400" />
        </div>
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-inner">
              <WhatsAppIcon className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
                Atendimento Rápido
              </span>
              <h4 className="text-base font-extrabold text-white">Suporte & Ajuda WhatsApp</h4>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Dúvidas sobre o funcionamento, importação de extratos ou suporte técnico? Fale diretamente pelo WhatsApp.
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-2.5">
            <button
              onClick={openWhatsAppDirectly}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs shadow-md shadow-emerald-950/50 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-slate-950" />
              <span>Chamar no WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            <button
              onClick={handleCopyPhone}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Copiar número de telefone"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-bold">Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>{SUPPORT_PHONE_DISPLAY}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Floating variant default
  return null;
};

/**
 * Floating WhatsApp Widget fixed to bottom-right of the screen
 */
export const FloatingWhatsAppSupport: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyPhone = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(SUPPORT_PHONE_DISPLAY);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenWhatsApp = () => {
    window.open(getWhatsAppUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end">
      {/* Expanded Popover */}
      {isOpen && (
        <div className="mb-3 w-80 bg-slate-900 border border-emerald-500/40 rounded-2xl shadow-2xl p-4 text-slate-100 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <WhatsAppIcon className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-white">Suporte & Ajuda</h4>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>WhatsApp Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="py-3 space-y-2">
            <p className="text-xs text-slate-300 leading-relaxed">
              Olá! Precisa de tirar dúvidas sobre o app, assinaturas ou recursos? Fale diretamente conosco pelo WhatsApp.
            </p>

            <div className="bg-slate-950/60 rounded-xl p-2.5 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-semibold">Telefone de Atendimento</p>
                <p className="text-xs font-bold text-white tracking-wide">{SUPPORT_PHONE_DISPLAY}</p>
              </div>
              <button
                onClick={handleCopyPhone}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-emerald-400 transition-colors text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                title="Copiar telefone"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={handleOpenWhatsApp}
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold rounded-xl text-xs sm:text-sm shadow-lg shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
            >
              <WhatsAppIcon className="w-4 h-4 text-slate-950" />
              <span>Abrir Conversa no WhatsApp</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button */}
      <button
        id="btn-whatsapp-floating"
        onClick={() => setIsOpen(!isOpen)}
        className="group relative inline-flex items-center gap-2.5 px-4 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-full shadow-2xl shadow-emerald-950/60 border border-emerald-400/40 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        title={`Fale Conosco via WhatsApp: ${SUPPORT_PHONE_DISPLAY}`}
      >
        <span className="relative flex h-3 w-3">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-300"></span>
        </span>
        <WhatsAppIcon className="w-5 h-5 text-white" />
        <span className="text-xs sm:text-sm font-extrabold tracking-tight hidden sm:inline">
          Suporte / Ajuda
        </span>
        <span className="text-[11px] font-bold bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-400/30 text-emerald-200 hidden md:inline">
          (11) 93205-873
        </span>
      </button>
    </div>
  );
};

/**
 * Detailed Support Modal
 */
const SupportDetailsModal: React.FC<{
  onClose: () => void;
  onCopyPhone: (e: React.MouseEvent) => void;
  copied: boolean;
  onOpenWhatsApp: () => void;
}> = ({ onClose, onCopyPhone, copied, onOpenWhatsApp }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-emerald-500/40 rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl text-slate-100 relative space-y-5">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 text-sm cursor-pointer"
        >
          ✕
        </button>

        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-lg shadow-emerald-900/40">
            <WhatsAppIcon className="w-7 h-7 text-white" />
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
              Canal Oficial
            </span>
            <h3 className="text-lg font-black text-white mt-1">Suporte ou Ajuda</h3>
            <p className="text-xs text-slate-400">Atendimento personalizado pelo WhatsApp</p>
          </div>
        </div>

        <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-medium">Número de Telefone:</span>
            <span className="text-sm font-extrabold text-white tracking-wide">
              {SUPPORT_PHONE_DISPLAY}
            </span>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-800/80">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" />
              <span>Resposta Rápida</span>
            </div>
            <span className="text-emerald-400 font-semibold">Atendimento Direto</span>
          </div>
        </div>

        <div className="space-y-2 pt-1">
          <button
            type="button"
            onClick={onOpenWhatsApp}
            className="w-full inline-flex items-center justify-center gap-2.5 py-3.5 px-4 bg-emerald-500 hover:bg-emerald-400 active:bg-emerald-600 text-slate-950 font-black rounded-xl text-sm shadow-xl shadow-emerald-950/40 transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
          >
            <WhatsAppIcon className="w-5 h-5 text-slate-950" />
            <span>Iniciar Conversa no WhatsApp</span>
            <ExternalLink className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onCopyPhone}
            className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400">Número Copiado para Área de Transferência!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copiar Número ({SUPPORT_PHONE_DISPLAY})</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
