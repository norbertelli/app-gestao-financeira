import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  loginAsAdmin,
  logoutUser,
  onAuthChange,
  saveUserProfile,
  testConnection,
  safeStorage,
  sendResetPasswordEmail,
  changeUserPassword,
} from '../services/firebase';
import { recordAuditEvent } from '../services/auditLogger';

export type UserRole = 'super_admin' | 'admin' | 'user';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isCloudSynced: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  userRole: UserRole;
  lastSyncAt: Date | null;
  deviceId: string;
  login: () => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, displayName?: string, phone?: string) => Promise<void>;
  loginAsAdmin: (username?: string, password?: string) => Promise<void>;
  loginAsSuperAdmin: () => Promise<void>;
  switchRoleForTesting: (role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  triggerSyncNotification: () => void;
  sendPasswordReset: (email: string) => Promise<void>;
  updateUserPassword: (newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>('user');
  const [lastSyncAt, setLastSyncAt] = useState<Date | null>(new Date());
  const [deviceId] = useState(() => {
    const existing = safeStorage.getItem('finflow_device_id');
    if (existing) return existing;
    const generated = `dev_${Math.random().toString(36).substring(2, 9)}_${navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop'}`;
    safeStorage.setItem('finflow_device_id', generated);
    return generated;
  });

  const evaluateRoles = (activeUser: User | null): { isAdminRole: boolean; isSuperAdminRole: boolean; role: UserRole } => {
    if (!activeUser) {
      return { isAdminRole: false, isSuperAdminRole: false, role: 'user' };
    }

    const emailLower = (activeUser.email || '').toLowerCase();
    const isSuper =
      emailLower === 'norberto.bertelli.nb@gmail.com' ||
      emailLower.includes('superadmin') ||
      activeUser.uid === 'super_admin_master_uid' ||
      safeStorage.getItem('finflow_superadmin_mode') === 'true';

    const isAdminAcc =
      isSuper ||
      emailLower === 'admin@finflow.app' ||
      emailLower.includes('admin') ||
      activeUser.displayName?.includes('Administrador') ||
      safeStorage.getItem('finflow_admin_mode') === 'true';

    const resolvedRole: UserRole = isSuper ? 'super_admin' : isAdminAcc ? 'admin' : 'user';
    return {
      isSuperAdminRole: isSuper,
      isAdminRole: isAdminAcc,
      role: resolvedRole,
    };
  };

  useEffect(() => {
    // Run connection test
    testConnection();

    const unsubscribe = onAuthChange(async (currentUser) => {
      let activeUser = currentUser;
      if (!activeUser) {
        const savedSynthetic = safeStorage.getItem('finflow_synthetic_user');
        if (savedSynthetic) {
          try {
            activeUser = JSON.parse(savedSynthetic);
          } catch (_) {}
        }
      }

      setUser(activeUser);
      const { isAdminRole, isSuperAdminRole, role } = evaluateRoles(activeUser);
      setIsAdmin(isAdminRole);
      setIsSuperAdmin(isSuperAdminRole);
      setUserRole(role);

      if (activeUser) {
        try {
          await saveUserProfile(activeUser, role === 'super_admin' || role === 'admin' ? 'admin' : 'user');
        } catch (err) {
          console.warn('Error saving profile (non-blocking):', err);
        }
      }
      setLoading(false);
      setLastSyncAt(new Date());
    });

    return () => unsubscribe();
  }, []);

  const handleLoginWithGoogle = async () => {
    setLoading(true);
    try {
      safeStorage.removeItem('finflow_admin_mode');
      safeStorage.removeItem('finflow_superadmin_mode');
      const loggedUser = await loginWithGoogle();
      if (loggedUser) {
        setUser(loggedUser);
        const { isAdminRole, isSuperAdminRole, role } = evaluateRoles(loggedUser);
        setIsAdmin(isAdminRole);
        setIsSuperAdmin(isSuperAdminRole);
        setUserRole(role);
        try {
          await saveUserProfile(loggedUser, role === 'user' ? 'user' : 'admin');
        } catch (e) {
          console.warn('Non-blocking profile save:', e);
        }
      }
    } catch (err) {
      console.error('Failed to log in with Google:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      safeStorage.removeItem('finflow_admin_mode');
      safeStorage.removeItem('finflow_superadmin_mode');
      const loggedUser = await loginWithEmail(email, pass);
      if (loggedUser) {
        setUser(loggedUser);
        const { isAdminRole, isSuperAdminRole, role } = evaluateRoles(loggedUser);
        setIsAdmin(isAdminRole);
        setIsSuperAdmin(isSuperAdminRole);
        setUserRole(role);
        try {
          await saveUserProfile(loggedUser, role === 'user' ? 'user' : 'admin');
        } catch (e) {
          console.warn('Non-blocking profile save:', e);
        }
      }
    } catch (err) {
      console.error('Failed to log in with Email:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterWithEmail = async (
    email: string,
    pass: string,
    displayName?: string,
    phone?: string
  ) => {
    setLoading(true);
    try {
      safeStorage.removeItem('finflow_admin_mode');
      safeStorage.removeItem('finflow_superadmin_mode');
      const loggedUser = await registerWithEmail(email, pass, displayName);
      if (loggedUser) {
        setUser(loggedUser);
        const { isAdminRole, isSuperAdminRole, role } = evaluateRoles(loggedUser);
        setIsAdmin(isAdminRole);
        setIsSuperAdmin(isSuperAdminRole);
        setUserRole(role);
        try {
          await saveUserProfile(loggedUser, role === 'user' ? 'user' : 'admin', phone);
        } catch (e) {
          console.warn('Non-blocking profile save:', e);
        }
      }
    } catch (err) {
      console.error('Failed to register:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsAdmin = async (userParam?: string, passParam?: string) => {
    setLoading(true);
    try {
      safeStorage.setItem('finflow_admin_mode', 'true');
      safeStorage.removeItem('finflow_superadmin_mode');
      const adminUser = await loginAsAdmin(userParam, passParam);
      if (adminUser) {
        setUser(adminUser);
        setIsAdmin(true);
        setIsSuperAdmin(false);
        setUserRole('admin');
        try {
          await saveUserProfile(adminUser, 'admin');
        } catch (e) {
          console.warn('Could not save user profile:', e);
        }
        await recordAuditEvent(
          'ADMIN_LOGIN_SUCCESS',
          'AUTH',
          'INFO',
          'Administrador autenticado com credenciais operacionais no sistema.',
          adminUser
        );
      }
    } catch (err) {
      console.error('Failed to log in as admin:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const handleLoginAsSuperAdmin = async () => {
    setLoading(true);
    try {
      safeStorage.setItem('finflow_superadmin_mode', 'true');
      safeStorage.setItem('finflow_admin_mode', 'true');
      const superAdminUser = {
        uid: 'super_admin_master_uid',
        email: 'norberto.bertelli.NB@gmail.com',
        displayName: 'Norberto Bertelli (Super Admin Master)',
        photoURL: '',
        emailVerified: true,
        isAnonymous: false,
      } as unknown as User;

      safeStorage.setItem('finflow_synthetic_user', JSON.stringify(superAdminUser));
      setUser(superAdminUser);
      setIsAdmin(true);
      setIsSuperAdmin(true);
      setUserRole('super_admin');

      await recordAuditEvent(
        'SUPER_ADMIN_LOGIN_SUCCESS',
        'AUTH',
        'INFO',
        'Super Administrador Master autenticado com privilégios irrestritos de gestão.',
        superAdminUser
      );
    } finally {
      setLoading(false);
    }
  };

  const switchRoleForTesting = async (role: UserRole) => {
    setLoading(true);
    try {
      if (role === 'super_admin') {
        safeStorage.setItem('finflow_superadmin_mode', 'true');
        safeStorage.setItem('finflow_admin_mode', 'true');
        const superAdminUser = {
          uid: 'super_admin_master_uid',
          email: 'norberto.bertelli.NB@gmail.com',
          displayName: 'Norberto Bertelli (Super Admin)',
          photoURL: '',
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;
        safeStorage.setItem('finflow_synthetic_user', JSON.stringify(superAdminUser));
        setUser(superAdminUser);
        setIsSuperAdmin(true);
        setIsAdmin(true);
        setUserRole('super_admin');
      } else if (role === 'admin') {
        safeStorage.removeItem('finflow_superadmin_mode');
        safeStorage.setItem('finflow_admin_mode', 'true');
        const adminUser = {
          uid: 'admin_manager_uid',
          email: 'admin@finflow.app',
          displayName: 'Gestor Administrativo (Admin)',
          photoURL: '',
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;
        safeStorage.setItem('finflow_synthetic_user', JSON.stringify(adminUser));
        setUser(adminUser);
        setIsSuperAdmin(false);
        setIsAdmin(true);
        setUserRole('admin');
      } else {
        safeStorage.removeItem('finflow_superadmin_mode');
        safeStorage.removeItem('finflow_admin_mode');
        const standardUser = {
          uid: 'user_regular_uid_101',
          email: 'usuario.comum@exemplo.com',
          displayName: 'João Silva (Usuário Comum)',
          photoURL: '',
          emailVerified: true,
          isAnonymous: false,
        } as unknown as User;
        safeStorage.setItem('finflow_synthetic_user', JSON.stringify(standardUser));
        setUser(standardUser);
        setIsSuperAdmin(false);
        setIsAdmin(false);
        setUserRole('user');
      }
      setLastSyncAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await recordAuditEvent(
        'USER_LOGOUT',
        'AUTH',
        'INFO',
        `Sessão encerrada com sucesso para ${user?.email || 'usuário atual'}.`,
        user
      );
      safeStorage.removeItem('finflow_admin_mode');
      safeStorage.removeItem('finflow_superadmin_mode');
      safeStorage.removeItem('finflow_synthetic_user');
      await logoutUser();
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserRole('user');
    } catch (err) {
      console.error('Failed to log out:', err);
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      setUserRole('user');
    } finally {
      setLoading(false);
    }
  };

  const triggerSyncNotification = () => {
    setLastSyncAt(new Date());
  };

  const sendPasswordReset = async (emailToReset: string) => {
    await sendResetPasswordEmail(emailToReset);
    await recordAuditEvent(
      'PASSWORD_RESET_REQUESTED',
      'AUTH',
      'INFO',
      `Solicitação de recuperação de senha enviada para: ${emailToReset}`
    );
  };

  const updateUserPassword = async (newPassword: string) => {
    await changeUserPassword(newPassword);
    await recordAuditEvent(
      'PASSWORD_CHANGED',
      'AUTH',
      'INFO',
      'Senha de acesso atualizada pelo usuário no sistema.',
      user || undefined
    );
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isCloudSynced: true,
        isAdmin,
        isSuperAdmin,
        userRole,
        lastSyncAt,
        deviceId,
        login: handleLoginWithGoogle,
        loginWithGoogle: handleLoginWithGoogle,
        loginWithEmail: handleLoginWithEmail,
        registerWithEmail: handleRegisterWithEmail,
        loginAsAdmin: handleLoginAsAdmin,
        loginAsSuperAdmin: handleLoginAsSuperAdmin,
        switchRoleForTesting,
        logout,
        triggerSyncNotification,
        sendPasswordReset,
        updateUserPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
