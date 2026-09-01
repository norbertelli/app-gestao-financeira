import React, { useState, useEffect } from 'react';
import {
  ActiveTab,
  BankAccount,
  BankTransaction,
  CreditCard,
  CardTransaction,
  Investment,
  InvestmentTransaction,
  FuturePayment,
  OpenFinanceConnection,
  ParsedStatementItem,
  CategoryItem,
  NotificationSettings,
  NotificationLog,
} from './types';
import {
  INITIAL_BANK_ACCOUNTS,
  INITIAL_BANK_TRANSACTIONS,
  INITIAL_CREDIT_CARDS,
  INITIAL_CARD_TRANSACTIONS,
  INITIAL_INVESTMENTS,
  INITIAL_INVESTMENT_TRANSACTIONS,
  INITIAL_FUTURE_PAYMENTS,
  INITIAL_OPEN_FINANCE_CONNECTIONS,
  INITIAL_CATEGORIES,
  INITIAL_NOTIFICATION_SETTINGS,
  INITIAL_NOTIFICATION_LOGS,
} from './data/initialData';
import { calculateTotalNetWorth } from './utils/financeUtils';
import { getUpcomingBillsAlerts } from './services/reminderService';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { BankAccountsView } from './components/BankAccountsView';
import { CreditCardsView } from './components/CreditCardsView';
import { InvestmentsView } from './components/InvestmentsView';
import { FuturePaymentsView } from './components/FuturePaymentsView';
import { SmartReaderView } from './components/SmartReaderView';
import { OpenFinanceView } from './components/OpenFinanceView';
import { CategoriesView } from './components/CategoriesView';
import { NotificationSettingsView } from './components/NotificationSettingsView';
import { StatementAuditModal } from './components/StatementAuditModal';
import { MultiUserSyncModal } from './components/MultiUserSyncModal';
import { CloudSyncBanner } from './components/CloudSyncBanner';
import { AuthView } from './components/AuthView';
import { useAuth } from './context/AuthContext';
import {
  subscribeBankAccounts,
  saveBankAccountDoc,
  deleteBankAccountDoc,
  subscribeBankTransactions,
  saveBankTransactionDoc,
  deleteBankTransactionDoc,
  subscribeCreditCards,
  saveCreditCardDoc,
  deleteCreditCardDoc,
  subscribeCardTransactions,
  saveCardTransactionDoc,
  deleteCardTransactionDoc,
  subscribeInvestments,
  saveInvestmentDoc,
  deleteInvestmentDoc,
  subscribeInvestmentTransactions,
  saveInvestmentTransactionDoc,
  deleteInvestmentTransactionDoc,
  subscribeFuturePayments,
  saveFuturePaymentDoc,
  deleteFuturePaymentDoc,
  subscribeOpenFinanceConnections,
  saveOpenFinanceConnectionDoc,
  deleteOpenFinanceConnectionDoc,
  subscribeCategories,
  saveCategoryDoc,
  deleteCategoryDoc,
  subscribeNotificationSettings,
  saveNotificationSettingsDoc,
  subscribeNotificationLogs,
  saveNotificationLogDoc,
  seedInitialUserData,
  checkAndSeedUserData,
} from './services/firebase';

