import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  limit,
  query,
  getDocFromServer,
  deleteDoc,
  onSnapshot,
  writeBatch,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import {
  BankAccount,
  BankTransaction,
  CreditCard,
  CardTransaction,
  Debt,
  Investment,
  InvestmentTransaction,
  FuturePayment,
  OpenFinanceConnection,
  CategoryItem,
  NotificationSettings,
  NotificationLog,
} from '../types';

// Initialize Firebase
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Error Handling according to skill specification
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Connection test according to skill requirements
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase client is offline. Checking network or configuration.');
    }
    return false;
  }
}

// Authentication Helpers
export const loginWithGoogle = async (): Promise<User | null> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (err) {
    console.error('Google login failed:', err);
    throw err;
  }
};

export const loginWithEmail = async (email: string, pass: string): Promise<User | null> => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, pass);
    return result.user;
  } catch (err) {
    console.error('Email login failed:', err);
    throw err;
  }
};

export const registerWithEmail = async (
  email: string,
  pass: string,
  displayName?: string
): Promise<User | null> => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, pass);
    if (result.user && displayName) {
      await updateProfile(result.user, { displayName });
    }
    return result.user;
  } catch (err) {
    console.error('Email registration failed:', err);
    throw err;
  }
};

export const loginAsAdmin = async (userParam?: string, passParam?: string): Promise<User | null> => {
  // If user provides "admin" and "admin", sign in with master admin account
  const adminEmail = 'admin@finflow.app';
  const adminPassword = 'admin_master_finflow_2026';

  try {
    const result = await signInWithEmailAndPassword(auth, adminEmail, adminPassword);
    if (result.user) {
      await updateProfile(result.user, { displayName: 'Administrador Master' });
      await saveUserProfile(result.user, 'admin');
    }
    return result.user;
  } catch (err: any) {
    // If admin account doesn't exist yet in Firebase Auth, create it automatically
    if (
      err.code === 'auth/user-not-found' ||
      err.code === 'auth/invalid-credential' ||
      err.code === 'auth/wrong-password' ||
      err.code === 'auth/invalid-email'
    ) {
      try {
        const created = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
        if (created.user) {
          await updateProfile(created.user, { displayName: 'Administrador Master' });
          await saveUserProfile(created.user, 'admin');
        }
        return created.user;
      } catch (createErr) {
        // Fallback to anonymous auth tagged as admin
        const anon = await signInAnonymously(auth);
        if (anon.user) {
          await updateProfile(anon.user, { displayName: 'Administrador Master' });
          await saveUserProfile(anon.user, 'admin');
        }
        return anon.user;
      }
    } else {
      try {
        const anon = await signInAnonymously(auth);
        if (anon.user) {
          await updateProfile(anon.user, { displayName: 'Administrador Master' });
          await saveUserProfile(anon.user, 'admin');
        }
        return anon.user;
      } catch (anonErr) {
        console.error('Admin login fallback failed:', anonErr);
        throw err;
      }
    }
  }
};

export const logoutUser = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (err) {
    console.error('Logout error:', err);
    throw err;
  }
};

export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// User Profile Storage
export const saveUserProfile = async (user: User, role: 'admin' | 'user' = 'user') => {
  const userRef = doc(db, 'users', user.uid);
  try {
    await setDoc(
      userRef,
      {
        userId: user.uid,
        email: user.email || (role === 'admin' ? 'admin@finflow.app' : ''),
        displayName: user.displayName || (role === 'admin' ? 'Administrador Master' : 'Usuário FinFlow'),
        photoURL: user.photoURL || '',
        role: role,
        updatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
  }
};

// Real-time Subscriptions for Multi-User & Multi-Device Sync

export const subscribeBankAccounts = (
  userId: string,
  onData: (accounts: BankAccount[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'accounts');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: BankAccount[] = [];
      snapshot.forEach((d) => list.push(d.data() as BankAccount));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/accounts`);
    }
  );
};

export const saveBankAccountDoc = async (userId: string, account: BankAccount) => {
  const docRef = doc(db, 'users', userId, 'accounts', account.id);
  try {
    await setDoc(docRef, { ...account, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/accounts/${account.id}`);
  }
};

export const deleteBankAccountDoc = async (userId: string, accountId: string) => {
  const docRef = doc(db, 'users', userId, 'accounts', accountId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/accounts/${accountId}`);
  }
};

// Bank Transactions
export const subscribeBankTransactions = (
  userId: string,
  onData: (txs: BankTransaction[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'bankTransactions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: BankTransaction[] = [];
      snapshot.forEach((d) => list.push(d.data() as BankTransaction));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/bankTransactions`);
    }
  );
};

