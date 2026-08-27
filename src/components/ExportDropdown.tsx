import React, { useState, useRef, useEffect } from 'react';
import { Download, FileText, FileSpreadsheet, ChevronDown, Check, Loader2 } from 'lucide-react';

interface ExportDropdownProps {
  onExportPDF: () => void | Promise<void>;
  onExportXLSX: () => void | Promise<void>;
  onExportCSV: () => void | Promise<void>;
  label?: string;
  className?: string;
  totalRecordsCount?: number;
}

export const ExportDropdown: React.FC<ExportDropdownProps> = ({
  onExportPDF,
  onExportXLSX,
  onExportCSV,
  label = 'Exportar Relatório',
  className = '',
  totalRecordsCount,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loadingType, setLoadingType] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAction = async (type: 'pdf' | 'xlsx' | 'csv') => {
    try {
      setLoadingType(type);
      if (type === 'pdf') await onExportPDF();
      else if (type === 'xlsx') await onExportXLSX();
      else if (type === 'csv') await onExportCSV();

      setSuccessMsg(type.toUpperCase());
      setTimeout(() => {
        setSuccessMsg(null);
        setIsOpen(false);
      }, 1200);
    } catch (err) {
      console.error('Error during export:', err);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className={`relative inline-block text-left ${className}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-3.5 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 rounded-xl text-xs font-bold shadow-xs hover:border-slate-400 transition-all"
        title="Exportar dados filtrados e consolidados em PDF ou Planilha Excel"
      >
        <Download className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
        <span>{label}</span>
        {totalRecordsCount !== undefined && (
          <span className="px-1.5 py-0.2 rounded-md bg-indigo-50 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 text-[10px] font-extrabold border border-indigo-200 dark:border-indigo-800">
            {totalRecordsCount}
          </span>
        )}
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 origin-top-right rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 p-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
              Formatos de Exportação
            </span>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Inclui filtros ativos, totais consolidados e lançamentos.
            </p>
          </div>

          <div className="space-y-1">
            {/* PDF Option */}
            <button
              onClick={() => handleAction('pdf')}
              disabled={loadingType !== null}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-rose-50 dark:hover:bg-rose-950/30 text-slate-800 dark:text-slate-200 hover:text-rose-600 dark:hover:text-rose-400 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold">Relatório PDF Formatado</span>
                  <span className="text-[10px] text-slate-400 font-normal">Layout A4 profissional com KPIs</span>
                </div>
              </div>
              {loadingType === 'pdf' ? (
                <Loader2 className="w-4 h-4 text-rose-500 animate-spin" />
              ) : successMsg === 'PDF' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : null}
            </button>

            {/* Excel XLSX Option */}
            <button
              onClick={() => handleAction('xlsx')}
              disabled={loadingType !== null}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 text-slate-800 dark:text-slate-200 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold">Planilha Excel (.xlsx)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Colunas formatadas para análise</span>
                </div>
              </div>
              {loadingType === 'xlsx' ? (
                <Loader2 className="w-4 h-4 text-emerald-500 animate-spin" />
              ) : successMsg === 'XLSX' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : null}
            </button>

            {/* CSV Option */}
            <button
              onClick={() => handleAction('csv')}
              disabled={loadingType !== null}
              className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold hover:bg-indigo-50 dark:hover:bg-indigo-950/30 text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div>
                  <span className="block font-bold">Tabela CSV (.csv)</span>
                  <span className="text-[10px] text-slate-400 font-normal">Compatível com qualquer sistema</span>
                </div>
              </div>
              {loadingType === 'csv' ? (
                <Loader2 className="w-4 h-4 text-indigo-500 animate-spin" />
              ) : successMsg === 'CSV' ? (
                <Check className="w-4 h-4 text-emerald-500" />
              ) : null}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