export default function App() {
  const { user, loading, isAdmin, triggerSyncNotification } = useAuth();

  // State initialized from localStorage or defaults
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem('finflow_accounts');
    return saved ? JSON.parse(saved) : INITIAL_BANK_ACCOUNTS;
  });

  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>(() => {
    const saved = localStorage.getItem('finflow_bank_txs');
    return saved ? JSON.parse(saved) : INITIAL_BANK_TRANSACTIONS;
  });

  const [cards, setCards] = useState<CreditCard[]>(() => {
    const saved = localStorage.getItem('finflow_cards');
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_CARDS;
  });

  const [cardTransactions, setCardTransactions] = useState<CardTransaction[]>(() => {
    const saved = localStorage.getItem('finflow_card_txs');
    return saved ? JSON.parse(saved) : INITIAL_CARD_TRANSACTIONS;
  });

  const [investments, setInvestments] = useState<Investment[]>(() => {
    const saved = localStorage.getItem('finflow_investments');
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENTS;
  });

  const [investmentTransactions, setInvestmentTransactions] = useState<InvestmentTransaction[]>(() => {
    const saved = localStorage.getItem('finflow_inv_txs');
    return saved ? JSON.parse(saved) : INITIAL_INVESTMENT_TRANSACTIONS;
  });

  const [futurePayments, setFuturePayments] = useState<FuturePayment[]>(() => {
    const saved = localStorage.getItem('finflow_future_payments');
    return saved ? JSON.parse(saved) : INITIAL_FUTURE_PAYMENTS;
  });

  const [openFinanceConnections, setOpenFinanceConnections] = useState<OpenFinanceConnection[]>(() => {
    const saved = localStorage.getItem('finflow_of_connections');
    return saved ? JSON.parse(saved) : INITIAL_OPEN_FINANCE_CONNECTIONS;
  });

  const [categories, setCategories] = useState<CategoryItem[]>(() => {
    const saved = localStorage.getItem('finflow_categories');
    return saved ? JSON.parse(saved) : INITIAL_CATEGORIES;
  });

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(() => {
    const saved = localStorage.getItem('finflow_notification_settings');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_SETTINGS;
  });

  const [notificationLogs, setNotificationLogs] = useState<NotificationLog[]>(() => {
    const saved = localStorage.getItem('finflow_notification_logs');
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATION_LOGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);

  // Statement Audit Modal state
  const [auditModal, setAuditModal] = useState<{
    isOpen: boolean;
    entityType: 'bank' | 'card' | 'investment';
    bankAccount?: BankAccount;
    creditCard?: CreditCard;
    investment?: Investment;
  }>({
    isOpen: false,
    entityType: 'bank',
  });

  // Real-Time Firebase Subscriptions when Authenticated
  useEffect(() => {
    if (!user) return;

    // Seed on first-time user login only if database was not initialized yet, preserving any local edits
    checkAndSeedUserData(user.uid, {
      accounts: accounts.length > 0 ? accounts : INITIAL_BANK_ACCOUNTS,
      bankTransactions: bankTransactions.length > 0 ? bankTransactions : INITIAL_BANK_TRANSACTIONS,
      cards: cards.length > 0 ? cards : INITIAL_CREDIT_CARDS,
      cardTransactions: cardTransactions.length > 0 ? cardTransactions : INITIAL_CARD_TRANSACTIONS,
      investments: investments.length > 0 ? investments : INITIAL_INVESTMENTS,
      investmentTransactions: investmentTransactions.length > 0 ? investmentTransactions : INITIAL_INVESTMENT_TRANSACTIONS,
      futurePayments: futurePayments.length > 0 ? futurePayments : INITIAL_FUTURE_PAYMENTS,
      openFinanceConnections: openFinanceConnections.length > 0 ? openFinanceConnections : INITIAL_OPEN_FINANCE_CONNECTIONS,
      categories: categories.length > 0 ? categories : INITIAL_CATEGORIES,
      notificationSettings: notificationSettings || INITIAL_NOTIFICATION_SETTINGS,
      notificationLogs: notificationLogs.length > 0 ? notificationLogs : INITIAL_NOTIFICATION_LOGS,
    });

    const unsubAccounts = subscribeBankAccounts(user.uid, (data) => {
      setAccounts(data);
      triggerSyncNotification();
    });

    const unsubBankTxs = subscribeBankTransactions(user.uid, (data) => {
      setBankTransactions(data);
    });

    const unsubCards = subscribeCreditCards(user.uid, (data) => {
      setCards(data);
    });

    const unsubCardTxs = subscribeCardTransactions(user.uid, (data) => {
      setCardTransactions(data);
    });

    const unsubInvs = subscribeInvestments(user.uid, (data) => {
      setInvestments(data);
    });

    const unsubInvTxs = subscribeInvestmentTransactions(user.uid, (data) => {
      setInvestmentTransactions(data);
    });

    const unsubFuturePmts = subscribeFuturePayments(user.uid, (data) => {
      setFuturePayments(data);
    });

    const unsubOpenFin = subscribeOpenFinanceConnections(user.uid, (data) => {
      setOpenFinanceConnections(data);
    });

    const unsubCats = subscribeCategories(user.uid, (data) => {
      setCategories(data);
    });

    const unsubSettings = subscribeNotificationSettings(user.uid, (data) => {
      if (data) setNotificationSettings(data);
    });

    const unsubLogs = subscribeNotificationLogs(user.uid, (data) => {
      setNotificationLogs(data);
    });

    return () => {
      unsubAccounts();
      unsubBankTxs();
      unsubCards();
      unsubCardTxs();
      unsubInvs();
      unsubInvTxs();
      unsubFuturePmts();
      unsubOpenFin();
      unsubCats();
      unsubSettings();
      unsubLogs();
    };
  }, [user]);

  // Save to localStorage when in guest / local mode
  useEffect(() => {
    if (!user) localStorage.setItem('finflow_accounts', JSON.stringify(accounts));
  }, [accounts, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_bank_txs', JSON.stringify(bankTransactions));
  }, [bankTransactions, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_cards', JSON.stringify(cards));
  }, [cards, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_card_txs', JSON.stringify(cardTransactions));
  }, [cardTransactions, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_investments', JSON.stringify(investments));
  }, [investments, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_inv_txs', JSON.stringify(investmentTransactions));
  }, [investmentTransactions, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_future_payments', JSON.stringify(futurePayments));
  }, [futurePayments, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_of_connections', JSON.stringify(openFinanceConnections));
  }, [openFinanceConnections, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_categories', JSON.stringify(categories));
  }, [categories, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_notification_settings', JSON.stringify(notificationSettings));
  }, [notificationSettings, user]);

  useEffect(() => {
    if (!user) localStorage.setItem('finflow_notification_logs', JSON.stringify(notificationLogs));
  }, [notificationLogs, user]);

  // Migration Helper: Force push local state to Cloud Firestore
  const handleMigrateLocalToCloud = async () => {
    if (!user) return;
    await seedInitialUserData(user.uid, {
      accounts,
      bankTransactions,
      cards,
      cardTransactions,
      investments,
      investmentTransactions,
      futurePayments,
      openFinanceConnections,
      categories,
      notificationSettings,
      notificationLogs,
    });
    triggerSyncNotification();
  };

  // Calculate Net Worth for Navbar summary
  const { netWorth } = calculateTotalNetWorth(
    accounts,
    bankTransactions,
    cards,
    cardTransactions,
    investments,
    investmentTransactions
  );

  // Monitor upcoming bills (< 3 days) for badge alerts
  const urgentBillsAlerts = getUpcomingBillsAlerts(futurePayments, notificationSettings);

  // Handlers for Notification Settings & Logs
  const handleUpdateNotificationSettings = (newSettings: NotificationSettings) => {
    setNotificationSettings(newSettings);
    if (user) {
      saveNotificationSettingsDoc(user.uid, newSettings);
    }
  };

  const handleAddNotificationLog = (log: NotificationLog) => {
    setNotificationLogs((prev) => [log, ...prev]);
    if (user) {
      saveNotificationLogDoc(user.uid, log);
    }
  };

  const handleClearNotificationLogs = () => {
    setNotificationLogs([]);
    if (!user) {
      localStorage.removeItem('finflow_notification_logs');
    }
  };

  // Handlers for Accounts (CRUD)
  const handleAddAccount = (acc: Omit<BankAccount, 'id'>) => {
    const newAcc: BankAccount = {
      ...acc,
      id: `acc_${Date.now()}`,
    };
    if (user) {
      saveBankAccountDoc(user.uid, newAcc);
    }
    setAccounts((prev) => [...prev, newAcc]);
  };

  const handleEditAccount = (updatedAcc: BankAccount) => {
    if (user) {
      saveBankAccountDoc(user.uid, updatedAcc);
    }
    setAccounts((prev) => prev.map((a) => (a.id === updatedAcc.id ? updatedAcc : a)));
  };

  const handleDeleteAccount = (id: string) => {
    if (user) {
      deleteBankAccountDoc(user.uid, id);
      bankTransactions.filter((t) => t.accountId === id).forEach((t) => deleteBankTransactionDoc(user.uid, t.id));
      const linkedCardIds = new Set(cards.filter((c) => c.bankId === id).map((c) => c.id));
      if (linkedCardIds.size > 0) {
        cards.filter((c) => linkedCardIds.has(c.id)).forEach((c) => deleteCreditCardDoc(user.uid, c.id));
        cardTransactions.filter((t) => linkedCardIds.has(t.cardId)).forEach((t) => deleteCardTransactionDoc(user.uid, t.id));
      }
    }
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    setBankTransactions((prev) => prev.filter((t) => t.accountId !== id));

    const linkedCardIds = new Set(cards.filter((c) => c.bankId === id).map((c) => c.id));
    if (linkedCardIds.size > 0) {
      setCards((prev) => prev.filter((c) => !linkedCardIds.has(c.id)));
      setCardTransactions((prev) => prev.filter((t) => !linkedCardIds.has(t.cardId)));
    }
  };

  const handleAddBankTx = (tx: Omit<BankTransaction, 'id'>) => {
    const newTx: BankTransaction = {
      ...tx,
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    if (user) {
      saveBankTransactionDoc(user.uid, newTx);
    }
    setBankTransactions((prev) => [newTx, ...prev]);
  };

  const handleEditBankTx = (updatedTx: BankTransaction) => {
    if (user) {
      saveBankTransactionDoc(user.uid, updatedTx);
    }
    setBankTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const handleDeleteBankTx = (id: string) => {
    if (user) {
      deleteBankTransactionDoc(user.uid, id);
    }
    setBankTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Cards (CRUD)
  const handleAddCard = (card: Omit<CreditCard, 'id'>) => {
    const newCard: CreditCard = {
      ...card,
      id: `card_${Date.now()}`,
    };
    if (user) {
      saveCreditCardDoc(user.uid, newCard);
    }
    setCards((prev) => [...prev, newCard]);
  };

  const handleEditCard = (updatedCard: CreditCard) => {
    if (user) {
      saveCreditCardDoc(user.uid, updatedCard);
    }
    setCards((prev) => prev.map((c) => (c.id === updatedCard.id ? updatedCard : c)));
  };

  const handleDeleteCard = (id: string) => {
    if (user) {
      deleteCreditCardDoc(user.uid, id);
      cardTransactions.filter((t) => t.cardId === id).forEach((t) => deleteCardTransactionDoc(user.uid, t.id));
    }
    setCards((prev) => prev.filter((c) => c.id !== id));
    setCardTransactions((prev) => prev.filter((t) => t.cardId !== id));
  };

  const handleAddCardTx = (tx: Omit<CardTransaction, 'id'>) => {
    const newTx: CardTransaction = {
      ...tx,
      id: `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    if (user) {
      saveCardTransactionDoc(user.uid, newTx);
    }
    setCardTransactions((prev) => [newTx, ...prev]);
  };

  const handleEditCardTx = (updatedTx: CardTransaction) => {
    if (user) {
      saveCardTransactionDoc(user.uid, updatedTx);
    }
    setCardTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const handleDeleteCardTx = (id: string) => {
    if (user) {
      deleteCardTransactionDoc(user.uid, id);
    }
    setCardTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Investments (CRUD)
  const handleAddInvestment = (inv: Omit<Investment, 'id'>) => {
    const newInv: Investment = {
      ...inv,
      id: `inv_${Date.now()}`,
    };
    if (user) {
      saveInvestmentDoc(user.uid, newInv);
    }
    setInvestments((prev) => [...prev, newInv]);
  };

  const handleEditInvestment = (updatedInv: Investment) => {
    if (user) {
      saveInvestmentDoc(user.uid, updatedInv);
    }
    setInvestments((prev) => prev.map((i) => (i.id === updatedInv.id ? updatedInv : i)));
  };

  const handleDeleteInvestment = (id: string) => {
    if (user) {
      deleteInvestmentDoc(user.uid, id);
      investmentTransactions.filter((t) => t.investmentId === id).forEach((t) => deleteInvestmentTransactionDoc(user.uid, t.id));
    }
    setInvestments((prev) => prev.filter((i) => i.id !== id));
    setInvestmentTransactions((prev) => prev.filter((t) => t.investmentId !== id));
  };

  const handleAddInvestmentTx = (tx: Omit<InvestmentTransaction, 'id'>) => {
    const newTx: InvestmentTransaction = {
      ...tx,
      id: `itx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
    };
    if (user) {
      saveInvestmentTransactionDoc(user.uid, newTx);
    }
    setInvestmentTransactions((prev) => [newTx, ...prev]);
  };

  const handleEditInvestmentTx = (updatedTx: InvestmentTransaction) => {
    if (user) {
      saveInvestmentTransactionDoc(user.uid, updatedTx);
    }
    setInvestmentTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? updatedTx : t)));
  };

  const handleDeleteInvestmentTx = (id: string) => {
    if (user) {
      deleteInvestmentTransactionDoc(user.uid, id);
    }
    setInvestmentTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Handlers for Future Payments (Contas a Pagar CRUD)
  const handleAddFuturePayment = (payment: Omit<FuturePayment, 'id'>) => {
    const newPmt: FuturePayment = {
      ...payment,
      id: `pmt_${Date.now()}`,
    };
    if (user) {
      saveFuturePaymentDoc(user.uid, newPmt);
    }
    setFuturePayments((prev) => [...prev, newPmt]);
  };

  const handleEditFuturePayment = (updatedPmt: FuturePayment) => {
    if (user) {
      saveFuturePaymentDoc(user.uid, updatedPmt);
    }
    setFuturePayments((prev) => prev.map((p) => (p.id === updatedPmt.id ? updatedPmt : p)));
  };

  const handleDeleteFuturePayment = (id: string) => {
    if (user) {
      deleteFuturePaymentDoc(user.uid, id);
    }
    setFuturePayments((prev) => prev.filter((p) => p.id !== id));
  };

  // Pay Payment Handler
  const handlePayPayment = (
    paymentIdOrDetails:
      | string
      | { paymentId: string; paymentDate: string; accountId?: string; bankAccountId?: string; paidAmount: number },
    detailsParam?: { paymentDate: string; bankAccountId?: string; accountId?: string; paidAmount: number }
  ) => {
    let paymentId = '';
    let paymentDate = new Date().toISOString().split('T')[0];
    let accountId = '';
    let paidAmount = 0;

    if (typeof paymentIdOrDetails === 'string') {
      paymentId = paymentIdOrDetails;
      if (detailsParam) {
        paymentDate = detailsParam.paymentDate || paymentDate;
        accountId = detailsParam.accountId || detailsParam.bankAccountId || '';
        paidAmount = detailsParam.paidAmount || 0;
      }
    } else if (paymentIdOrDetails && typeof paymentIdOrDetails === 'object') {
      paymentId = paymentIdOrDetails.paymentId;
      paymentDate = paymentIdOrDetails.paymentDate || paymentDate;
      accountId = paymentIdOrDetails.accountId || paymentIdOrDetails.bankAccountId || '';
      paidAmount = paymentIdOrDetails.paidAmount || 0;
    }

    if (!paymentId) return;

    const pmt = futurePayments.find((p) => p.id === paymentId);
    if (!pmt) return;

    const targetAccountId = accountId || accounts[0]?.id || '';

    // Check if this is a receipt (positive) or a payment (negative)
    const isReceber = pmt.type === 'Receber' || pmt.paymentType === 'Receber';
    const finalVal = Math.abs(paidAmount || pmt.expectedAmount);
    const transactionAmount = isReceber ? finalVal : -finalVal;
    const descPrefix = isReceber ? '[Recebido]' : '[Pago]';
    const defaultTxType = isReceber ? 'PIX' : 'Boleto';

    // 1. Add credit (positive) or debit (negative) transaction to Bank Account
    const newBankTx: BankTransaction = {
      id: `tx_pay_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      accountId: targetAccountId,
      date: paymentDate,
      description: `${descPrefix} ${pmt.description}`,
      amount: transactionAmount,
      category: pmt.category,
      type: defaultTxType,
      status: 'Concluído',
    };

    const updatedPmt: FuturePayment = {
      ...pmt,
      status: 'Pago',
      paidDate: paymentDate,
      paidAmount: finalVal,
      bankAccountId: targetAccountId,
    };

    if (user) {
      saveBankTransactionDoc(user.uid, newBankTx);
      saveFuturePaymentDoc(user.uid, updatedPmt);
    }
    setBankTransactions((prev) => [newBankTx, ...prev]);
    setFuturePayments((prev) => prev.map((p) => (p.id === paymentId ? updatedPmt : p)));
  };

  // Batch Import from Smart Reader
  const handleBatchImportBankTransactions = (accountId: string, items: ParsedStatementItem[]) => {
    const newTxs: BankTransaction[] = items.map((item) => ({
      id: `tx_batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      accountId,
      date: item.date,
      description: item.description,
      amount: item.amount,
      category: item.category,
      type: item.type,
      status: 'Concluído',
    }));

    if (user) {
      newTxs.forEach((tx) => saveBankTransactionDoc(user.uid, tx));
    } else {
      setBankTransactions((prev) => [...newTxs, ...prev]);
    }
  };

  const handleBatchImportCardTransactions = (cardId: string, items: ParsedStatementItem[]) => {
    const newCardTxs: CardTransaction[] = items.map((item) => ({
      id: `ctx_batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      cardId,
      date: item.date,
      description: item.description,
      amount: Math.abs(item.amount),
      category: item.category,
      currentInstallment: item.currentInstallment || 1,
      totalInstallments: item.totalInstallments || 1,
      invoiceMonth: item.invoiceMonth || new Date().toISOString().substring(0, 7),
      status: 'Aberto',
    }));

    if (user) {
      newCardTxs.forEach((tx) => saveCardTransactionDoc(user.uid, tx));
    } else {
      setCardTransactions((prev) => [...newCardTxs, ...prev]);
    }
  };

  // Open Finance Sync Simulation
  const handleSyncOpenFinance = () => {
    const nowStr = new Date().toLocaleString('pt-BR');
    const updatedConns = openFinanceConnections.map((c) => ({
      ...c,
      lastSync: nowStr,
      status: 'CONECTADO' as const,
    }));

    if (user) {
      updatedConns.forEach((conn) => saveOpenFinanceConnectionDoc(user.uid, conn));
    } else {
      setOpenFinanceConnections(updatedConns);
    }
  };

  // Handlers for Categories (Admin CRUD)
  const handleAddCategory = (cat: Omit<CategoryItem, 'id'>) => {
    const newCat: CategoryItem = {
      ...cat,
      id: `cat_${Date.now()}`,
    };
    if (user) {
      saveCategoryDoc(user.uid, newCat);
    }
    setCategories((prev) => [...prev, newCat]);
  };

  const handleEditCategory = (updatedCat: CategoryItem) => {
    if (user) {
      saveCategoryDoc(user.uid, updatedCat);
    }
    setCategories((prev) => prev.map((c) => (c.id === updatedCat.id ? updatedCat : c)));
  };

  const handleDeleteCategory = (id: string) => {
    if (user) {
      deleteCategoryDoc(user.uid, id);
    }
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  // Reset Data to Defaults
  const handleResetData = () => {
    if (window.confirm('Deseja restaurar todos os dados para os valores de exemplo iniciais?')) {
      if (user) {
        seedInitialUserData(user.uid, {
          accounts: INITIAL_BANK_ACCOUNTS,
          bankTransactions: INITIAL_BANK_TRANSACTIONS,
          cards: INITIAL_CREDIT_CARDS,
          cardTransactions: INITIAL_CARD_TRANSACTIONS,
          investments: INITIAL_INVESTMENTS,
          investmentTransactions: INITIAL_INVESTMENT_TRANSACTIONS,
          futurePayments: INITIAL_FUTURE_PAYMENTS,
          openFinanceConnections: INITIAL_OPEN_FINANCE_CONNECTIONS,
          categories: INITIAL_CATEGORIES,
          notificationSettings: INITIAL_NOTIFICATION_SETTINGS,
          notificationLogs: INITIAL_NOTIFICATION_LOGS,
        });
      } else {
        setAccounts(INITIAL_BANK_ACCOUNTS);
        setBankTransactions(INITIAL_BANK_TRANSACTIONS);
        setCards(INITIAL_CREDIT_CARDS);
        setCardTransactions(INITIAL_CARD_TRANSACTIONS);
        setInvestments(INITIAL_INVESTMENTS);
        setInvestmentTransactions(INITIAL_INVESTMENT_TRANSACTIONS);
        setFuturePayments(INITIAL_FUTURE_PAYMENTS);
        setOpenFinanceConnections(INITIAL_OPEN_FINANCE_CONNECTIONS);
        setCategories(INITIAL_CATEGORIES);
        setNotificationSettings(INITIAL_NOTIFICATION_SETTINGS);
        setNotificationLogs(INITIAL_NOTIFICATION_LOGS);
        localStorage.clear();
      }
    }
  };

  // Modal Opener for Statement Auditing
  const handleOpenStatementModal = (type: 'bank' | 'card' | 'investment', entity: any) => {
    setAuditModal({
      isOpen: true,
      entityType: type,
      bankAccount: type === 'bank' ? entity : undefined,
      creditCard: type === 'card' ? entity : undefined,
      investment: type === 'investment' ? entity : undefined,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-400 font-semibold text-sm">Carregando FinFlow Nuvem...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenSmartReader={() => setActiveTab('smart-reader')}
        onResetData={handleResetData}
        onOpenSyncModal={() => setIsSyncModalOpen(true)}
        netWorth={netWorth}
        urgentBillsCount={urgentBillsAlerts.length}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {/* Real-time Cloud Sync / Multi-Device Banner */}
        <CloudSyncBanner
          onOpenSyncModal={() => setIsSyncModalOpen(true)}
          onMigrateLocalToCloud={handleMigrateLocalToCloud}
          itemsCount={{
            accounts: accounts.length,
            cards: cards.length,
            investments: investments.length,
          }}
        />

        {activeTab === 'dashboard' && (
          <DashboardView
            accounts={accounts}
            bankTransactions={bankTransactions}
            cards={cards}
            cardTransactions={cardTransactions}
            investments={investments}
            investmentTransactions={investmentTransactions}
            futurePayments={futurePayments}
            onOpenStatementModal={handleOpenStatementModal}
            onOpenSmartReader={() => setActiveTab('smart-reader')}
            onNavigateTab={(tab) => setActiveTab(tab)}
          />
        )}

        {activeTab === 'accounts' && (
          <BankAccountsView
            accounts={accounts}
            bankTransactions={bankTransactions}
            categories={categories}
            cards={cards}
            onAddAccount={handleAddAccount}
            onEditAccount={handleEditAccount}
            onDeleteAccount={handleDeleteAccount}
            onAddTransaction={handleAddBankTx}
            onEditTransaction={handleEditBankTx}
            onDeleteTransaction={handleDeleteBankTx}
            onOpenStatementModal={(type, entity) => handleOpenStatementModal(type, entity)}
          />
        )}

        {activeTab === 'cards' && (
          <CreditCardsView
            cards={cards}
            cardTransactions={cardTransactions}
            categories={categories}
            onAddCard={handleAddCard}
            onEditCard={handleEditCard}
            onDeleteCard={handleDeleteCard}
            onAddCardTransaction={handleAddCardTx}
            onEditCardTransaction={handleEditCardTx}
            onDeleteCardTransaction={handleDeleteCardTx}
            onOpenStatementModal={(type, entity) => handleOpenStatementModal(type, entity)}
          />
        )}

        {activeTab === 'investments' && (
          <InvestmentsView
            investments={investments}
            investmentTransactions={investmentTransactions}
            onAddInvestment={handleAddInvestment}
            onEditInvestment={handleEditInvestment}
            onDeleteInvestment={handleDeleteInvestment}
            onAddInvestmentTx={handleAddInvestmentTx}
            onEditInvestmentTx={handleEditInvestmentTx}
            onDeleteInvestmentTx={handleDeleteInvestmentTx}
            onOpenStatementModal={(type, entity) => handleOpenStatementModal(type, entity)}
          />
        )}

        {activeTab === 'future-payments' && (
          <FuturePaymentsView
            futurePayments={futurePayments}
            accounts={accounts}
            categories={categories}
            onAddPayment={handleAddFuturePayment}
            onEditPayment={handleEditFuturePayment}
            onDeletePayment={handleDeleteFuturePayment}
            onAddFuturePayment={handleAddFuturePayment}
            onEditFuturePayment={handleEditFuturePayment}
            onDeleteFuturePayment={handleDeleteFuturePayment}
            onPayPayment={handlePayPayment}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationSettingsView
            settings={notificationSettings}
            onUpdateSettings={handleUpdateNotificationSettings}
            logs={notificationLogs}
            onAddLog={handleAddNotificationLog}
            onClearLogs={handleClearNotificationLogs}
            futurePayments={futurePayments}
            onNavigateToPayments={() => setActiveTab('future-payments')}
          />
        )}

        {activeTab === 'smart-reader' && (
          <SmartReaderView
            accounts={accounts}
            cards={cards}
            categories={categories}
            onBatchImportBankTransactions={handleBatchImportBankTransactions}
            onBatchImportCardTransactions={handleBatchImportCardTransactions}
          />
        )}

        {activeTab === 'open-finance' && (
          <OpenFinanceView
            connections={openFinanceConnections}
            onSyncConnections={handleSyncOpenFinance}
          />
        )}

        {(activeTab === 'categories' || activeTab === 'settings') && (
          <CategoriesView
            categories={categories}
            onAddCategory={handleAddCategory}
            onEditCategory={handleEditCategory}
            onDeleteCategory={handleDeleteCategory}
          />
        )}
      </main>

      {/* Statement Audit Modal */}
      <StatementAuditModal
        isOpen={auditModal.isOpen}
        onClose={() => setAuditModal((prev) => ({ ...prev, isOpen: false }))}
        entityType={auditModal.entityType}
        bankAccount={auditModal.bankAccount}
        creditCard={auditModal.creditCard}
        investment={auditModal.investment}
        categories={categories}
        bankTransactions={bankTransactions}
        cardTransactions={cardTransactions}
        investmentTransactions={investmentTransactions}
        onAddBankTx={handleAddBankTx}
        onDeleteBankTx={handleDeleteBankTx}
        onAddCardTx={handleAddCardTx}
        onDeleteCardTx={handleDeleteCardTx}
        onAddInvestmentTx={handleAddInvestmentTx}
        onDeleteInvestmentTx={handleDeleteInvestmentTx}
      />

      {/* Multi-User & Multi-Device Realtime Sync Modal */}
      <MultiUserSyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        onMigrateLocalToCloud={handleMigrateLocalToCloud}
        itemsCount={{
          accounts: accounts.length,
          transactions: bankTransactions.length + cardTransactions.length,
          cards: cards.length,
          investments: investments.length,
          futurePayments: futurePayments.length,
        }}
      />
    </div>
  );
}