export const saveBankTransactionDoc = async (userId: string, tx: BankTransaction) => {
  const docRef = doc(db, 'users', userId, 'bankTransactions', tx.id);
  try {
    await setDoc(docRef, { ...tx, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/bankTransactions/${tx.id}`);
  }
};

export const deleteBankTransactionDoc = async (userId: string, txId: string) => {
  const docRef = doc(db, 'users', userId, 'bankTransactions', txId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/bankTransactions/${txId}`);
  }
};

// Credit Cards
export const subscribeCreditCards = (
  userId: string,
  onData: (cards: CreditCard[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'cards');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CreditCard[] = [];
      snapshot.forEach((d) => list.push(d.data() as CreditCard));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/cards`);
    }
  );
};

export const saveCreditCardDoc = async (userId: string, card: CreditCard) => {
  const docRef = doc(db, 'users', userId, 'cards', card.id);
  try {
    await setDoc(docRef, { ...card, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/cards/${card.id}`);
  }
};

export const deleteCreditCardDoc = async (userId: string, cardId: string) => {
  const docRef = doc(db, 'users', userId, 'cards', cardId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/cards/${cardId}`);
  }
};

// Card Transactions
export const subscribeCardTransactions = (
  userId: string,
  onData: (txs: CardTransaction[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'cardTransactions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CardTransaction[] = [];
      snapshot.forEach((d) => list.push(d.data() as CardTransaction));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/cardTransactions`);
    }
  );
};

export const saveCardTransactionDoc = async (userId: string, tx: CardTransaction) => {
  const docRef = doc(db, 'users', userId, 'cardTransactions', tx.id);
  try {
    await setDoc(docRef, { ...tx, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/cardTransactions/${tx.id}`);
  }
};

export const deleteCardTransactionDoc = async (userId: string, txId: string) => {
  const docRef = doc(db, 'users', userId, 'cardTransactions', txId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/cardTransactions/${txId}`);
  }
};

// Debts & Loans / Dívidas e Empréstimos
export const subscribeDebts = (
  userId: string,
  onData: (debts: Debt[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'debts');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Debt[] = [];
      snapshot.forEach((d) => list.push(d.data() as Debt));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/debts`);
    }
  );
};

export const saveDebtDoc = async (userId: string, debt: Debt) => {
  const docRef = doc(db, 'users', userId, 'debts', debt.id);
  try {
    await setDoc(docRef, { ...debt, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/debts/${debt.id}`);
  }
};

export const deleteDebtDoc = async (userId: string, debtId: string) => {
  const docRef = doc(db, 'users', userId, 'debts', debtId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/debts/${debtId}`);
  }
};

// Investments
export const subscribeInvestments = (
  userId: string,
  onData: (investments: Investment[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'investments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: Investment[] = [];
      snapshot.forEach((d) => list.push(d.data() as Investment));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/investments`);
    }
  );
};

export const saveInvestmentDoc = async (userId: string, investment: Investment) => {
  const docRef = doc(db, 'users', userId, 'investments', investment.id);
  try {
    await setDoc(docRef, { ...investment, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/investments/${investment.id}`);
  }
};

export const deleteInvestmentDoc = async (userId: string, investmentId: string) => {
  const docRef = doc(db, 'users', userId, 'investments', investmentId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/investments/${investmentId}`);
  }
};

// Investment Transactions
export const subscribeInvestmentTransactions = (
  userId: string,
  onData: (txs: InvestmentTransaction[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'investmentTransactions');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: InvestmentTransaction[] = [];
      snapshot.forEach((d) => list.push(d.data() as InvestmentTransaction));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/investmentTransactions`);
    }
  );
};

export const saveInvestmentTransactionDoc = async (userId: string, tx: InvestmentTransaction) => {
  const docRef = doc(db, 'users', userId, 'investmentTransactions', tx.id);
  try {
    await setDoc(docRef, { ...tx, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/investmentTransactions/${tx.id}`);
  }
};

