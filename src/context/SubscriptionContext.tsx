import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  SubscriptionPlanId,
  SubscriptionStatus,
  UserSubscriptionState,
  SubscriptionPlan,
  SUBSCRIPTION_PLANS,
  AsaasCheckoutRequest,
  AsaasCheckoutResponse,
} from '../types/subscription';
import {
  getUserSubscription,
  activateUserSubscription,
  cancelUserSubscription,
  processAsaasCheckout,
} from '../services/asaasService';
import { db } from '../services/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

interface UpgradeModalOptions {
  isOpen: boolean;
  featureTitle?: string;
  featureDescription?: string;
  recommendedPlan?: SubscriptionPlanId;
}

interface FeatureCheckResult {
  allowed: boolean;
  currentCount?: number;
  maxLimit?: number;
  message?: string;
}

interface SubscriptionContextType {
  subscription: UserSubscriptionState;
  currentPlan: SubscriptionPlan;
  isPro: boolean;
  status: SubscriptionStatus;
  loading: boolean;
  upgradeModal: UpgradeModalOptions;
  openUpgradeModal: (options?: { featureTitle?: string; featureDescription?: string; recommendedPlan?: SubscriptionPlanId }) => void;
  closeUpgradeModal: () => void;
  canAddAccount: (currentCount: number) => FeatureCheckResult;
  canAddCard: (currentCount: number) => FeatureCheckResult;
  canAddTransaction: (currentMonthlyCount: number) => FeatureCheckResult;
  hasFeature: (featureKey: 'AI_STATEMENT' | 'EXECUTIVE_EXPORT' | 'SECURITY_AUDIT' | 'MULTI_USER' | 'UNLIMITED_CATEGORIES') => boolean;
  checkoutPlan: (req: Omit<AsaasCheckoutRequest, 'userId' | 'userEmail' | 'userName'>) => Promise<AsaasCheckoutResponse>;
  cancelSubscription: () => Promise<void>;
  simulateActivatePro: () => Promise<void>;
  refreshSubscription: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

export const SubscriptionProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<UserSubscriptionState>({
    userId: user?.uid || 'guest',
    planId: 'FREE',
    status: 'ACTIVE',
    startedAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(),
    autoRenew: false,
  });

  const [upgradeModal, setUpgradeModal] = useState<UpgradeModalOptions>({
    isOpen: false,
    featureTitle: undefined,
    featureDescription: undefined,
    recommendedPlan: 'PRO_MENSAL',
  });

