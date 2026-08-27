import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { BankAccount, BankTransaction, FuturePayment } from '../types';
import { formatCurrency, formatDateBR } from './financeUtils';

export interface BankStatementExportOptions {
  account: BankAccount;
  transactions: BankTransaction[];
  filters?: {
    searchTerm?: string;
    category?: string;
    month?: string;
    type?: string;
  };
  initialBalance?: number;
  finalBalance?: number;
  totalIncomes?: number;
  totalExpenses?: number;
}

export interface FuturePaymentsExportOptions {
  payments: FuturePayment[];
  filters?: {
    status?: 'all' | 'Pendente' | 'Em Aberto' | 'Pago';
    category?: string;
    searchTerm?: string;
  };
  totalPending?: number;
  totalOpen?: number;
  totalPaid?: number;
  totalUnpaid?: number;
}

/**
 * EXPORT BANK STATEMENT TO PDF
 */
export const exportBankStatementToPDF = (options: BankStatementExportOptions) => {
  const {
    account,
    transactions,
    filters = {},
    initialBalance = account.initialBalance,
    finalBalance,
    totalIncomes = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    totalExpenses = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const nowStr = new Date().toLocaleString('pt-BR');
  const calcFinal = finalBalance !== undefined ? finalBalance : initialBalance + totalIncomes - totalExpenses;

  // Header Banner
  doc.setFillColor(30, 41, 59); // slate-800
  doc.rect(0, 0, 210, 26, 'F');

  // App title & Document title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FinFlow - Gestão Financeira & Open Finance', 14, 11);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(203, 213, 225); // slate-300
  doc.text(`Extrato Bancário Detalhado | ${account.bankName} (Banco ${account.bankCode})`, 14, 18);
  doc.text(`Gerado em: ${nowStr}`, 196, 18, { align: 'right' });

  // Account Info & Filter summary box
  doc.setFillColor(248, 250, 252); // slate-50
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.roundedRect(14, 30, 182, 22, 2, 2, 'FD');

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text('Dados da Conta:', 18, 36);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Agência: ${account.agency}  |  Conta: ${account.accountNumber} (${account.type})`, 18, 41);

  const filterLabels: string[] = [];
  if (filters.month && filters.month !== 'all') filterLabels.push(`Mês: ${filters.month}`);
  if (filters.category && filters.category !== 'all') filterLabels.push(`Categoria: ${filters.category}`);
  if (filters.type && filters.type !== 'all') filterLabels.push(`Tipo: ${filters.type}`);
  if (filters.searchTerm) filterLabels.push(`Busca: "${filters.searchTerm}"`);
  const filterDesc = filterLabels.length > 0 ? filterLabels.join('  •  ') : 'Todos os registros (Sem filtro)';

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Filtros Aplicados:', 18, 47);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(filterDesc, 50, 47);

  // Consolidated Totals Cards (4 blocks)
  const cardY = 56;
  const cardW = 43;
  const cardH = 18;
  const gap = 3.3;

  // 1. Saldo Inicial
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(100, 116, 139);
  doc.text('SALDO INICIAL', 18, cardY + 5.5);
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42);
  doc.text(formatCurrency(initialBalance), 18, cardY + 13);

  // 2. Entradas (+)
  doc.setFillColor(236, 253, 245); // emerald-50
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14 + (cardW + gap), cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('TOTAL ENTRADAS (+)', 18 + (cardW + gap), cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(`+${formatCurrency(totalIncomes)}`, 18 + (cardW + gap), cardY + 13);

  // 3. Saídas (-)
  doc.setFillColor(254, 242, 242); // rose-50
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14 + (cardW + gap) * 2, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('TOTAL SAÍDAS (-)', 18 + (cardW + gap) * 2, cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(`-${formatCurrency(totalExpenses)}`, 18 + (cardW + gap) * 2, cardY + 13);

  // 4. Saldo Calculado
  if (calcFinal >= 0) {
    doc.setFillColor(238, 242, 255);
    doc.setDrawColor(199, 210, 254);
  } else {
    doc.setFillColor(254, 242, 242);
    doc.setDrawColor(254, 202, 202);
  }
  doc.roundedRect(14 + (cardW + gap) * 3, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(calcFinal >= 0 ? 79 : 225, calcFinal >= 0 ? 70 : 29, calcFinal >= 0 ? 229 : 72);
  doc.text('SALDO FINAL', 18 + (cardW + gap) * 3, cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(formatCurrency(calcFinal), 18 + (cardW + gap) * 3, cardY + 13);

  // Transactions Table
  const tableData = transactions
    .slice()
    .sort((a, b) => b.date.localeCompare(a.date))
    .map((t) => [
      formatDateBR(t.date),
      t.description,
      t.type || 'PIX',
      t.category || 'Outros',
      t.amount >= 0 ? `+${formatCurrency(t.amount)}` : formatCurrency(t.amount),
    ]);

  autoTable(doc, {
    startY: cardY + cardH + 6,
    head: [['Data', 'Descrição do Lançamento', 'Tipo', 'Categoria', 'Valor (R$)']],
    body: tableData.length > 0 ? tableData : [['-', 'Nenhum lançamento no filtro selecionado', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 32 },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 4) {
        const rawText = String(data.cell.raw);
        if (rawText.startsWith('+')) {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else if (rawText.startsWith('-') || rawText.startsWith('R$ -')) {
          data.cell.styles.textColor = [220, 38, 38]; // red-600
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  // Add Page Numbers & Footer
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text(
      `FinFlow Documento de Extrato • Total de registros: ${transactions.length} • Página ${i} de ${pageCount}`,
      14,
      290
    );
  }

  const safeBankName = account.bankName.replace(/[^a-zA-Z0-9]/g, '_');
  doc.save(`Extrato_${safeBankName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * EXPORT BANK STATEMENT TO EXCEL (XLSX) OR CSV
 */
export const exportBankStatementToExcel = (
  options: BankStatementExportOptions,
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const {
    account,
    transactions,
    filters = {},
    initialBalance = account.initialBalance,
    finalBalance,
    totalIncomes = transactions.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0),
    totalExpenses = Math.abs(transactions.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0)),
  } = options;

  const calcFinal = finalBalance !== undefined ? finalBalance : initialBalance + totalIncomes - totalExpenses;
  const nowStr = new Date().toLocaleString('pt-BR');

  // Prepare metadata & summaries rows
  const rows: any[] = [
    ['FINFLOW - GESTÃO FINANCEIRA & OPEN FINANCE'],
    ['RELATÓRIO DE EXTRATO BANCÁRIO DETALHADO'],
    ['Gerado em:', nowStr],
    ['Banco:', `${account.bankName} (Cód: ${account.bankCode})`],
    ['Agência:', account.agency, 'Conta:', `${account.accountNumber} (${account.type})`],
    ['Filtro Mês:', filters.month || 'Todos', 'Filtro Categoria:', filters.category || 'Todas', 'Busca:', filters.searchTerm || 'Nenhuma'],
    [],
    ['--- RESUMO CONSOLIDADO DO EXTRATO ---'],
    ['Saldo Inicial (R$)', 'Total Entradas (R$)', 'Total Saídas (R$)', 'Saldo Final Calculado (R$)', 'Qtd. Lançamentos'],
    [initialBalance, totalIncomes, -totalExpenses, calcFinal, transactions.length],
    [],
    ['--- HISTÓRICO DE LANÇAMENTOS ---'],
    ['ID Lançamento', 'Data', 'Descrição', 'Tipo de Operação', 'Categoria', 'Valor (R$)', 'Status'],
  ];

  // Add transaction rows
  const sortedTxs = transactions.slice().sort((a, b) => b.date.localeCompare(a.date));
  for (const t of sortedTxs) {
    rows.push([
      t.id,
      formatDateBR(t.date),
      t.description,
      t.type || 'PIX',
      t.category || 'Outros',
      t.amount,
      t.status || 'Concluído',
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  // Set column widths
  ws['!cols'] = [
    { wch: 18 },
    { wch: 14 },
    { wch: 35 },
    { wch: 18 },
    { wch: 22 },
    { wch: 16 },
    { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Extrato Bancario');

  const safeBankName = account.bankName.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Extrato_${safeBankName}_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
};

/**
 * EXPORT FUTURE PAYMENTS TO PDF
 */
export const exportFuturePaymentsToPDF = (options: FuturePaymentsExportOptions) => {
  const {
    payments,
    filters = {},
    totalPending = payments.filter((p) => p.status === 'Pendente').reduce((s, p) => s + p.expectedAmount, 0),
    totalOpen = payments.filter((p) => p.status === 'Em Aberto').reduce((s, p) => s + p.expectedAmount, 0),
    totalPaid = payments.filter((p) => p.status === 'Pago').reduce((s, p) => s + p.expectedAmount, 0),
    totalUnpaid = totalPending + totalOpen,
  } = options;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const nowStr = new Date().toLocaleString('pt-BR');

  // Header Banner
  doc.setFillColor(245, 158, 11); // amber-500
  doc.rect(0, 0, 210, 26, 'F');

  doc.setTextColor(15, 23, 42); // dark slate
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('FinFlow - Relatório de Futuros Pagamentos', 14, 11);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Contas a Pagar, Vencimentos & Compromissos Financeiros', 14, 18);
  doc.text(`Gerado em: ${nowStr}`, 196, 18, { align: 'right' });

  // Filter summary box
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, 30, 182, 16, 2, 2, 'FD');

  const filterStatusStr = filters.status ? (filters.status === 'all' ? 'Todos os Status' : filters.status) : 'Todos';
  const filterCatStr = filters.category ? (filters.category === 'all' ? 'Todas as Categorias' : filters.category) : 'Todas';
  const filterSearchStr = filters.searchTerm ? `Busca: "${filters.searchTerm}"` : '';

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text('Filtros Aplicados:', 18, 37);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(
    `Status: ${filterStatusStr}  •  Categoria: ${filterCatStr}  ${filterSearchStr ? `•  ${filterSearchStr}` : ''}`,
    50,
    37
  );
  doc.text(`Total de itens listados: ${payments.length}`, 18, 42);

  // Consolidated Totals Cards (4 blocks)
  const cardY = 50;
  const cardW = 43;
  const cardH = 18;
  const gap = 3.3;

  // 1. Pendentes (Vencidos)
  doc.setFillColor(254, 242, 242);
  doc.setDrawColor(254, 202, 202);
  doc.roundedRect(14, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72);
  doc.text('PENDENTE (VENCIDOS)', 18, cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(formatCurrency(totalPending), 18, cardY + 13);

  // 2. Em Aberto (A Vencer)
  doc.setFillColor(254, 243, 199);
  doc.setDrawColor(253, 230, 138);
  doc.roundedRect(14 + (cardW + gap), cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(180, 83, 9);
  doc.text('EM ABERTO (A VENCER)', 18 + (cardW + gap), cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(formatCurrency(totalOpen), 18 + (cardW + gap), cardY + 13);

  // 3. Total a Liquidar (Pendente + Aberto)
  doc.setFillColor(241, 245, 249);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14 + (cardW + gap) * 2, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('TOTAL A LIQUIDAR', 18 + (cardW + gap) * 2, cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(formatCurrency(totalUnpaid), 18 + (cardW + gap) * 2, cardY + 13);

  // 4. Já Pagos / Liquidados
  doc.setFillColor(236, 253, 245);
  doc.setDrawColor(167, 243, 208);
  doc.roundedRect(14 + (cardW + gap) * 3, cardY, cardW, cardH, 2, 2, 'FD');
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(5, 150, 105);
  doc.text('JÁ LIQUIDADOS (PAGOS)', 18 + (cardW + gap) * 3, cardY + 5.5);
  doc.setFontSize(9.5);
  doc.text(formatCurrency(totalPaid), 18 + (cardW + gap) * 3, cardY + 13);

  // Table Data
  const tableData = payments
    .slice()
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .map((p) => [
      formatDateBR(p.dueDate),
      p.description,
      p.category || 'Outros',
      p.status,
      p.notes || '-',
      formatCurrency(p.expectedAmount),
    ]);

  autoTable(doc, {
    startY: cardY + cardH + 6,
    head: [['Vencimento', 'Descrição da Conta', 'Categoria', 'Status', 'Observações', 'Valor (R$)']],
    body: tableData.length > 0 ? tableData : [['-', 'Nenhum pagamento correspondente aos filtros', '-', '-', '-', '-']],
    theme: 'striped',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8.5,
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.2,
      textColor: [30, 41, 59],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 'auto' },
      2: { cellWidth: 26 },
      3: { cellWidth: 24, halign: 'center', fontStyle: 'bold' },
      4: { cellWidth: 32 },
      5: { cellWidth: 28, halign: 'right', fontStyle: 'bold' },
    },
    didParseCell: (data) => {
      if (data.section === 'body' && data.column.index === 3) {
        const st = String(data.cell.raw);
        if (st === 'Pendente') {
          data.cell.styles.textColor = [220, 38, 38]; // Red
        } else if (st === 'Em Aberto') {
          data.cell.styles.textColor = [180, 83, 9]; // Amber
        } else if (st === 'Pago') {
          data.cell.styles.textColor = [5, 150, 105]; // Green
        }
      }
    },
    margin: { left: 14, right: 14 },
  });

  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(148, 163, 184);
    doc.text(
      `FinFlow Contas a Pagar • Total de registros: ${payments.length} • Página ${i} de ${pageCount}`,
      14,
      290
    );
  }

  doc.save(`Futuros_Pagamentos_${new Date().toISOString().split('T')[0]}.pdf`);
};

/**
 * EXPORT FUTURE PAYMENTS TO EXCEL (XLSX) OR CSV
 */
export const exportFuturePaymentsToExcel = (
  options: FuturePaymentsExportOptions,
  format: 'xlsx' | 'csv' = 'xlsx'
) => {
  const {
    payments,
    filters = {},
    totalPending = payments.filter((p) => p.status === 'Pendente').reduce((s, p) => s + p.expectedAmount, 0),
    totalOpen = payments.filter((p) => p.status === 'Em Aberto').reduce((s, p) => s + p.expectedAmount, 0),
    totalPaid = payments.filter((p) => p.status === 'Pago').reduce((s, p) => s + p.expectedAmount, 0),
    totalUnpaid = totalPending + totalOpen,
  } = options;

  const nowStr = new Date().toLocaleString('pt-BR');

  const rows: any[] = [
    ['FINFLOW - GESTÃO FINANCEIRA & OPEN FINANCE'],
    ['RELATÓRIO DE FUTUROS PAGAMENTOS & CONTAS A PAGAR'],
    ['Gerado em:', nowStr],
    ['Filtro Status:', filters.status || 'Todos', 'Filtro Categoria:', filters.category || 'Todas', 'Busca:', filters.searchTerm || 'Nenhuma'],
    [],
    ['--- RESUMO CONSOLIDADO ---'],
    ['Total Pendente (Vencidos R$)', 'Total Em Aberto (A Vencer R$)', 'Total a Liquidar (R$)', 'Total Já Pago (R$)', 'Qtd. Contas'],
    [totalPending, totalOpen, totalUnpaid, totalPaid, payments.length],
    [],
    ['--- HISTÓRICO DE COMPROMISSOS E CONTAS ---'],
    ['ID Pagamento', 'Data Vencimento', 'Descrição da Conta', 'Categoria', 'Status', 'Observações', 'Valor Previsto (R$)'],
  ];

  const sortedPayments = payments.slice().sort((a, b) => a.dueDate.localeCompare(b.dueDate));
  for (const p of sortedPayments) {
    rows.push([
      p.id,
      formatDateBR(p.dueDate),
      p.description,
      p.category || 'Outros',
      p.status,
      p.notes || '',
      p.expectedAmount,
    ]);
  }

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);

  ws['!cols'] = [
    { wch: 18 },
    { wch: 16 },
    { wch: 35 },
    { wch: 20 },
    { wch: 16 },
    { wch: 30 },
    { wch: 18 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Futuros Pagamentos');

  const fileName = `Futuros_Pagamentos_${new Date().toISOString().split('T')[0]}.${format}`;

  if (format === 'csv') {
    XLSX.writeFile(wb, fileName, { bookType: 'csv' });
  } else {
    XLSX.writeFile(wb, fileName, { bookType: 'xlsx' });
  }
};