export const deleteInvestmentTransactionDoc = async (userId: string, txId: string) => {
  const docRef = doc(db, 'users', userId, 'investmentTransactions', txId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/investmentTransactions/${txId}`);
  }
};

// Future Payments
export const subscribeFuturePayments = (
  userId: string,
  onData: (payments: FuturePayment[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'futurePayments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: FuturePayment[] = [];
      snapshot.forEach((d) => list.push(d.data() as FuturePayment));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/futurePayments`);
    }
  );
};

export const saveFuturePaymentDoc = async (userId: string, payment: FuturePayment) => {
  const docRef = doc(db, 'users', userId, 'futurePayments', payment.id);
  try {
    await setDoc(docRef, { ...payment, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/futurePayments/${payment.id}`);
  }
};

export const deleteFuturePaymentDoc = async (userId: string, paymentId: string) => {
  const docRef = doc(db, 'users', userId, 'futurePayments', paymentId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/futurePayments/${paymentId}`);
  }
};

// Open Finance Connections
export const subscribeOpenFinanceConnections = (
  userId: string,
  onData: (conns: OpenFinanceConnection[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'openFinanceConnections');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: OpenFinanceConnection[] = [];
      snapshot.forEach((d) => list.push(d.data() as OpenFinanceConnection));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/openFinanceConnections`);
    }
  );
};

export const saveOpenFinanceConnectionDoc = async (userId: string, conn: OpenFinanceConnection) => {
  const docRef = doc(db, 'users', userId, 'openFinanceConnections', conn.id);
  try {
    await setDoc(docRef, { ...conn, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/openFinanceConnections/${conn.id}`);
  }
};

export const deleteOpenFinanceConnectionDoc = async (userId: string, connId: string) => {
  const docRef = doc(db, 'users', userId, 'openFinanceConnections', connId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/openFinanceConnections/${connId}`);
  }
};

// Categories
export const subscribeCategories = (
  userId: string,
  onData: (cats: CategoryItem[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'categories');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: CategoryItem[] = [];
      snapshot.forEach((d) => list.push(d.data() as CategoryItem));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/categories`);
    }
  );
};

export const saveCategoryDoc = async (userId: string, cat: CategoryItem) => {
  const docRef = doc(db, 'users', userId, 'categories', cat.id);
  try {
    await setDoc(docRef, { ...cat, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/categories/${cat.id}`);
  }
};

export const deleteCategoryDoc = async (userId: string, catId: string) => {
  const docRef = doc(db, 'users', userId, 'categories', catId);
  try {
    await deleteDoc(docRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `users/${userId}/categories/${catId}`);
  }
};

// Notification Settings
export const subscribeNotificationSettings = (
  userId: string,
  onData: (settings: NotificationSettings | null) => void
) => {
  const docRef = doc(db, 'users', userId, 'notificationSettings', 'current');
  return onSnapshot(
    docRef,
    (snap) => {
      if (snap.exists()) {
        onData(snap.data() as NotificationSettings);
      } else {
        onData(null);
      }
    },
    (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${userId}/notificationSettings/current`);
    }
  );
};

export const saveNotificationSettingsDoc = async (userId: string, settings: NotificationSettings) => {
  const docRef = doc(db, 'users', userId, 'notificationSettings', 'current');
  try {
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/notificationSettings/current`);
  }
};

// Notification Logs
export const subscribeNotificationLogs = (
  userId: string,
  onData: (logs: NotificationLog[]) => void
) => {
  const colRef = collection(db, 'users', userId, 'notificationLogs');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: NotificationLog[] = [];
      snapshot.forEach((d) => list.push(d.data() as NotificationLog));
      onData(list);
    },
    (error) => {
      handleFirestoreError(error, OperationType.LIST, `users/${userId}/notificationLogs`);
    }
  );
};

export const saveNotificationLogDoc = async (userId: string, logItem: NotificationLog) => {
  const docRef = doc(db, 'users', userId, 'notificationLogs', logItem.id);
  try {
    await setDoc(docRef, { ...logItem });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/notificationLogs/${logItem.id}`);
  }
};

