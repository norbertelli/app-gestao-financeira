import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  limit,
} from 'firebase/firestore';
import { SubscriptionPlanId, SubscriptionStatus } from '../types/subscription';

export interface SubscriberUser {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  role?: 'admin' | 'user';
  subscriptionPlan: SubscriptionPlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionExpiresAt?: string;
  subscriptionUpdatedAt?: string;
  createdAt?: string;
  asaasCustomerId?: string;
  asaasPaymentId?: string;
  lastPaymentAmount?: number;
  paymentMethod?: string;
}

// Default mock/demo subscribers in case Firestore is freshly started or empty
const DEMO_SUBSCRIBERS: SubscriberUser[] = [
  {
    userId: 'sub_demo_1',
    displayName: 'Norberto Bertelli (Admin)',
    email: 'norberto.bertelli.NB@gmail.com',
    phone: '5511932058703',
    role: 'admin',
    subscriptionPlan: 'ENTERPRISE',
    subscriptionStatus: 'ACTIVE',
    createdAt: '2026-01-10T10:00:00.000Z',
    subscriptionUpdatedAt: '2026-10-14T10:00:00.000Z',
    lastPaymentAmount: 119.9,
    paymentMethod: 'PIX',
  },
  {
    userId: 'sub_demo_2',
    displayName: 'Carlos Eduardo Silveira',
    email: 'carlos.silveira@contabilidade.com.br',
    phone: '5511988776655',
    role: 'user',
    subscriptionPlan: 'PRO_ANUAL',
    subscriptionStatus: 'ACTIVE',
    createdAt: '2026-02-15T14:30:00.000Z',
    subscriptionUpdatedAt: '2026-02-15T14:30:00.000Z',
    lastPaymentAmount: 349.9,
    paymentMethod: 'CREDIT_CARD',
  },
  {
    userId: 'sub_demo_3',
    displayName: 'Mariana Duarte Mendes',
    email: 'mariana.mendes@financas.com',
    phone: '5511977665544',
    role: 'user',
    subscriptionPlan: 'PRO_MENSAL',
    subscriptionStatus: 'ACTIVE',
    createdAt: '2026-03-01T09:15:00.000Z',
    subscriptionUpdatedAt: '2026-10-01T09:15:00.000Z',
    lastPaymentAmount: 39.9,
    paymentMethod: 'PIX',
  },
  {
    userId: 'sub_demo_4',
    displayName: 'Rodrigo Fontana Alcantara',
    email: 'rodrigo.fontana@empresa.com.br',
    phone: '5511966554433',
    role: 'user',
    subscriptionPlan: 'FREE',
    subscriptionStatus: 'ACTIVE',
    createdAt: '2026-09-20T16:45:00.000Z',
  },
];

export const fetchAllSubscribers = async (): Promise<SubscriberUser[]> => {
  try {
    const usersCol = collection(db, 'users');
    const snapshot = await getDocs(usersCol);

    if (!snapshot.empty) {
      const usersList: SubscriberUser[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        usersList.push({
          userId: docSnap.id,
          displayName: data.displayName || 'Sem nome',
          email: data.email || 'sem-email@app.com',
          phone: data.phone || '',
          role: data.role || 'user',
          subscriptionPlan: (data.subscriptionPlan as SubscriptionPlanId) || 'FREE',
          subscriptionStatus: (data.subscriptionStatus as SubscriptionStatus) || 'ACTIVE',
          subscriptionExpiresAt: data.subscriptionExpiresAt,
          subscriptionUpdatedAt: data.subscriptionUpdatedAt || data.updatedAt,
          createdAt: data.createdAt,
          asaasCustomerId: data.asaasCustomerId,
          asaasPaymentId: data.asaasPaymentId,
          lastPaymentAmount: data.lastPaymentAmount,
          paymentMethod: data.paymentMethod,
        });
      });
      return usersList;
    }
  } catch (error) {
    console.warn('Could not fetch real users from Firestore, using local demo set:', error);
  }

  // Return fallback demo subscribers
  return DEMO_SUBSCRIBERS;
};

export const updateSubscriberPlan = async (
  userId: string,
  planId: SubscriptionPlanId,
  status: SubscriptionStatus = 'ACTIVE'
): Promise<void> => {
  const expiresAt = new Date();
  if (planId === 'PRO_ANUAL') {
    expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  } else {
    expiresAt.setMonth(expiresAt.getMonth() + 1);
  }

  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      subscriptionPlan: planId,
      subscriptionStatus: status,
      isPro: planId !== 'FREE',
      subscriptionExpiresAt: expiresAt.toISOString(),
      subscriptionUpdatedAt: new Date().toISOString(),
    });

    const subRef = doc(db, 'users', userId, 'subscriptions', 'current');
    await setDoc(
      subRef,
      {
        userId,
        planId,
        status,
        expiresAt: expiresAt.toISOString(),
        updatedAt: new Date().toISOString(),
        autoRenew: true,
      },
      { merge: true }
    );
  } catch (e) {
    console.warn('Error updating subscriber in Firestore:', e);
  }
};

export const updateSubscriberPhone = async (
  userId: string,
  phone: string
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      phone: phone.trim(),
      updatedAt: new Date().toISOString(),
    });
  } catch (e) {
    console.warn('Error updating subscriber phone:', e);
  }
};

export const deleteSubscriber = async (userId: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'users', userId));
  } catch (e) {
    console.warn('Error deleting subscriber from Firestore:', e);
  }
};

export const getWhatsAppDirectUrl = (
  phone: string,
  clientName: string,
  planName?: string
): string => {
  const cleanPhone = phone.replace(/\D/g, '');
  const greeting = `Olá, ${clientName || 'Cliente'}! Aqui é o suporte oficial do FinFlow Gestão Financeira.${
    planName ? ` Notamos seu interesse no plano ${planName}.` : ''
  } Como podemos ajudar você hoje?`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(greeting)}`;
};