  // Fetch and listen to subscription changes
  useEffect(() => {
    if (!user) {
      setSubscription({
        userId: 'guest',
        planId: 'FREE',
        status: 'ACTIVE',
        startedAt: new Date().toISOString(),
        expiresAt: new Date().toISOString(),
        autoRenew: false,
      });
      setLoading(false);
      return;
    }

    setLoading(true);

    // Initial load
    getUserSubscription(user.uid)
      .then((sub) => {
        setSubscription(sub);
      })
      .catch((err) => {
        console.warn('Error loading initial subscription:', err);
      })
      .finally(() => {
        setLoading(false);
      });

    // Realtime listener on Firestore user subscription
    const subDocRef = doc(db, 'users', user.uid, 'subscriptions', 'current');
    const unsubscribe = onSnapshot(
      subDocRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data() as UserSubscriptionState;
          setSubscription(data);
        }
      },
      (error) => {
        console.warn('Subscription realtime listener notice:', error.message);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Is the user Pro or Enterprise? (Admin always has PRO access)
  const isPro = useMemo(() => {
    if (isAdmin) return true;
    if (subscription.status !== 'ACTIVE' && subscription.status !== 'TRIAL') return false;
    return subscription.planId === 'PRO_MENSAL' || subscription.planId === 'PRO_ANUAL' || subscription.planId === 'ENTERPRISE';
  }, [isAdmin, subscription.status, subscription.planId]);

  const currentPlan = useMemo(() => {
    return SUBSCRIPTION_PLANS[subscription.planId] || SUBSCRIPTION_PLANS.FREE;
  }, [subscription.planId]);

  const openUpgradeModal = (options?: {
    featureTitle?: string;
    featureDescription?: string;
    recommendedPlan?: SubscriptionPlanId;
  }) => {
    setUpgradeModal({
      isOpen: true,
      featureTitle: options?.featureTitle,
      featureDescription: options?.featureDescription,
      recommendedPlan: options?.recommendedPlan || 'PRO_MENSAL',
    });
  };

  const closeUpgradeModal = () => {
    setUpgradeModal((prev) => ({ ...prev, isOpen: false }));
  };

  // Feature Limits Checkers
  const canAddAccount = (currentCount: number): FeatureCheckResult => {
    if (isPro) return { allowed: true, currentCount, maxLimit: 9999 };
    const max = currentPlan.limits.maxAccounts;
    if (currentCount >= max) {
      return {
        allowed: false,
        currentCount,
        maxLimit: max,
        message: `Você atingiu o limite de ${max} contas bancárias do Plano Grátis. Faça upgrade para o FinFlow PRO para cadastrar contas ilimitadas.`,
      };
    }
    return { allowed: true, currentCount, maxLimit: max };
  };

  const canAddCard = (currentCount: number): FeatureCheckResult => {
    if (isPro) return { allowed: true, currentCount, maxLimit: 9999 };
    const max = currentPlan.limits.maxCards;
    if (currentCount >= max) {
      return {
        allowed: false,
        currentCount,
        maxLimit: max,
        message: `Você atingiu o limite de ${max} cartões de crédito do Plano Grátis. Faça upgrade para o FinFlow PRO para cartões ilimitados.`,
      };
    }
    return { allowed: true, currentCount, maxLimit: max };
  };

  const canAddTransaction = (currentMonthlyCount: number): FeatureCheckResult => {
    if (isPro) return { allowed: true, currentCount: currentMonthlyCount, maxLimit: 999999 };
    const max = currentPlan.limits.maxMonthlyTransactions;
    if (currentMonthlyCount >= max) {
      return {
        allowed: false,
        currentCount: currentMonthlyCount,
        maxLimit: max,
        message: `Você atingiu o limite de ${max} lançamentos mensais no Plano Grátis. Desbloqueie lançamentos ilimitados com o FinFlow PRO!`,
      };
    }
    return { allowed: true, currentCount: currentMonthlyCount, maxLimit: max };
  };

  const hasFeature = (
    featureKey: 'AI_STATEMENT' | 'EXECUTIVE_EXPORT' | 'SECURITY_AUDIT' | 'MULTI_USER' | 'UNLIMITED_CATEGORIES'
  ): boolean => {
    if (isPro) return true;
    switch (featureKey) {
      case 'AI_STATEMENT':
        return currentPlan.limits.allowAdvancedAI;
      case 'EXECUTIVE_EXPORT':
        return currentPlan.limits.allowExecutiveExport;
      case 'SECURITY_AUDIT':
        return currentPlan.limits.allowAuditSecurity;
      case 'MULTI_USER':
        return currentPlan.limits.allowMultiUser;
      case 'UNLIMITED_CATEGORIES':
        return currentPlan.limits.allowUnlimitedCategories;
      default:
        return false;
    }
  };

  // Checkout Asaas helper
  const checkoutPlan = async (
    req: Omit<AsaasCheckoutRequest, 'userId' | 'userEmail' | 'userName'>
  ): Promise<AsaasCheckoutResponse> => {
    if (!user) {
      throw new Error('Você precisa estar autenticado para assinar.');
    }

    const fullRequest: AsaasCheckoutRequest = {
      ...req,
      userId: user.uid,
      userEmail: user.email || 'usuario@finflow.app',
      userName: user.displayName || 'Usuário FinFlow',
    };

    const response = await processAsaasCheckout(fullRequest);
    if (response.status === 'ACTIVE') {
      const updated = await getUserSubscription(user.uid);
      setSubscription(updated);
    }
    return response;
  };

  const cancelSubscription = async () => {
    if (!user) return;
    await cancelUserSubscription(user.uid);
    const updated = await getUserSubscription(user.uid);
    setSubscription(updated);
  };

  // Instant simulation helper for sandbox testing
  const simulateActivatePro = async () => {
    if (!user) return;
    const activated = await activateUserSubscription(user.uid, 'PRO_MENSAL', {
      paymentMethod: 'PIX',
      amount: 39.9,
    });
    setSubscription(activated);
    closeUpgradeModal();
  };

  const refreshSubscription = async () => {
    if (!user) return;
    const sub = await getUserSubscription(user.uid);
    setSubscription(sub);
  };

  return (
    <SubscriptionContext.Provider
      value={{
        subscription,
        currentPlan,
        isPro,
        status: subscription.status,
        loading,
        upgradeModal,
        openUpgradeModal,
        closeUpgradeModal,
        canAddAccount,
        canAddCard,
        canAddTransaction,
        hasFeature,
        checkoutPlan,
        cancelSubscription,
        simulateActivatePro,
        refreshSubscription,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = (): SubscriptionContextType => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