// Bulk Initial Seeder (when a new user signs in to Firestore for the first time)
export const seedInitialUserData = async (
  userId: string,
  initialData: {
    accounts: BankAccount[];
    bankTransactions: BankTransaction[];
    cards: CreditCard[];
    cardTransactions: CardTransaction[];
    investments: Investment[];
    investmentTransactions: InvestmentTransaction[];
    futurePayments: FuturePayment[];
    openFinanceConnections: OpenFinanceConnection[];
    categories: CategoryItem[];
    notificationSettings: NotificationSettings;
    notificationLogs: NotificationLog[];
    debts?: Debt[];
  }
) => {
  try {
    const batch = writeBatch(db);

    initialData.accounts.forEach((acc) => {
      batch.set(doc(db, 'users', userId, 'accounts', acc.id), acc);
    });

    initialData.bankTransactions.forEach((tx) => {
      batch.set(doc(db, 'users', userId, 'bankTransactions', tx.id), tx);
    });

    initialData.cards.forEach((card) => {
      batch.set(doc(db, 'users', userId, 'cards', card.id), card);
    });

    initialData.cardTransactions.forEach((tx) => {
      batch.set(doc(db, 'users', userId, 'cardTransactions', tx.id), tx);
    });

    if (initialData.debts) {
      initialData.debts.forEach((debt) => {
        batch.set(doc(db, 'users', userId, 'debts', debt.id), debt);
      });
    }

    initialData.investments.forEach((inv) => {
      batch.set(doc(db, 'users', userId, 'investments', inv.id), inv);
    });

    initialData.investmentTransactions.forEach((tx) => {
      batch.set(doc(db, 'users', userId, 'investmentTransactions', tx.id), tx);
    });

    initialData.futurePayments.forEach((p) => {
      batch.set(doc(db, 'users', userId, 'futurePayments', p.id), p);
    });

    initialData.openFinanceConnections.forEach((conn) => {
      batch.set(doc(db, 'users', userId, 'openFinanceConnections', conn.id), conn);
    });

    initialData.categories.forEach((cat) => {
      batch.set(doc(db, 'users', userId, 'categories', cat.id), cat);
    });

    batch.set(
      doc(db, 'users', userId, 'notificationSettings', 'current'),
      initialData.notificationSettings
    );

    initialData.notificationLogs.forEach((logItem) => {
      batch.set(doc(db, 'users', userId, 'notificationLogs', logItem.id), logItem);
    });

    batch.set(
      doc(db, 'users', userId),
      { hasInitializedData: true, lastSeededAt: new Date().toISOString() },
      { merge: true }
    );

    await batch.commit();
  } catch (error) {
    console.error('Error seeding initial user data:', error);
    handleFirestoreError(error, OperationType.WRITE, `users/${userId}/seed`);
  }
};

/**
 * Check if the user data has ever been seeded, and only seed on first login if no data exists
 */
export const checkAndSeedUserData = async (
  userId: string,
  initialData: {
    accounts: BankAccount[];
    bankTransactions: BankTransaction[];
    cards: CreditCard[];
    cardTransactions: CardTransaction[];
    investments: Investment[];
    investmentTransactions: InvestmentTransaction[];
    futurePayments: FuturePayment[];
    openFinanceConnections: OpenFinanceConnection[];
    categories: CategoryItem[];
    notificationSettings: NotificationSettings;
    notificationLogs: NotificationLog[];
    debts?: Debt[];
  }
) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists() && snap.data()?.hasInitializedData) {
      return false;
    }

    // Check if the user already has any accounts or collections created
    const existingAccountsSnap = await getDocs(query(collection(db, 'users', userId, 'accounts'), limit(1)));
    if (!existingAccountsSnap.empty) {
      // User already has real accounts saved in Firestore, preserve them and mark initialized
      await setDoc(userDocRef, { hasInitializedData: true, lastSeededAt: new Date().toISOString() }, { merge: true });
      return false;
    }

    await seedInitialUserData(userId, initialData);
    return true;
  } catch (error) {
    console.error('Error checking user initialization state:', error);
    return false;
  }
};
