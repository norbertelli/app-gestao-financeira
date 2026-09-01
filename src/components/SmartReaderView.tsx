import React, { useState, useEffect, useRef } from 'react';
import {
  BankAccount,
  CategoryItem,
  CreditCard,
  ParsedStatementItem,
  TransactionCategory,
} from '../types';
import { INITIAL_CATEGORIES } from '../data/initialData';
import {
  formatCurrency,
  formatDateBR,
  smartParseTextLocally,
} from '../utils/financeUtils';
import {
  Sparkles,
  FileText,
  Building2,
  CreditCard as CardIcon,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Edit3,
  ArrowRight,
  Clipboard,
  Zap,
  Upload,
  File,
} from 'lucide-react';

interface SmartReaderViewProps {
  accounts: BankAccount[];
  cards: CreditCard[];
  categories?: CategoryItem[];
  onBatchImportBankTransactions: (accountId: string, items: ParsedStatementItem[]) => void;
  onBatchImportCardTransactions: (cardId: string, items: ParsedStatementItem[]) => void;
}

export const SmartReaderView: React.FC<SmartReaderViewProps> = ({
  accounts,
  cards,
  categories = INITIAL_CATEGORIES,
  onBatchImportBankTransactions,
  onBatchImportCardTransactions,
}) => {
  const activeCategories = categories && categories.length > 0 ? categories : INITIAL_CATEGORIES;
  const [inputMode, setInputMode] = useState<'upload' | 'text'>('upload');
  const [rawText, setRawText] = useState('');
  const [targetType, setTargetType] = useState<'bank' | 'card'>('bank');
  const [selectedTargetId, setSelectedTargetId] = useState<string>(accounts[0]?.id || cards[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [parsedItems, setParsedItems] = useState<ParsedStatementItem[]>([]);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Prevent browser default drop behavior so PDFs do not open in browser tab
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    window.addEventListener('dragover', preventDefaults);
    window.addEventListener('drop', preventDefaults);

    return () => {
      window.removeEventListener('dragover', preventDefaults);
      window.removeEventListener('drop', preventDefaults);
    };
  }, []);

  // Sample templates to quickly test copypaste
  const sampleBankText = `01/08/2026 SALARIO EMPRESA BRASIL R$ 8.500,00 +
02/08/2026 PIX RECEBIDO JOAO SILVA R$ 150,00
03/08/2026 SUPERMERCADO PAO DE ACUCAR R$ 342,50 -
04/08/2026 UBER *TRIP SAO PAULO R$ 45,90 -
05/08/2026 ENEL ENERGIA ELETRICA R$ 180,00 -`;

  const sampleCardText = `02/08/2026 RESTAURANTE FOGO DE CHAO R$ 280,00
03/08/2026 DROGASIL PHARMA R$ 89,90
04/08/2026 DELL COMPUTADORES PARC 03/10 R$ 450,00
05/08/2026 NETFLIX ASSINATURA R$ 55,90`;

  // Helper to extract text from PDF using pdfjs-dist
  const extractPdfText = async (file: File): Promise<string> => {
    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(arrayBuffer) }).promise;
      let text = '';

      for (let i = 1; i <= Math.min(pdf.numPages, 10); i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        text += pageText + '\n';
      }

      return text;
    } catch (err) {
      console.warn('Erro na extração local de PDF com pdfjs:', err);
      return '';
    }
  };

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    setIsLoading(true);
    setSelectedFileName(file.name);
    setStatusMessage(`Lendo arquivo "${file.name}"...`);

    let extractedText = '';

    try {
      let base64Data = '';

      // Read file to Base64
      base64Data = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
          const res = reader.result as string;
          resolve(res.includes(',') ? res.split(',')[1] : res);
        };
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
      });

      // If PDF, extract text
      const lowerName = file.name.toLowerCase();
      if (lowerName.endsWith('.pdf') || file.type === 'application/pdf') {
        setStatusMessage('Extraindo texto do PDF...');
        extractedText = await extractPdfText(file);
      } else if (
        lowerName.endsWith('.ofx') ||
        lowerName.endsWith('.csv') ||
        lowerName.endsWith('.txt')
      ) {
        // Text file
        extractedText = await file.text();
      }

      if (extractedText) {
        setRawText(extractedText);
      }

      setStatusMessage('Analisando extrato com IA Gemini...');

      const textToParse = extractedText || rawText;
      const localItems = textToParse ? smartParseTextLocally(textToParse, targetType) : [];

      // Call API
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: extractedText,
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name,
          targetType,
        }),
      });

      const data = await response.json();

      let geminiItems: ParsedStatementItem[] = [];
      if (data.success && Array.isArray(data.transactions)) {
        geminiItems = data.transactions.map((t: any, idx: number) => ({
          id: `parsed_pdf_${Date.now()}_${idx}`,
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Lançamento',
          amount: typeof t.amount === 'number' ? Math.abs(t.amount) : 0,
          isExpense: Boolean(t.isExpense),
          category: (t.category as TransactionCategory) || 'Outros',
          type: t.type || 'Outros',
          currentInstallment: t.currentInstallment || 1,
          totalInstallments: t.totalInstallments || 1,
          invoiceMonth: t.invoiceMonth || new Date().toISOString().substring(0, 7),
        }));
      }

      // Pick whichever parser found MORE items
      const finalItems = geminiItems.length >= localItems.length && geminiItems.length > 0
        ? geminiItems
        : localItems;

      if (finalItems.length > 0) {
        setParsedItems(finalItems);
        setStatusMessage(`Sucesso! ${finalItems.length} lançamentos extraídos com sucesso do extrato.`);
      } else {
        setStatusMessage('Nenhum lançamento identificado. Tente copiar e colar o texto na aba ao lado.');
      }
    } catch (err: any) {
      console.error('Erro no processamento do PDF/Arquivo:', err);
      const fallbackText = extractedText || rawText;
      const localItems = fallbackText ? smartParseTextLocally(fallbackText, targetType) : [];
      if (localItems.length > 0) {
        setParsedItems(localItems);
        setStatusMessage(`Processado via leitor local: ${localItems.length} lançamentos extraídos.`);
      } else {
        setStatusMessage('Erro ao ler o arquivo. Você também pode copiar o texto do PDF e colar na aba "Copiar & Colar".');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleParseText = async () => {
    if (!rawText.trim()) {
      setStatusMessage('Cole o texto do extrato para poder analisar.');
      return;
    }

    setIsLoading(true);
    setStatusMessage('Analisando extrato com Leitor Inteligente (Gemini IA)...');

    const localItems = smartParseTextLocally(rawText, targetType);

    try {
      // Call server endpoint
      const response = await fetch('/api/parse-statement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText, targetType }),
      });

      const data = await response.json();

      let geminiItems: ParsedStatementItem[] = [];
      if (data.success && Array.isArray(data.transactions)) {
        geminiItems = data.transactions.map((t: any, idx: number) => ({
          id: `parsed_ai_${Date.now()}_${idx}`,
          date: t.date || new Date().toISOString().split('T')[0],
          description: t.description || 'Lançamento',
          amount: typeof t.amount === 'number' ? Math.abs(t.amount) : 0,
          isExpense: Boolean(t.isExpense),
          category: (t.category as TransactionCategory) || 'Outros',
          type: t.type || 'Outros',
          currentInstallment: t.currentInstallment || 1,
          totalInstallments: t.totalInstallments || 1,
          invoiceMonth: t.invoiceMonth || new Date().toISOString().substring(0, 7),
        }));
      }

      // Pick whichever parser found MORE items
      const finalItems = geminiItems.length >= localItems.length && geminiItems.length > 0
        ? geminiItems
        : localItems;

      if (finalItems.length > 0) {
        setParsedItems(finalItems);
        setStatusMessage(`Sucesso! ${finalItems.length} lançamentos identificados e organizados com sucesso.`);
      } else {
        setStatusMessage('Nenhum lançamento identificado. Verifique se o texto possui datas e valores.');
      }
    } catch (err) {
      console.error('Erro na análise, usando leitor inteligente local:', err);
      if (localItems.length > 0) {
        setParsedItems(localItems);
        setStatusMessage(`Leitor inteligente local ativado: ${localItems.length} lançamentos extraídos com sucesso!`);
      } else {
        setStatusMessage('Ocorreu um erro ao analisar o texto.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteParsedItem = (id: string) => {
    setParsedItems(parsedItems.filter((i) => i.id !== id));
  };

  const handleUpdateCategory = (id: string, newCat: TransactionCategory) => {
    setParsedItems(
      parsedItems.map((item) => (item.id === id ? { ...item, category: newCat } : item))
    );
  };

  const handleConfirmBatchImport = () => {
    if (parsedItems.length === 0) return;

    if (targetType === 'bank') {
      onBatchImportBankTransactions(selectedTargetId, parsedItems);
    } else {
      onBatchImportCardTransactions(selectedTargetId, parsedItems);
    }

    alert(`${parsedItems.length} lançamentos importados com sucesso em lote!`);
    setParsedItems([]);
    setRawText('');
    setSelectedFileName(null);
    setStatusMessage('Importação em lote concluída com sucesso!');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Banner */}
      <div className="bg-gradient-to-r from-indigo-950 via-purple-900 to-slate-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl border border-indigo-800/50">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-full text-xs font-semibold mb-3">
          <Zap className="w-3.5 h-3.5 text-amber-300" />
          <span>Leitor Inteligente com IA Gemini</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Importação Inteligente de Extratos e Faturas
        </h1>
        <p className="text-slate-300 text-sm mt-1 max-w-2xl">
          Selecione seu arquivo PDF de extrato/fatura ou cole o texto copiado do app do seu banco.
          A IA lê, categoriza e estrutura automaticamente os lançamentos para você revisar e importar.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Box (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              <span>1. Escolha a Forma de Entrada</span>
            </h2>
          </div>

          {/* Mode Selector Tabs */}
          <div className="flex rounded-xl bg-slate-100 dark:bg-slate-800 p-1 border border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === 'upload'
                  ? 'bg-white dark:bg-slate-900 text-purple-600 dark:text-purple-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Upload className="w-4 h-4" />
              <span>Enviar PDF / Arquivo</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('text')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-2 ${
                inputMode === 'text'
                  ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <Clipboard className="w-4 h-4" />
              <span>Copiar & Colar Texto</span>
            </button>
          </div>

          {/* Destination Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400">
              Destino dos Lançamentos:
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTargetType('bank');
                  setSelectedTargetId(accounts[0]?.id || '');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  targetType === 'bank'
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <Building2 className="w-4 h-4" />
                <span>Conta Bancária</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTargetType('card');
                  setSelectedTargetId(cards[0]?.id || '');
                }}
                className={`p-2.5 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                  targetType === 'card'
                    ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                }`}
              >
                <CardIcon className="w-4 h-4" />
                <span>Cartão de Crédito</span>
              </button>
            </div>

            {targetType === 'bank' ? (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100"
              >
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.bankName} - Ag: {a.agency} / C/C: {a.accountNumber}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={selectedTargetId}
                onChange={(e) => setSelectedTargetId(e.target.value)}
                className="w-full p-2.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-medium text-slate-800 dark:text-slate-100"
              >
                {cards.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} (**** {c.lastFourDigits})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Mode 1: PDF Upload Dropzone */}
          {inputMode === 'upload' ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpg,.jpeg,.ofx,.csv,.txt"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                  if (e.target) e.target.value = '';
                }}
                className="hidden"
              />

              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragActive(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handleFileUpload(e.dataTransfer.files[0]);
                  }
                }}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all space-y-3 ${
                  isDragActive
                    ? 'border-purple-600 bg-purple-100/80 dark:bg-purple-900/40 scale-[1.01]'
                    : 'border-purple-200 dark:border-purple-900/60 hover:border-purple-500 bg-purple-50/40 dark:bg-purple-950/20'
                }`}
              >
                <div className="w-12 h-12 rounded-2xl bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 mx-auto shadow-inner">
                  <Upload className="w-6 h-6" />
                </div>

                <div>
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Clique aqui ou arraste seu arquivo em PDF
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    Suporta PDF, OFX, CSV e imagens de faturas/extratos bancários
                  </p>
                </div>

                <div className="pt-1">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      fileInputRef.current?.click();
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md transition-colors"
                  >
                    Procurar no Computador
                  </button>
                </div>
              </div>

              {selectedFileName && (
                <div className="flex items-center gap-2 p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-700 dark:text-slate-300">
                  <FileText className="w-4 h-4 text-purple-500" />
                  <span className="truncate font-medium flex-1">{selectedFileName}</span>
                </div>
              )}
            </div>
          ) : (
            /* Mode 2: Copy & Paste Text */
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  Texto do Extrato (Copiar e Colar)
                </label>

                <button
                  type="button"
                  onClick={() => setRawText(targetType === 'bank' ? sampleBankText : sampleCardText)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
                >
                  Carregar Exemplo
                </button>
              </div>

              <textarea
                rows={7}
                placeholder="Cole aqui o texto copiado do seu extrato bancário ou fatura do cartão..."
                value={rawText}
                onChange={(e) => setRawText(e.target.value)}
                className="w-full p-3 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
              />

              <button
                type="button"
                onClick={handleParseText}
                disabled={isLoading}
                className="w-full mt-2 py-3 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>{isLoading ? 'Analisando com IA...' : 'Analisar Texto Copiado'}</span>
              </button>
            </div>
          )}

          {statusMessage && (
            <div className="p-3 bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800 rounded-xl text-xs font-medium text-indigo-700 dark:text-indigo-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-500 shrink-0 animate-pulse" />
              <span>{statusMessage}</span>
            </div>
          )}
        </div>

        {/* Parsed Preview & Batch Import (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>2. Lançamentos Identificados</span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Revise e ajuste os valores e categorias antes de importar para o sistema
                </p>
              </div>

              {parsedItems.length > 0 && (
                <button
                  type="button"
                  onClick={handleConfirmBatchImport}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Importar {parsedItems.length} Itens em Lote</span>
                </button>
              )}
            </div>

            {parsedItems.length === 0 ? (
              <div className="text-center py-16 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-2">
                <FileText className="w-10 h-10 mx-auto opacity-50 text-purple-500" />
                <p className="font-semibold text-slate-600 dark:text-slate-300 text-sm">
                  Nenhum arquivo ou extrato analisado ainda.
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Envie seu arquivo PDF ou cole o texto do extrato ao lado para que a IA processe automaticamente.
                </p>
              </div>
            ) : (
              <div className="max-h-[380px] overflow-y-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 dark:border-slate-800 font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="pb-2 px-2">Data</th>
                      <th className="pb-2 px-2">Descrição</th>
                      <th className="pb-2 px-2">Categoria</th>
                      <th className="pb-2 px-2 text-right">Valor</th>
                      <th className="pb-2 px-2 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {parsedItems.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="py-2.5 px-2 font-medium whitespace-nowrap">{formatDateBR(item.date)}</td>
                        <td className="py-2.5 px-2 font-semibold text-slate-800 dark:text-slate-100">
                          {item.description}
                          {item.totalInstallments > 1 && (
                            <span className="ml-1 px-1.5 py-0.5 text-[10px] bg-amber-100 text-amber-800 rounded font-bold">
                              Parc {item.currentInstallment}/{item.totalInstallments}
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-2">
                          <select
                            value={item.category}
                            onChange={(e) => handleUpdateCategory(item.id, e.target.value)}
                            className="p-1 text-xs bg-slate-100 dark:bg-slate-800 border rounded text-slate-800 dark:text-slate-200 font-medium"
                          >
                            {activeCategories.map((cat) => (
                              <option key={cat.id} value={cat.name}>
                                {cat.name}
                              </option>
                            ))}
                            {item.category && !activeCategories.some((c) => c.name === item.category) && (
                              <option value={item.category}>{item.category}</option>
                            )}
                          </select>
                        </td>
                        <td className={`py-2.5 px-2 text-right font-bold whitespace-nowrap ${item.amount >= 0 && !item.isExpense ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-500 font-bold'}`}>
                          {item.amount >= 0 && !item.isExpense ? `+${formatCurrency(item.amount)}` : `-${formatCurrency(item.amount)}`}
                        </td>
                        <td className="py-2.5 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteParsedItem(item.id)}
                            className="p-1 text-slate-400 hover:text-rose-600"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {parsedItems.length > 0 && (
            <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500">
                Total de {parsedItems.length} transações identificadas
              </span>

              <button
                type="button"
                onClick={handleConfirmBatchImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-md transition-all flex items-center gap-2"
              >
                <span>Confirmar Importação em Lote</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

